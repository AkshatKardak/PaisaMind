const asyncHandler = require("express-async-handler");
const { Groq } = require("groq-sdk");
const { FINANCIAL_TOOLS } = require("../tools/financialToolsRegistry");
const AIConversation = require("../models/AIConversation");
const AIMessage = require("../models/AIMessage");
const { logAuditEvent } = require("../services/auditService");
const logger = require("../services/logger");

const groq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "your_groq_api_key"
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

/**
 * Executes a tool server-side with authenticated userId
 */
const executeToolByName = async (userId, toolName, args = {}) => {
  const tool = FINANCIAL_TOOLS.find((t) => t.function.name === toolName);
  if (!tool) {
    throw new Error(`Unauthorized or unknown tool: ${toolName}`);
  }
  return await tool.execute(userId, args);
};

/**
 * Fallback intent classifier when LLM is offline or no API key is provided
 */
const fallbackDeterministicIntentHandler = async (userId, message) => {
  const q = message.toLowerCase();
  const toolResults = [];

  // Match: Affordability / Purchase
  const laptopMatch = q.match(/(?:afford|buy|purchase)\s*(?:a\s*)?(?:₹|rs\.?|inr)?\s*([\d,]+)k?\s*(.*)/i);
  if (q.includes("afford") || q.includes("buy") || q.includes("purchase") || laptopMatch) {
    let amt = 60000;
    if (laptopMatch && laptopMatch[1]) {
      let rawNum = laptopMatch[1].replace(/,/g, "");
      amt = parseFloat(rawNum);
      if (q.includes("k") && amt < 1000) amt *= 1000;
      if (amt < 1000 && rawNum.length <= 3) amt *= 1000;
    }
    const item = laptopMatch?.[2]?.trim() || "Item";
    const simRes = await executeToolByName(userId, "simulate_financial_scenario", {
      scenarioType: "large_purchase",
      amount: amt,
      itemDescription: item || `₹${amt.toLocaleString("en-IN")} purchase`,
    });
    toolResults.push({ name: "simulate_financial_scenario", args: { amount: amt }, result: simRes });

    return {
      answer: `### Affordability Analysis: ${simRes.itemDescription || `₹${amt.toLocaleString("en-IN")}`}
**Calculated Facts:**
- Current Liquid Cash Balance: ₹${simRes.baseline.currentCashBalance.toLocaleString("en-IN")}
- Current Monthly Burn: ₹${simRes.baseline.currentMonthlyExpense.toLocaleString("en-IN")}
- Post-Purchase Liquid Buffer: ₹${(simRes.baseline.currentCashBalance - amt).toLocaleString("en-IN")}

**Forecast & Runway:**
- Base Case Projected Runway: **${simRes.results.baseCase.runwayMonths} months** (Stress Case: **${simRes.results.stressCase.runwayMonths} months**)

**Recommendation:**
${simRes.results.recommendation}

**Uncertainty / Assumptions:**
Assumes current average monthly expense burn rate remains steady without unexpected tax or liability changes.`,
      toolCalls: toolResults,
    };
  }

  // Match: Runway
  if (q.includes("runway") || q.includes("how long") || q.includes("burn rate")) {
    const res = await executeToolByName(userId, "get_cash_balance", {});
    const runway = await executeToolByName(userId, "simulate_financial_scenario", { scenarioType: "income_decrease", percentage: 0 });
    toolResults.push({ name: "get_cash_balance", result: res });
    return {
      answer: `### Cash Runway Assessment
**Calculated Facts:**
- Liquid Cash Balance: ₹${res.liquidCashBalance.toLocaleString("en-IN")}
- Net Available Cash (after tax reserve): ₹${res.netAvailableCashAfterTaxReserve.toLocaleString("en-IN")}
- Monthly Burn Rate: ₹${res.monthlyBurnRate.toLocaleString("en-IN")}

**Runway Estimates:**
- Expected Runway: **${runway.baseline.currentRunwayMonths} months**

**Recommendation:**
Freelancers should ideally maintain a minimum 6-month buffer. ${runway.baseline.currentRunwayMonths < 6 ? "Consider building additional cash reserves from upcoming invoice collections." : "Your cash runway is in a healthy position."}

**Uncertainty:**
Calculated from your historical 3-month expense velocity and liquid asset records.`,
      toolCalls: toolResults,
    };
  }

  // Match: Tax reserve / Tax estimate
  if (q.includes("tax") || q.includes("reserve") || q.includes("gst") || q.includes("44ada")) {
    const taxEst = await executeToolByName(userId, "get_tax_estimate", { regime: "compare" });
    const taxRes = await executeToolByName(userId, "get_tax_reserve", {});
    toolResults.push({ name: "get_tax_estimate", result: taxEst });
    toolResults.push({ name: "get_tax_reserve", result: taxRes });

    return {
      answer: `### Tax Intelligence & Reserve Analysis (FY 2025-26)
**Calculated Facts:**
- YTD Gross Income: ₹${taxEst.grossIncome.toLocaleString("en-IN")}
- Recommended Filing Option: **${taxEst.recommendedOption.name}**
- Estimated Annual Tax Liability: **₹${taxEst.recommendedOption.tax.toLocaleString("en-IN")}**

**Tax Reserve Recommendation:**
- Recommended Reserve Rate: **${taxRes.reservePercentage}%** of new incoming invoices.
- Total Annual Tax Projected: **₹${taxRes.totalAnnualTaxProjected.toLocaleString("en-IN")}**

**Recommendation:**
${taxRes.explanation} Section 44ADA offers substantial savings for Indian freelancers with receipts up to ₹75 Lakhs.

**Disclaimer:**
These calculations are deterministic estimates under Indian Income Tax Act guidelines and do not constitute formal legal/CA advice.`,
      toolCalls: toolResults,
    };
  }

  // Match: Anomalies / Unusual expenses
  if (q.includes("anomal") || q.includes("unusual") || q.includes("increase") || q.includes("spike") || q.includes("duplicate")) {
    const anomRes = await executeToolByName(userId, "detect_anomalies", {});
    toolResults.push({ name: "detect_anomalies", result: anomRes });
    const spikes = anomRes.spendingAnomalies || [];
    const dups = anomRes.potentialDuplicates || [];

    return {
      answer: `### Spending Anomaly & Duplicate Report
**Calculated Facts:**
- Detected Spending Spikes: **${spikes.length}**
- Potential Duplicate Transactions: **${dups.length}**

${spikes.length > 0 ? `**Notable Anomalies:**\n` + spikes.map((s) => `- **${s.category}**: ${s.description}`).join("\n") : "No significant statistical spending spikes detected."}

${dups.length > 0 ? `\n**Potential Duplicates:**\n` + dups.map((d) => `- ₹${d.amount.toLocaleString("en-IN")} (${d.transactionA.title}): ${d.reason}`).join("\n") : ""}

**Recommendation:**
Review flagged categories to verify if spikes were planned capital purchases or recurring subscription changes.`,
      toolCalls: toolResults,
    };
  }

  // Match: Invoices / Late clients
  if (q.includes("invoice") || q.includes("client") || q.includes("late") || q.includes("risk") || q.includes("overdue")) {
    const invRisk = await executeToolByName(userId, "get_invoice_risk", {});
    toolResults.push({ name: "get_invoice_risk", result: invRisk });

    const atRisk = invRisk.atRiskInvoices || [];
    return {
      answer: `### Client Payment Reliability & Invoice Risk
**Calculated Facts:**
- Total Overdue Receivables: **₹${invRisk.totalOverdueAmount.toLocaleString("en-IN")}**
- Total Pending Pipeline: **₹${invRisk.totalPendingAmount.toLocaleString("en-IN")}**
- High-Risk Invoices: **${atRisk.length}**

${atRisk.length > 0 ? `**Invoices Requiring Follow-Up:**\n` + atRisk.map((i) => `- **${i.clientName}** (Inv #${i.invoiceNumber}): ₹${i.amount.toLocaleString("en-IN")} is **${i.daysOverdue} days overdue** (${i.riskLevel} Risk)`).join("\n") : "All current invoices are within standard payment terms."}

**Recommendation:**
Send automated payment reminder links immediately for invoices overdue by more than 14 days.`,
      toolCalls: toolResults,
    };
  }

  // Default: Financial Summary
  const summary = await executeToolByName(userId, "get_financial_summary", {});
  toolResults.push({ name: "get_financial_summary", result: summary });

  return {
    answer: `### Financial Summary Overview
**Calculated Facts:**
- Current Month Income: **₹${summary.totalIncome.toLocaleString("en-IN")}**
- Current Month Expenses: **₹${summary.totalExpense.toLocaleString("en-IN")}**
- Net Savings: **₹${summary.netSavings.toLocaleString("en-IN")}** (${summary.savingsRate})
- Liquid Cash Balance: **₹${summary.liquidCashBalance.toLocaleString("en-IN")}**
- Cash Runway: **${summary.cashRunwayMonths} months**
- Financial Health Score: **${summary.financialHealthScore}/100** (${summary.healthGrade})

**Recommendation:**
Ask me specific questions like *"Can I afford a ₹70,000 laptop?"*, *"How much tax should I reserve?"*, or *"Which clients pay late?"* to run detailed scenario simulations.`,
    toolCalls: toolResults,
  };
};

/**
 * Primary Copilot Chat Handler with Tool Calling
 */
const chatWithCopilot = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { message, conversationId } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: "Message is required." });
  }

  // Find or create conversation
  let conversation;
  if (conversationId) {
    conversation = await AIConversation.findOne({ _id: conversationId, userId });
  }
  if (!conversation) {
    conversation = await AIConversation.create({
      userId,
      title: message.substring(0, 40) + (message.length > 40 ? "..." : ""),
    });
  }

  // Save User message
  await AIMessage.create({
    conversationId: conversation._id,
    userId,
    role: "user",
    content: message,
  });

  let responseData;

  if (groq) {
    try {
      // 1. Prepare system prompt & tools
      const systemPrompt = `You are PaisaMind Financial Copilot, an elite AI financial decision-support engine for Indian freelancers and small businesses.
CRITICAL OPERATIONAL RULES:
1. You must NEVER fabricate, guess, or calculate financial numbers on your own.
2. ALWAYS execute the appropriate tool(s) to retrieve verified deterministic financial numbers.
3. Clearly separate your response into these markdown sections:
   - **Calculated Facts** (exact verified numbers from tool output)
   - **Forecasts** (statistical projections labeled with confidence)
   - **Recommendations** (actionable decision advice based on the data)
   - **Uncertainty / Assumptions** (data limitations or assumptions)
4. Use Indian numbering (e.g. ₹1.25L, ₹50,000, ₹10 Lakhs) and INR symbol.
5. Emphasize business cash-flow sustainability. You are not a licensed SEBI investment advisor.`;

      const toolsList = FINANCIAL_TOOLS.map((t) => ({
        type: t.type,
        function: t.function,
      }));

      // Initial call to Groq with tool definitions
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        tools: toolsList,
        tool_choice: "auto",
        temperature: 0.2,
      });

      const responseMsg = completion.choices?.[0]?.message;
      const toolCalls = responseMsg?.tool_calls || [];
      const executedTools = [];

      if (toolCalls.length > 0) {
        // Execute tool calls on server
        const toolMessages = [];
        for (const tc of toolCalls) {
          const fnName = tc.function.name;
          let parsedArgs = {};
          try {
            parsedArgs = JSON.parse(tc.function.arguments || "{}");
          } catch (e) {
            parsedArgs = {};
          }

          logger.info({ userId, fnName, parsedArgs }, "[Copilot] Executing tool");
          const toolResult = await executeToolByName(userId, fnName, parsedArgs);
          executedTools.push({
            id: tc.id,
            name: fnName,
            args: parsedArgs,
            result: toolResult,
          });

          toolMessages.push({
            tool_call_id: tc.id,
            role: "tool",
            name: fnName,
            content: JSON.stringify(toolResult),
          });
        }

        // Second LLM pass to synthesize explanation from tool results
        const secondCompletion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
            responseMsg,
            ...toolMessages,
          ],
          temperature: 0.2,
        });

        const finalContent = secondCompletion.choices?.[0]?.message?.content || "Analysis complete.";
        responseData = {
          answer: finalContent,
          toolCalls: executedTools,
        };
      } else {
        // No tool requested by LLM; fallback to execute financial summary tool to ground answer
        const summary = await executeToolByName(userId, "get_financial_summary", {});
        executedTools.push({ name: "get_financial_summary", args: {}, result: summary });
        responseData = {
          answer: responseMsg.content,
          toolCalls: executedTools,
        };
      }
    } catch (llmErr) {
      logger.warn({ err: llmErr.message }, "[Copilot] Groq call failed; running deterministic fallback");
      responseData = await fallbackDeterministicIntentHandler(userId, message);
    }
  } else {
    // Deterministic fallback if no GROQ_API_KEY is configured
    responseData = await fallbackDeterministicIntentHandler(userId, message);
  }

  // Save Assistant message to history
  await AIMessage.create({
    conversationId: conversation._id,
    userId,
    role: "assistant",
    content: responseData.answer,
    toolCalls: responseData.toolCalls,
  });

  await AIConversation.findByIdAndUpdate(conversation._id, { lastMessageAt: new Date() });

  // Log financial audit event
  await logAuditEvent({
    userId,
    action: "AI_FINANCIAL_QUERY",
    resource: "Copilot",
    resourceId: String(conversation._id),
    details: { message: message.substring(0, 100), toolCount: responseData.toolCalls?.length },
    req,
  });

  return res.status(200).json({
    success: true,
    data: {
      conversationId: conversation._id,
      answer: responseData.answer,
      toolCalls: responseData.toolCalls || [],
      disclaimer: "PaisaMind calculations are deterministic informational estimates. Not formal investment or tax advice.",
    },
  });
});

/**
 * Get message history for a conversation
 */
const getConversationHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.params;

  const messages = await AIMessage.find({ conversationId, userId }).sort({ createdAt: 1 });

  return res.status(200).json({
    success: true,
    data: messages,
  });
});

/**
 * List all conversations for the user
 */
const listConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const conversations = await AIConversation.find({ userId }).sort({ lastMessageAt: -1 });

  return res.status(200).json({
    success: true,
    data: conversations,
  });
});

module.exports = {
  chatWithCopilot,
  getConversationHistory,
  listConversations,
  executeToolByName,
};
