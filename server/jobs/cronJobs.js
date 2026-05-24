const cron = require("node-cron");

const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Invoice = require("../models/Invoice");
const User = require("../models/User");
const {
  sendMonthlyReportEmail,
  sendOverdueReminderEmail,
  sendTaxReminderEmail,
} = require("../utils/emailService");
const { generateMonthlyReport } = require("../utils/groqService");
const { calculateNewRegimeTax, calculateOldRegimeTax, getAdvanceTaxSchedule } = require("../utils/taxEngine");

const startCronJobs = () => {
  cron.schedule("0 9 * * 1", async () => {
    const overdueInvoices = await Invoice.find({
      status: "unpaid",
      dueDate: { $lt: new Date() },
    }).populate("userId");

    for (const invoice of overdueInvoices) {
      invoice.status = "overdue";
      await invoice.save();

      if (invoice.userId?.email) {
        await sendOverdueReminderEmail(invoice.userId.email, invoice);
      }
    }
  });

  cron.schedule("0 8 1 * *", async () => {
    const users = await User.find();

    for (const user of users) {
      const [income, expenses, invoices] = await Promise.all([
        Income.find({ userId: user._id }),
        Expense.find({ userId: user._id }),
        Invoice.find({ userId: user._id }),
      ]);

      const report = await generateMonthlyReport({
        income,
        expenses,
        invoices,
        goals: [],
      });

      await sendMonthlyReportEmail(user.email, user.name, report);
    }
  });

  cron.schedule("0 9 * * *", async () => {
    const users = await User.find();

    for (const user of users) {
      const incomes = await Income.find({ userId: user._id });
      const totalIncome = incomes.reduce((sum, entry) => sum + entry.amount, 0);
      const annualizedIncome = totalIncome * (12 / Math.max(new Date().getMonth() + 1, 1));
      const annualTax = user.taxRegime === "old"
        ? calculateOldRegimeTax(annualizedIncome, {}).totalTax
        : calculateNewRegimeTax(annualizedIncome).totalTax;

      const upcomingQuarter = getAdvanceTaxSchedule(annualTax).find(
        (quarter) => quarter.countdownDays === 14
      );

      if (upcomingQuarter) {
        await sendTaxReminderEmail(
          user.email,
          user.name,
          upcomingQuarter.quarter,
          upcomingQuarter.deadline,
          upcomingQuarter.amount
        );
      }
    }
  });
};

module.exports = startCronJobs;
