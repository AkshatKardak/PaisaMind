const asyncHandler = require("express-async-handler");
const Invoice = require("../models/Invoice");
const User    = require("../models/User");
const { Resend } = require("resend");
const { createInvoicePaymentLink, verifyWebhookSignature } = require("../utils/razorpayService");
const PDFDocument = require("pdfkit");

const resend = new Resend(process.env.RESEND_API_KEY);

const ALLOWED_UPDATE_FIELDS = [
  "clientName", "clientEmail", "clientPhone",
  "serviceDescription", "amount", "totalAmount",
  "gstApplicable", "issueDate", "dueDate",
  "items", "notes",
];

const getInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: invoices });
});

const getSummary = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ userId: req.user._id });
  const totalBilled   = invoices.reduce((s, inv) => s + (inv.totalAmount || inv.amount || 0), 0);
  const totalReceived = invoices.filter((inv) => inv.status === "Paid").reduce((s, inv) => s + (inv.totalAmount || inv.amount || 0), 0);
  const totalPending  = invoices.filter((inv) => inv.status !== "Paid").reduce((s, inv) => s + (inv.totalAmount || inv.amount || 0), 0);
  res.status(200).json({ success: true, data: { totalBilled, totalReceived, totalPending } });
});

const createInvoice = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  const { clientName, clientEmail, clientPhone, serviceDescription, amount, issueDate, dueDate, gstApplicable, items, notes } = req.body;

  if (!clientName || !amount) {
    return res.status(400).json({ success: false, message: "Client name and amount are required" });
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $inc: { invoiceSeq: 1 } },
    { new: true }
  );
  const invoiceNumber = `INV-${String(updatedUser.invoiceSeq).padStart(3, "0")}`;

  const baseAmount  = Number(amount) || 0;
  const totalAmount = gstApplicable ? Math.round(baseAmount * 1.18) : baseAmount;

  const invoice = await Invoice.create({
    userId: req.user._id,
    invoiceNumber,
    clientName,
    clientEmail:        clientEmail || "",
    clientPhone:        clientPhone || "",
    serviceDescription: serviceDescription || "",
    amount:             baseAmount,
    totalAmount,
    gstApplicable:      !!gstApplicable,
    issueDate:          issueDate ? new Date(issueDate) : new Date(),
    dueDate:            dueDate   ? new Date(dueDate)   : new Date(),
    items:              items || [],
    notes:              notes || "",
    status:             "Unpaid",
  });

  res.status(201).json({ success: true, data: invoice });
});

const updateInvoice = asyncHandler(async (req, res) => {
  const safeUpdate = {};
  ALLOWED_UPDATE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) safeUpdate[field] = req.body[field];
  });

  if (Object.keys(safeUpdate).length === 0) {
    return res.status(400).json({ success: false, message: "No valid fields to update" });
  }

  const invoice = await Invoice.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    safeUpdate,
    { new: true }
  );

  if (!invoice) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }

  res.status(200).json({ success: true, data: invoice });
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const normalized = status
    ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    : "Paid";

  const update = { status: normalized };
  if (normalized === "Paid") update.paidAt = new Date();

  const invoice = await Invoice.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    update,
    { new: true }
  );

  if (!invoice) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }

  res.status(200).json({ success: true, data: invoice });
});

const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!invoice) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }
  res.status(200).json({ success: true, message: "Invoice deleted" });
});

const sendReminder = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
  if (!invoice) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }

  if (invoice.clientEmail) {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@paisamind.com",
      to:   invoice.clientEmail,
      subject: `Payment reminder for ${invoice.invoiceNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color: #0ea5e9;">Payment Reminder</h2>
          <p>Hi ${invoice.clientName},</p>
          <p>This is a friendly reminder that invoice <strong>${invoice.invoiceNumber}</strong> for
          <strong>\u20b9${invoice.totalAmount || invoice.amount}</strong> is pending.</p>
          ${invoice.paymentLink ? `<p><a href="${invoice.paymentLink}" style="background:#0ea5e9;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Pay Now</a></p>` : ""}
          <p style="color:#888;font-size:12px;">PaisaMind — Finance OS for Freelancers</p>
        </div>
      `,
    });
  }

  res.status(200).json({ success: true, message: "Reminder sent" });
});

const createCheckoutSession = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
  if (!invoice) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }

  const link = await createInvoicePaymentLink(invoice);
  await Invoice.findByIdAndUpdate(invoice._id, { paymentLink: link.url });
  res.status(200).json({ success: true, data: { url: link.url } });
});

const handleWebhook = (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  if (signature) {
    const rawBody = JSON.stringify(req.body);
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  }

  const event = req.body;

  if (event?.event === "payment_link.paid") {
    const invoiceId = event?.payload?.payment_link?.entity?.notes?.invoiceId;
    if (invoiceId) {
      Invoice.findByIdAndUpdate(invoiceId, {
        status: "Paid",
        paidAt: new Date(),
      }).catch(console.error);
    }
  }

  res.status(200).json({ received: true });
};

const downloadPDF = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id })
    .populate("userId", "name email");
  if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

  const user = invoice.userId;

  res.setHeader("Content-Type",        "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.pdf"`);

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(res);

  const PRIMARY  = "#0891b2";
  const DARK     = "#0f172a";
  const MUTED    = "#64748b";
  const LIGHT_BG = "#f8fafc";

  // Header band
  doc.rect(0, 0, doc.page.width, 90).fill(PRIMARY);
  doc.fillColor("#ffffff").fontSize(24).font("Helvetica-Bold").text("PaisaMind", 50, 28);
  doc.fontSize(9).font("Helvetica").text("Finance OS for Freelancers", 50, 56);
  doc.fontSize(20).font("Helvetica-Bold").text("INVOICE", 0, 34, { align: "right", width: doc.page.width - 50 });
  doc.fontSize(10).font("Helvetica").text(invoice.invoiceNumber, 0, 58, { align: "right", width: doc.page.width - 50 });

  // Metadata block
  doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold").text("Billed To", 50, 110);
  doc.font("Helvetica").fillColor(DARK).fontSize(10).text(invoice.clientName, 50, 126);
  if (invoice.clientEmail) doc.fillColor(MUTED).text(invoice.clientEmail, 50, 141);

  const rightX = 350;
  const pairs  = [
    ["Issue Date", new Date(invoice.issueDate).toLocaleDateString("en-IN")],
    ["Due Date",   new Date(invoice.dueDate).toLocaleDateString("en-IN")],
    ["Status",     invoice.status],
  ];
  let ry = 110;
  pairs.forEach(([label, val]) => {
    doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(label, rightX, ry);
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10).text(val, rightX + 90, ry);
    ry += 18;
  });

  // Divider
  doc.moveTo(50, 185).lineTo(doc.page.width - 50, 185).strokeColor("#e2e8f0").stroke();

  // Service Description
  if (invoice.serviceDescription) {
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10).text("Description", 50, 198);
    doc.font("Helvetica").fillColor(MUTED).fontSize(10)
      .text(invoice.serviceDescription, 50, 214, { width: doc.page.width - 100 });
  }

  // Amounts table
  const tableY = invoice.serviceDescription ? 260 : 210;
  doc.rect(50, tableY, doc.page.width - 100, 28).fill(LIGHT_BG);

  const colW = (doc.page.width - 100) / 2;
  doc.fillColor(MUTED).font("Helvetica").fontSize(9)
    .text("Item",   60,        tableY + 9)
    .text("Amount", 60 + colW, tableY + 9, { width: colW - 10, align: "right" });

  let rowY = tableY + 28;
  const addRow = (label, value, bold = false) => {
    doc.fillColor(DARK).font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10)
      .text(label, 60, rowY)
      .text(value, 60 + colW, rowY, { width: colW - 10, align: "right" });
    rowY += 24;
  };

  addRow("Base Amount", `\u20b9${invoice.amount.toLocaleString("en-IN")}`);
  if (invoice.gstApplicable) {
    const gst = invoice.totalAmount - invoice.amount;
    addRow("GST (18%)", `\u20b9${gst.toLocaleString("en-IN")}`);
  }
  doc.moveTo(50, rowY).lineTo(doc.page.width - 50, rowY).strokeColor("#e2e8f0").stroke();
  rowY += 10;
  addRow("Total", `\u20b9${(invoice.totalAmount || invoice.amount).toLocaleString("en-IN")}`, true);

  // Footer
  const footerY = doc.page.height - 70;
  doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).strokeColor("#e2e8f0").stroke();
  doc.fillColor(MUTED).font("Helvetica").fontSize(8)
    .text(`Generated by PaisaMind  ·  ${user?.name || ""}  ·  ${user?.email || ""}`, 50, footerY + 12, {
      align: "center", width: doc.page.width - 100,
    });

  doc.end();
});

module.exports = {
  getInvoices,
  getSummary,
  createInvoice,
  updateInvoice,
  updateStatus,
  deleteInvoice,
  sendReminder,
  createCheckoutSession,
  handleWebhook,
  downloadPDF,
};
