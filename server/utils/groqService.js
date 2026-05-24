const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const safeParseJson = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const chatWithGroq = async (prompt, jsonMode = false) => {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "your_groq_api_key") {
    return null;
  }

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are PaisaMind, an Indian finance copilot for freelancers. Use INR formatting, practical tax-aware suggestions, and concise professional writing.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  return response.choices?.[0]?.message?.content?.trim() || null;
};

const generateInsights = async (financialData) => {
  const prompt = `Analyze this Indian freelancer financial snapshot and return valid JSON with keys insights, health_explanation, top_action.
Insights must contain exactly 5 short actionable strings.
Reference Indian tax context when relevant.
Use rupee amounts and Indian number formatting.
Data: ${JSON.stringify(financialData)}`;

  const content = await chatWithGroq(prompt, true);

  if (!content) {
    return {
      insights: [
        "Focus on keeping expenses below 60% of monthly income.",
        "Set aside at least 20% of net income for advance tax and emergency savings.",
        "Follow up on unpaid invoices weekly to improve cash flow.",
        "Review recurring subscriptions for tools unused in the last 30 days.",
        "Track GST threshold progress monthly if annual income is rising quickly.",
      ],
      health_explanation: "Your health score balances cash flow, tax readiness, and savings discipline.",
      top_action: "Move the highest overdue invoice into an active follow-up queue today.",
    };
  }

  return safeParseJson(content, {
    insights: [],
    health_explanation: "AI insights are temporarily unavailable.",
    top_action: "Review your dashboard metrics manually.",
  });
};

const generateMonthlyReport = async (financialData) => {
  const prompt = `Create a structured monthly narrative for an Indian freelancer.
Return plain text with these sections:
Income Summary
Expense Analysis
Tax Status
Savings Progress
Key Action Items

Financial data: ${JSON.stringify(financialData)}`;

  const content = await chatWithGroq(prompt, false);

  if (!content) {
    return `Income Summary
Income stayed in focus this month with a strong need to compare billed amounts against cash received.

Expense Analysis
Recurring tools and travel-heavy spending deserve review for possible leakage.

Tax Status
Keep a dedicated reserve for GST and advance tax based on current income momentum.

Savings Progress
Goal contributions should be aligned with remaining monthly surplus.

Key Action Items
1. Chase overdue invoices.
2. Cap low-value recurring expenses.
3. Allocate tax reserves weekly.`;
  }

  return content;
};

const generateInvoiceReminder = async (invoice, tone = "polite") => {
  const prompt = `Draft a ${tone} invoice reminder message for this invoice as a professional Indian freelancer.
Return only the message body, ready to send.
Invoice: ${JSON.stringify(invoice)}`;

  const content = await chatWithGroq(prompt, false);

  if (!content) {
    const tonePrefix = {
      polite: "Hope you're doing well.",
      firm: "This is a quick reminder regarding the pending invoice.",
      final: "This is a final reminder before escalation on the pending invoice.",
    };

    return `${tonePrefix[tone]}\n\nInvoice ${invoice.invoiceNumber} for Rs. ${invoice.totalAmount} was due on ${new Date(
      invoice.dueDate
    ).toLocaleDateString("en-IN")}. Please arrange payment at the earliest and let me know once processed.\n\nThank you.`;
  }

  return content;
};

module.exports = {
  generateInsights,
  generateMonthlyReport,
  generateInvoiceReminder,
};
