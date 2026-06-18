const cron    = require("node-cron");
const Invoice = require("../models/Invoice");
const Goal    = require("../models/Goal");
const Income               = require("../models/Income");
const Expense              = require("../models/Expense");
const RecurringTransaction = require("../models/RecurringTransaction");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const startCronJobs = () => {

  // ─── 1. Auto-flip Unpaid invoices to Overdue every midnight ─────────────────
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

  // ─── 4. Process recurring transactions — every hour ─────────────────────────
  // Finds all active recurring transactions whose nextRunAt has passed,
  // creates the real Income/Expense entry, then advances nextRunAt.
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const due = await RecurringTransaction.find({ active: true, nextRunAt: { $lte: now } });

      for (const rec of due) {
        try {
          if (rec.type === "income") {
            await Income.create({
              userId:   rec.userId,
              source:   rec.title,
              category: rec.category,
              amount:   rec.amount,
              date:     now,
              notes:    `Auto-created from recurring: ${rec.title}`,
            });
          } else {
            await Expense.create({
              userId:      rec.userId,
              title:       rec.title,
              category:    rec.category,
              amount:      rec.amount,
              date:        now,
              isRecurring: true,
              notes:       `Auto-created from recurring: ${rec.title}`,
            });
          }

          // Advance nextRunAt
          const next = new Date(rec.nextRunAt);
          if      (rec.frequency === "daily")   next.setDate(next.getDate() + 1);
          else if (rec.frequency === "weekly")  next.setDate(next.getDate() + 7);
          else                                  next.setMonth(next.getMonth() + 1);

          await RecurringTransaction.findByIdAndUpdate(rec._id, { nextRunAt: next });
          console.log(`[cron] Processed recurring: ${rec.title} (${rec.type}), next: ${next.toISOString()}`);
        } catch (entryErr) {
          console.error(`[cron] Recurring entry failed for ${rec.title}:`, entryErr.message);
        }
      }
    } catch (err) {
      console.error("[cron] Recurring processor failed:", err.message);
    }
  });

};

module.exports = startCronJobs;
