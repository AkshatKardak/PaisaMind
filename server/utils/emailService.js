const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const from = "PaisaMind <onboarding@resend.dev>";

const shouldSendEmails = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_your_resend_key";

const emailLayout = (title, body) => `
  <div style="background:#0B0F1A;padding:32px;font-family:Inter,Arial,sans-serif;color:#F9FAFB;">
    <div style="max-width:640px;margin:0 auto;background:#111827;border:1px solid #374151;border-radius:18px;padding:32px;">
      <div style="font-size:24px;font-weight:700;color:#F9FAFB;margin-bottom:12px;">${title}</div>
      <div style="color:#D1D5DB;line-height:1.7;font-size:15px;">${body}</div>
    </div>
  </div>
`;

const sendEmail = async ({ to, subject, html }) => {
  if (!shouldSendEmails) {
    console.log(`Email skipped for ${to}: ${subject}`);
    return { skipped: true };
  }

  return resend.emails.send({ from, to, subject, html });
};

const sendWelcomeEmail = async (email, name) =>
  sendEmail({
    to: email,
    subject: "Welcome to PaisaMind",
    html: emailLayout(
      `Welcome, ${name}`,
      "Your finance workspace is ready. Track income, stay ahead of taxes, monitor invoices, and build savings goals with confidence."
    ),
  });

const sendOverdueReminderEmail = async (email, invoice) =>
  sendEmail({
    to: email,
    subject: `Invoice ${invoice.invoiceNumber} is overdue`,
    html: emailLayout(
      "Overdue Invoice Alert",
      `Invoice <strong>${invoice.invoiceNumber}</strong> for <strong>Rs. ${invoice.totalAmount}</strong> is now overdue. Reach out to <strong>${invoice.clientName}</strong> and follow up on payment.`
    ),
  });

const sendMonthlyReportEmail = async (email, name, report) =>
  sendEmail({
    to: email,
    subject: "Your PaisaMind monthly report",
    html: emailLayout(`Monthly Report for ${name}`, report.replace(/\n/g, "<br />")),
  });

const sendTaxReminderEmail = async (email, name, quarter, date, amount) =>
  sendEmail({
    to: email,
    subject: `${quarter} advance tax reminder`,
    html: emailLayout(
      `Advance Tax Reminder for ${name}`,
      `Your <strong>${quarter}</strong> advance tax deadline is on <strong>${new Date(date).toLocaleDateString(
        "en-IN"
      )}</strong>. Planned payment amount: <strong>Rs. ${amount}</strong>.`
    ),
  });

const sendGoalCompletedEmail = async (email, name, goalName, amount) =>
  sendEmail({
    to: email,
    subject: `Goal achieved: ${goalName}`,
    html: emailLayout(
      "Savings Goal Completed",
      `${name}, you've completed <strong>${goalName}</strong> with total savings of <strong>Rs. ${amount}</strong>. Keep that momentum going.`
    ),
  });

module.exports = {
  sendWelcomeEmail,
  sendOverdueReminderEmail,
  sendMonthlyReportEmail,
  sendTaxReminderEmail,
  sendGoalCompletedEmail,
};
