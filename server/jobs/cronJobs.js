const cron = require("node-cron");
const Invoice = require("../models/Invoice");
const Goal = require("../models/Goal");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const RecurringTransaction = require("../models/RecurringTransaction");
const User = require("../models/User");
const Anomaly = require("../models/Anomaly");
const { detectSpendingAnomalies, detectDuplicates } = require("../services/anomalyService");
const { Resend } = require("resend");
const logger = require("../services/logger");

const resend = new Resend(process.env.RESEND_API_KEY);

let isScheduled = false;

/**
 * Pings the configured public health check URL.
 * Returns true if ping succeeded (2xx), false otherwise.
 */
const pingHealthCheck = async (url = process.env.BACKEND_URL) => {
  if (!url) {
    console.warn("[cron] BACKEND_URL is not configured. Keep-alive health check cannot run.");
    return false;
  }

  const healthUrl = `${url.replace(/\/$/, "")}/health`;

  console.log(`[cron] Health check started at ${new Date().toISOString()}`);
  console.log(`[cron] Request URL: ${healthUrl}`);

  try {
    const response = await fetch(healthUrl);
    const responseBody = await response.text();

    if (!response.ok) {
      console.error(
        `[cron] Health check failed: ${response.status} ${response.statusText}`,
        responseBody
      );
      return false;
    }

    console.log(
      `[cron] Health check succeeded: ${response.status}`,
      responseBody
    );
    return true;
  } catch (error) {
    console.error("[cron] Health check request error:", error.message);
    return false;
  }
};

const startCronJobs = () => {
  if (isScheduled) {
    return;
  }
  isScheduled = true;

  // ─── 0. Keep-alive health check ping — every 10 minutes ──────────────────────
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    console.warn("BACKEND_URL is not configured. Keep-alive cron job will not start.");
  } else {
    cron.schedule("*/10 * * * *", async () => {
      await pingHealthCheck(backendUrl);
    });
    console.log("[cron] Keep-alive job scheduled every 10 minutes.");
  }

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
            from: process.env.EMAIL_FROM,
            to: invoice.clientEmail,
            subject: `Overdue invoice ${invoice.invoiceNumber}`,
            html: `<p>Hi ${invoice.clientName},</p><p>Invoice <strong>${invoice.invoiceNumber}</strong> for ₹${invoice.totalAmount || invoice.amount} is overdue. Please arrange payment at your earliest convenience.</p><p>PaisaMind</p>`,
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
              from: process.env.EMAIL_FROM,
              to: goal.userId.email,
              subject: `🎉 Goal completed: ${goal.name}`,
              html: `<p>Hi ${goal.userId.name},</p><p>You have completed your goal <strong>${goal.name}</strong>! You saved ₹${goal.savedAmount}. Keep up the great work!</p><p>PaisaMind</p>`,
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

  // ─── 4. Process recurring transactions — every hour (UTC-safe schedule) ──────
  cron.schedule("0 * * * *", async () => {
    const now = new Date();
    try {
      const due = await RecurringTransaction.find({
        $or: [{ active: true }, { isActive: true }],
        nextRunAt: { $lte: now },
      });

      let createdCount = 0;
      let skippedCount = 0;

      for (const rec of due) {
        try {
          const runDateStr = rec.nextRunAt.toISOString();
          const signature = `[Ref: ${rec._id}] [Cycle: ${runDateStr}]`;
          const runNotes = `${rec.notes ? rec.notes + " | " : ""}Auto-created from recurring: ${rec.title} ${signature}`;

          let alreadyExists = false;
          if (rec.type === "income") {
            alreadyExists = await Income.exists({
              userId: rec.userId,
              notes: { $regex: new RegExp("\\[Ref: " + rec._id + "\\] \\[Cycle: " + runDateStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "\\]") },
            });
          } else {
            alreadyExists = await Expense.exists({
              userId: rec.userId,
              notes: { $regex: new RegExp("\\[Ref: " + rec._id + "\\] \\[Cycle: " + runDateStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "\\]") },
            });
          }

          if (alreadyExists) {
            skippedCount++;
          } else {
            if (rec.type === "income") {
              await Income.create({
                userId: rec.userId,
                source: rec.title,
                category: rec.category,
                amount: rec.amount,
                date: rec.nextRunAt,
                notes: runNotes,
              });
            } else {
              await Expense.create({
                userId: rec.userId,
                title: rec.title,
                category: rec.category,
                amount: rec.amount,
                date: rec.nextRunAt,
                isRecurring: true,
                notes: runNotes,
              });
            }
            createdCount++;
          }

          // Advance nextRunAt using UTC-safe methods
          const next = new Date(rec.nextRunAt);
          if (rec.frequency === "daily") {
            next.setUTCDate(next.getUTCDate() + 1);
          } else if (rec.frequency === "weekly") {
            next.setUTCDate(next.getUTCDate() + 7);
          } else {
            next.setUTCMonth(next.getUTCMonth() + 1);
          }

          await RecurringTransaction.findByIdAndUpdate(rec._id, {
            nextRunAt: next,
            lastRunAt: now,
          });
        } catch (entryErr) {
          console.error(`[cron] Recurring entry failed for ${rec.title}:`, entryErr.message);
        }
      }

      if (due.length > 0) {
        console.log(`[cron] Recurring Sync Summary | Total Due: ${due.length} | Created: ${createdCount} | Skipped: ${skippedCount} | Timestamp: ${now.toISOString()}`);
      }
    } catch (err) {
      console.error("[cron] Recurring processor failed:", err.message);
    }
  });

  // ─── 5. Daily Anomaly & Risk Scan — 2 AM every night ─────────────────────────
  cron.schedule("0 2 * * *", async () => {
    try {
      const users = await User.find({}, "_id");
      let anomaliesLogged = 0;
      for (const u of users) {
        const result = await detectSpendingAnomalies(u._id, 3);
        if (result.anomalies && result.anomalies.length > 0) {
          for (const a of result.anomalies) {
            const exists = await Anomaly.findOne({
              userId: u._id,
              type: a.type,
              category: a.category,
              status: "active",
            });
            if (!exists) {
              await Anomaly.create({
                userId: u._id,
                type: a.type,
                category: a.category,
                amount: a.amount,
                baselineAmount: a.baselineAmount,
                percentageDeviation: a.percentageDeviation,
                zScore: a.zScore,
                description: a.description,
                status: "active",
              });
              anomaliesLogged++;
            }
          }
        }
      }
      if (anomaliesLogged > 0) {
        console.log(`[cron] Daily scan: ${anomaliesLogged} new anomaly records detected.`);
      }
    } catch (err) {
      console.error("[cron] Anomaly scan failed:", err.message);
    }
  });
};

startCronJobs.pingHealthCheck = pingHealthCheck;
module.exports = startCronJobs;
