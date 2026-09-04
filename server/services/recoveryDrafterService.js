/**
 * Generates dynamic UPI payment string compatible with BHIM, Google Pay, PhonePe, Paytm
 */
const generateUpiPayload = ({ upiId, payeeName = "PaisaMind Freelancer", amount = 0, invoiceNumber = "INV-001" }) => {
  const cleanVpa = (upiId || "").trim();
  if (!cleanVpa) return "";

  const cleanAmount = Number(amount || 0).toFixed(2);
  const cleanName = encodeURIComponent(payeeName.replace(/[^a-zA-Z0-9\s]/g, ""));
  const cleanTxnNote = encodeURIComponent(`Payment for Invoice ${invoiceNumber}`);

  return `upi://pay?pa=${cleanVpa}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanTxnNote}`;
};

/**
 * Generates 3-Stage Contextual Invoice Recovery Drafts for WhatsApp and Email
 */
const generateRecoveryDrafts = ({
  invoice,
  user,
}) => {
  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  const daysDiff = Math.round((now - dueDate) / (1000 * 60 * 60 * 24));
  const isOverdue = invoice.status === "Overdue" || (invoice.status === "Unpaid" && daysDiff > 0);
  const daysOverdue = Math.max(0, daysDiff);

  const amountFormatted = `₹${Number(invoice.totalAmount || invoice.amount).toLocaleString("en-IN")}`;
  const clientName = invoice.clientName || "Client";
  const senderName = user?.name || "PaisaMind Freelancer";
  const invNumber = invoice.invoiceNumber;
  const upiId = invoice.upiId || user?.defaultUpiId || "";
  const upiPayload = generateUpiPayload({ upiId, payeeName: senderName, amount: invoice.totalAmount || invoice.amount, invoiceNumber: invNumber });

  const upiSnippet = upiId
    ? `\n\nDirect Zero-Fee UPI Payment:\nUPI ID: ${upiId}\nUPI Pay Link: ${upiPayload}`
    : "";

  // 1. Stage 1: Gentle Reminder
  const stage1Subject = `Friendly Reminder: Invoice ${invNumber} for ${amountFormatted}`;
  const stage1Body = `Hi ${clientName},

Hope you're having a productive week!

This is a gentle reminder that invoice ${invNumber} for ${amountFormatted} (${invoice.serviceDescription || "Freelance services"}) is due on ${dueDate.toLocaleDateString("en-IN")}.

Please let me know if you need any additional invoice copies or timesheets.${upiSnippet}

Thank you for your partnership!

Best regards,
${senderName}`;

  // 2. Stage 2: Firm Follow-Up
  const stage2Subject = `Follow-up: Invoice ${invNumber} (${amountFormatted}) is ${daysOverdue} days overdue`;
  const stage2Body = `Hi ${clientName},

I am writing to follow up on invoice ${invNumber} for ${amountFormatted}, which was due on ${dueDate.toLocaleDateString("en-IN")} and is now ${daysOverdue} days overdue.

Could you please confirm the payment status and the expected remittance date for this invoice?${upiSnippet}

Looking forward to your quick confirmation.

Warm regards,
${senderName}`;

  // 3. Stage 3: Formal Statutory Demand Notice (MSMED Reference)
  const stage3Subject = `URGENT / FINAL NOTICE: Immediate Settlement Required for Invoice ${invNumber} (${amountFormatted})`;
  const stage3Body = `Dear ${clientName},

This is a formal final notice regarding invoice ${invNumber} for ${amountFormatted}, which is now ${daysOverdue} days overdue despite previous reminders.

As per standard commercial credit terms and Section 15 of the MSME Development Act, invoice dues must be cleared within agreed terms. Delay beyond statutory limits attracts compound interest.

Please arrange for immediate remittance of ${amountFormatted} today to avoid service disruption or formal escalation.${upiSnippet}

Kindly share the UTR / transaction confirmation once processed.

Sincerely,
${senderName}`;

  // WhatsApp Short Messages
  const cleanPhone = (invoice.clientPhone || "").replace(/[^0-9]/g, "");
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const waStage1 = `Hi ${clientName}, gentle reminder that invoice ${invNumber} for ${amountFormatted} is due on ${dueDate.toLocaleDateString("en-IN")}.${upiId ? ` You can pay directly via UPI: ${upiId}` : ""}`;
  const waStage2 = `Hi ${clientName}, following up on invoice ${invNumber} for ${amountFormatted}, which is now ${daysOverdue} days overdue. Please share the payment update today.${upiId ? ` Pay via UPI: ${upiId}` : ""}`;
  const waStage3 = `URGENT: Invoice ${invNumber} (${amountFormatted}) is ${daysOverdue} days overdue. Please process immediate payment today to avoid escalation.${upiId ? ` UPI: ${upiId}` : ""}`;

  return {
    invoiceNumber: invNumber,
    amount: invoice.totalAmount || invoice.amount,
    daysOverdue,
    upiId,
    upiPayload,
    activeRecommendedStage: daysOverdue > 14 ? 3 : daysOverdue > 0 ? 2 : 1,
    stages: [
      {
        stage: 1,
        name: "Stage 1: Gentle Reminder",
        recommendedWhen: "Due soon or 1-3 days past due",
        emailSubject: stage1Subject,
        emailBody: stage1Body,
        whatsappText: waStage1,
        whatsappUrl: waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waStage1)}` : null,
      },
      {
        stage: 2,
        name: "Stage 2: Firm Overdue Notice",
        recommendedWhen: "4 to 14 days overdue",
        emailSubject: stage2Subject,
        emailBody: stage2Body,
        whatsappText: waStage2,
        whatsappUrl: waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waStage2)}` : null,
      },
      {
        stage: 3,
        name: "Stage 3: Formal Statutory Demand",
        recommendedWhen: "> 14 days overdue",
        emailSubject: stage3Subject,
        emailBody: stage3Body,
        whatsappText: waStage3,
        whatsappUrl: waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waStage3)}` : null,
      },
    ],
  };
};

module.exports = {
  generateUpiPayload,
  generateRecoveryDrafts,
};
