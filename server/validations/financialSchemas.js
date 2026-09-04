const { z } = require("zod");

// ─── Financial Transactions ──────────────────────────────────────────────────
const incomeSchema = z.object({
  source: z.string().min(1, "Income source is required").max(100),
  category: z.string().default("Freelance Income"),
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.string().or(z.date()),
  notes: z.string().max(500).optional().default(""),
});

const expenseSchema = z.object({
  title: z.string().min(1, "Expense title is required").max(100),
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.string().or(z.date()),
  notes: z.string().max(500).optional().default(""),
  isRecurring: z.boolean().optional().default(false),
});

// ─── Invoices ─────────────────────────────────────────────────────────────────
const invoiceItemSchema = z.object({
  description: z.string().min(1, "Item description required"),
  quantity: z.number().positive().default(1),
  rate: z.number().nonnegative(),
});

const invoiceSchema = z.object({
  clientName: z.string().min(1, "Client name is required").max(100),
  clientEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  clientPhone: z.string().max(20).optional().default(""),
  serviceDescription: z.string().max(500).optional().default(""),
  amount: z.number().positive("Invoice amount must be greater than 0"),
  dueDate: z.string().or(z.date()),
  items: z.array(invoiceItemSchema).optional().default([]),
  notes: z.string().max(500).optional().default(""),
  gstApplicable: z.boolean().optional().default(false),
});

// ─── What-If Scenario Simulator ──────────────────────────────────────────────
const scenarioSimulateSchema = z.object({
  scenarioType: z.enum([
    "large_purchase",
    "income_decrease",
    "income_increase",
    "new_recurring_expense",
    "delayed_invoice",
    "new_emi",
  ]),
  amount: z.number().nonnegative().optional().default(0),
  percentage: z.number().min(0).max(100).optional().default(0),
  monthlyRecurring: z.number().nonnegative().optional().default(0),
  delayDays: z.number().int().nonnegative().optional().default(0),
  itemDescription: z.string().max(100).optional().default("Custom Scenario"),
});

// ─── Assets & Liabilities ────────────────────────────────────────────────────
const assetSchema = z.object({
  name: z.string().min(1, "Asset name is required").max(100),
  type: z.enum([
    "cash",
    "bank_account",
    "receivable",
    "investment",
    "fixed_deposit",
    "mutual_fund",
    "stocks",
    "real_estate",
    "crypto",
    "other",
  ]),
  amount: z.number().nonnegative("Amount cannot be negative"),
  institution: z.string().max(100).optional().default(""),
  isLiquid: z.boolean().optional().default(true),
  notes: z.string().max(500).optional().default(""),
});

const liabilitySchema = z.object({
  name: z.string().min(1, "Liability name is required").max(100),
  type: z.enum([
    "credit_card",
    "personal_loan",
    "home_loan",
    "car_loan",
    "education_loan",
    "business_loan",
    "emi",
    "tax_due",
    "other",
  ]),
  currentBalance: z.number().nonnegative("Balance cannot be negative"),
  monthlyEmi: z.number().nonnegative().optional().default(0),
  interestRate: z.number().min(0).max(100).optional().default(0),
  lender: z.string().max(100).optional().default(""),
  nextPaymentDate: z.string().or(z.date()).optional(),
  notes: z.string().max(500).optional().default(""),
});

// ─── Copilot Chat ─────────────────────────────────────────────────────────────
const copilotChatSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000),
  conversationId: z.string().optional(),
});

// ─── Statement Import Commit ─────────────────────────────────────────────────
const statementCommitSchema = z.object({
  importId: z.string().min(1, "Import ID required"),
  selectedIndices: z.array(z.number().int().nonnegative()).optional(),
});

module.exports = {
  incomeSchema,
  expenseSchema,
  invoiceSchema,
  scenarioSimulateSchema,
  assetSchema,
  liabilitySchema,
  copilotChatSchema,
  statementCommitSchema,
};
