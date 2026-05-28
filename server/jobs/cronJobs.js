const cron = require("node-cron");
const Invoice = require("../models/Invoice");
const Goal = require("../models/Goal");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const startCronJobs = () => {
  cron.schedule("0 9 * * 1", async () => {
    const overdueInvoices = await Invoice.find({ status: "Overdue" }).populate("userId");
    for (const invoice of overdueInvoices) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM,
          to: invoice.clientEmail,
          subject: `Overdue invoice ${invoice.invoiceNumber}`,
          html: `<p>Your invoice ${invoice.invoiceNumber} is overdue.</p>`,
        });
      } catch (error) {}
    }
  });

  cron.schedule("0 9 1 * *", async () => {
    const goals = await Goal.find({ status: "Active" }).populate("userId");
    for (const goal of goals) {
      try {
        if (goal.savedAmount >= goal.targetAmount) {
          await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: goal.userId.email,
            subject: "Goal completed",
            html: `<p>Your goal ${goal.name} has been completed.</p>`,
          });
        }
      } catch (error) {}
    }
  });
};

module.exports = startCronJobs;