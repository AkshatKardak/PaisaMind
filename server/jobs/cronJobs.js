const cron    = require("node-cron");
const Invoice = require("../models/Invoice");
const Goal    = require("../models/Goal");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const startCronJobs = () => {

  // ─── 1. Auto-flip Unpaid invoices to Overdue every midnight ─────────────────
  // Runs daily at 00:05 IST. Finds all Unpaid invoices whose dueDate has passed
  // and bulk-updates them to Overdue so the frontend always shows correct status
  // without the user having to manually change anything.
  cron.schedule("5 0 * * *", async () => {
    try {
      const result = await Invoice.updateMany(
        { status: "Unpaid", dueDate: { $lt: new Date() } },
        { $set: { status: "Overdue" } }
      );
      if (result.modifiedCount > 0) {
        console.log(`[cron] Marked ${result.modifiedCount} invoice(s) as Overdue`);
      }
    } catch (err) {
      console.error("[cron] Overdue flip failed:", err.message);
    }
  });

  // ─── 2. Weekly overdue reminder emails — every Monday 9 AM ──────────────────
  cron.schedule("0 9 * * 1", async () => {
    try {
      const overdueInvoices = await Invoice.find({ status: "Overdue" }).populate("userId");
      for (const invoice of overdueInvoices) {
        if (!invoice.clientEmail) continue;
        try {
          await resend.emails.send({
            from:    process.env.EMAIL_FROM,
            to:      invoice.clientEmail,
            subject: `Overdue invoice ${invoice.invoiceNumber}`,
            html:    `<p>Hi ${invoice.clientName},</p><p>Invoice <strong>${invoice.invoiceNumber}</strong> for ₹${invoice.totalAmount || invoice.amount} is overdue. Please arrange payment at your earliest convenience.</p><p>PaisaMind</p>`,
          });
        } catch (emailErr) {
          console.error(`[cron] Email failed for ${invoice.invoiceNumber}:`, emailErr.message);
        }
      }
    } catch (err) {
      console.error("[cron] Overdue email job failed:", err.message);
    }
  });

  // ─── 3. Monthly goal completion check — 1st of each month, 9 AM ─────────────
  cron.schedule("0 9 1 * *", async () => {
    try {
      const goals = await Goal.find({ status: "Active" }).populate("userId");
      for (const goal of goals) {
        try {
          if (goal.savedAmount >= goal.targetAmount) {
            await resend.emails.send({
              from:    process.env.EMAIL_FROM,
              to:      goal.userId.email,
              subject: `🎉 Goal completed: ${goal.name}`,
              html:    `<p>Hi ${goal.userId.name},</p><p>You have completed your goal <strong>${goal.name}</strong>! You saved ₹${goal.savedAmount}. Keep up the great work!</p><p>PaisaMind</p>`,
            });
            await Goal.findByIdAndUpdate(goal._id, { status: "Completed" });
          }
        } catch (emailErr) {
          console.error(`[cron] Goal email failed for ${goal.name}:`, emailErr.message);
        }
      }
    } catch (err) {
      console.error("[cron] Goal check job failed:", err.message);
    }
  });

};

module.exports = startCronJobs;
