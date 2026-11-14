/**
 * Payment Reconciliation Service
 * Implements Section 5.2 Payment verification:
 * - Single internal function reconcilePayment(paymentEntity)
 * - verifyInvoicePayment(invoiceId, userId)
 * - sweepPendingInvoices()
 * - Constant-time timingSafeEqual guard for SWEEP_TOKEN
 */

const crypto = require("crypto");
const Invoice = require("../models/Invoice");
const { razorpay } = require("../utils/razorpayService");

/**
 * Single internal reconciliation function.
 * Called by both GET /api/invoices/:id/verify-payment, scheduled sweep, and any future webhooks.
 * Adding a webhook later is a route, not a refactor.
 * Idempotent: re-running on an already-paid invoice is a safe no-op.
 *
 * @param {Object} paymentEntity - Payment object (Razorpay format or standard format)
 * @returns {Promise<Object>} Reconciliation result
 */
async function reconcilePayment(paymentEntity) {
  if (!paymentEntity) {
    return { success: false, reason: "No payment entity provided" };
  }

  const invoiceId = paymentEntity.notes?.invoiceId || paymentEntity.invoiceId;
  const invoiceNumber = paymentEntity.notes?.invoiceNumber || paymentEntity.invoiceNumber;

  let invoice = null;
  if (invoiceId) {
    invoice = await Invoice.findById(invoiceId);
  } else if (invoiceNumber) {
    invoice = await Invoice.findOne({ invoiceNumber });
  }

  if (!invoice) {
    return { success: false, reason: "Invoice not found for payment entity" };
  }

  // Idempotency check: if invoice is already paid, do not re-process
  const isAlreadyPaid = invoice.status === "Paid" || invoice.status === "paid";
  const isCaptured =
    paymentEntity.status === "captured" ||
    paymentEntity.status === "paid" ||
    paymentEntity.captured === true;

  if (isCaptured) {
    if (isAlreadyPaid) {
      return {
        success: true,
        reconciled: true,
        idempotent: true,
        status: "paid",
        invoice
      };
    }

    // Mark as paid
    invoice.status = "Paid";
    invoice.paidAt = new Date();
    await invoice.save();

    return {
      success: true,
      reconciled: true,
      idempotent: false,
      newlyPaid: true,
      status: "paid",
      invoice
    };
  }

  // Payment is pending or initiated
  if (!isAlreadyPaid && invoice.status !== "payment_initiated") {
    // If user attempted payment
    if (paymentEntity.status === "authorized" || paymentEntity.status === "created") {
      invoice.status = "payment_initiated";
      await invoice.save();
    }
  }

  return {
    success: true,
    reconciled: false,
    status: invoice.status.toLowerCase(),
    invoice
  };
}

/**
 * Verify payment status for an invoice.
 * Calls Razorpay API server-side, reconciles, and returns current state.
 */
async function verifyInvoicePayment(invoiceId, userId) {
  const query = { _id: invoiceId };
  if (userId) query.userId = userId;

  const invoice = await Invoice.findOne(query);
  if (!invoice) {
    return { success: false, message: "Invoice not found" };
  }

  // If already paid, return state
  if (invoice.status === "Paid" || invoice.status === "paid") {
    return {
      success: true,
      status: "paid",
      invoice
    };
  }

  // If paymentLink exists and Razorpay is configured, poll Razorpay
  const hasRazorpayKeys =
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_ID !== "rzp_test_your_key_here";

  if (hasRazorpayKeys && invoice.paymentLink && razorpay) {
    try {
      // If invoice has payment link ID, fetch it
      const linkId = invoice.paymentLink.split("/").pop();
      if (linkId && linkId.startsWith("plink_")) {
        const linkData = await razorpay.paymentLink.fetch(linkId);
        if (linkData && linkData.payments && linkData.payments.length > 0) {
          const latestPayment = linkData.payments[linkData.payments.length - 1];
          const reconResult = await reconcilePayment({
            ...latestPayment,
            notes: { invoiceId: String(invoice._id), invoiceNumber: invoice.invoiceNumber }
          });
          return {
            success: true,
            status: reconResult.status,
            invoice: reconResult.invoice
          };
        }
      }
    } catch (err) {
      console.warn("[PaymentVerify] Razorpay poll check warning:", err.message);
    }
  }

  // Normalize status response
  const normalizedStatus =
    invoice.status === "Paid" ? "paid" :
    invoice.status === "payment_initiated" ? "payment_initiated" : "sent";

  return {
    success: true,
    status: normalizedStatus,
    invoice
  };
}

/**
 * Scheduled Sweep: Pulls invoices in 'sent' or 'payment_initiated' or 'Unpaid',
 * calls reconcilePayment on each, and exits.
 */
async function sweepPendingInvoices() {
  const pendingInvoices = await Invoice.find({
    status: { $in: ["sent", "payment_initiated", "Unpaid", "unpaid"] }
  });

  let sweptCount = 0;
  let paidCount = 0;

  for (const inv of pendingInvoices) {
    sweptCount++;
    const result = await verifyInvoicePayment(inv._id);
    if (result.status === "paid") {
      paidCount++;
    }
  }

  return {
    sweptCount,
    paidCount,
    timestamp: new Date().toISOString()
  };
}

/**
 * Constant-time comparison for SWEEP_TOKEN
 */
function verifySweepToken(providedToken) {
  const secret = process.env.SWEEP_TOKEN;
  if (!secret || typeof secret !== "string" || !providedToken || typeof providedToken !== "string") {
    return false;
  }

  const a = Buffer.from(providedToken, "utf8");
  const b = Buffer.from(secret, "utf8");

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

module.exports = {
  reconcilePayment,
  verifyInvoicePayment,
  sweepPendingInvoices,
  verifySweepToken
};
