require("dotenv").config();
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const User = require("../models/User");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Invoice = require("../models/Invoice");
const Goal = require("../models/Goal");
const Budget = require("../models/Budget");
const RecurringTransaction = require("../models/RecurringTransaction");
const Asset = require("../models/Asset");
const Liability = require("../models/Liability");
const CategoryRule = require("../models/CategoryRule");

const seedDemoData = async () => {
  console.log("=== PaisaMind Synthetic Demo Data Generator ===");

  if (!process.env.MONGO_URI) {
    console.error("Error: MONGO_URI is missing in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB.");

    // Find or create demo user
    let user = await User.findOne({ email: "demo@paisamind.com" });
    if (!user) {
      user = await User.findOne({}); // use first user in DB if exists
    }

    if (!user) {
      user = await User.create({
        firebaseUid: "demo_freelancer_uid_123",
        name: "Akshat Freelancer",
        email: "demo@paisamind.com",
        taxRegime: "new",
        investments80C: 120000,
        investments80D: 25000,
      });
      console.log("✓ Created demo user: demo@paisamind.com");
    } else {
      console.log(`✓ Using user: ${user.name} (${user.email})`);
    }

    const userId = user._id;

    // Clear existing records for clean reproducible seeding (optional query flag)
    if (process.argv.includes("--clean")) {
      console.log("Cleaning old data for demo user...");
      await Promise.all([
        Income.deleteMany({ userId }),
        Expense.deleteMany({ userId }),
        Invoice.deleteMany({ userId }),
        Goal.deleteMany({ userId }),
        Budget.deleteMany({ userId }),
        RecurringTransaction.deleteMany({ userId }),
        Asset.deleteMany({ userId }),
        Liability.deleteMany({ userId }),
        CategoryRule.deleteMany({ userId }),
      ]);
    }

    const now = new Date();

    // ─── 1. Assets & Liabilities (Net Worth) ───────────────────────────────────
    await Asset.deleteMany({ userId });
    await Asset.insertMany([
      { userId, name: "HDFC Primary Bank Account", type: "bank_account", amount: 185000, institution: "HDFC Bank", isLiquid: true },
      { userId, name: "ICICI Emergency Reserve", type: "bank_account", amount: 75000, institution: "ICICI Bank", isLiquid: true },
      { userId, name: "Zerodha Nifty 50 Index Fund", type: "mutual_fund", amount: 320000, institution: "Zerodha Coin", isLiquid: false },
      { userId, name: "SBI 1-Year Tax-Saver FD", type: "fixed_deposit", amount: 150000, institution: "State Bank of India", isLiquid: false },
    ]);

    await Liability.deleteMany({ userId });
    const nextEmiDate = new Date(now.getTime() + (4 * 24 * 60 * 60 * 1000)); // due in 4 days
    await Liability.insertMany([
      { userId, name: "MacBook Pro No-Cost EMI", type: "emi", principal: 150000, currentBalance: 49996, monthlyEmi: 12499, lender: "HDFC Bank", nextPaymentDate: nextEmiDate },
      { userId, name: "HDFC Millennia Credit Card", type: "credit_card", principal: 0, currentBalance: 24800, monthlyEmi: 0, lender: "HDFC Bank", nextPaymentDate: new Date(now.getTime() + (12 * 24 * 60 * 60 * 1000)) },
    ]);
    console.log("✓ Assets & Liabilities seeded.");

    // ─── 2. Invoices with realistic delay history ──────────────────────────────
    await Invoice.deleteMany({ userId });
    const invoiceDocs = [];
    const clientList = [
      { name: "Acme Technologies", email: "billing@acme.io", reliable: true },
      { name: "GrowthHackers Digital", email: "finance@growthhackers.co", reliable: true },
      { name: "Studio Pixel Mumbai", email: "accounts@studiopixel.in", reliable: false },
      { name: "FinTech Pulse UK", email: "pay@fintechpulse.co.uk", reliable: true },
    ];

    // Seed 8 historical paid invoices
    for (let i = 8; i >= 1; i--) {
      const client = clientList[i % clientList.length];
      const issueDate = new Date(now.getFullYear(), now.getMonth() - i, 5);
      const dueDate = new Date(now.getFullYear(), now.getMonth() - i, 20);
      const delayDays = client.reliable ? (i % 3) : (18 + i * 2);
      const paidDate = new Date(dueDate.getTime() + (delayDays * 24 * 60 * 60 * 1000));
      const amount = 45000 + (i * 8000);

      invoiceDocs.push({
        userId,
        invoiceNumber: `INV-2025-00${i}`,
        clientName: client.name,
        clientEmail: client.email,
        serviceDescription: "Full-Stack Development & UI Design Retainer",
        amount,
        totalAmount: amount,
        issueDate,
        dueDate,
        paidAt: paidDate,
        status: "Paid",
        gstApplicable: true,
      });
    }

    // Seed 1 active on-time invoice & 1 high-risk overdue invoice
    invoiceDocs.push({
      userId,
      invoiceNumber: "INV-2026-009",
      clientName: "FinTech Pulse UK",
      clientEmail: "pay@fintechpulse.co.uk",
      serviceDescription: "React Dashboard Sprint 3",
      amount: 75000,
      totalAmount: 75000,
      issueDate: new Date(now.getFullYear(), now.getMonth(), 1),
      dueDate: new Date(now.getFullYear(), now.getMonth(), 28),
      status: "Unpaid",
      gstApplicable: true,
    });

    const overdueDue = new Date(now.getTime() - (22 * 24 * 60 * 60 * 1000)); // 22 days overdue
    invoiceDocs.push({
      userId,
      invoiceNumber: "INV-2026-010",
      clientName: "Studio Pixel Mumbai",
      clientEmail: "accounts@studiopixel.in",
      serviceDescription: "Brand Guidelines & Web App Redesign",
      amount: 54000,
      totalAmount: 54000,
      issueDate: new Date(overdueDue.getTime() - (15 * 24 * 60 * 60 * 1000)),
      dueDate: overdueDue,
      status: "Overdue",
      gstApplicable: true,
    });

    await Invoice.insertMany(invoiceDocs);
    console.log(`✓ ${invoiceDocs.length} Invoices seeded (Paid, Unpaid, Overdue).`);

    // ─── 3. Income & Expense History (12 Months) ──────────────────────────────
    await Income.deleteMany({ userId });
    await Expense.deleteMany({ userId });

    const incomeDocs = [];
    const expenseDocs = [];

    for (let m = 11; m >= 0; m--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);

      // Monthly Retainer Income (Variable freelancer cash flow)
      const baseRetainer = 65000 + ((m * 3700) % 25000);
      incomeDocs.push({
        userId,
        source: "Acme Technologies Retainer",
        category: "Freelance Income",
        amount: baseRetainer,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5),
        notes: `Monthly sprint retainer for month -${m}`,
      });

      // Project Milestone Income
      if (m % 2 === 0) {
        incomeDocs.push({
          userId,
          source: "FinTech Pulse UI Project",
          category: "Freelance Income",
          amount: 55000 + ((m * 4200) % 20000),
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 18),
          notes: "Milestone payment",
        });
      }

      // Fixed recurring expenses
      expenseDocs.push(
        { userId, title: "WeWork Coworking Desk", category: "Business", amount: 12500, date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 2), isRecurring: true },
        { userId, title: "AWS Cloud Hosting", category: "Software Subscriptions", amount: m === 0 ? 5400 : 4999, date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 12), isRecurring: true },
        { userId, title: "Adobe Creative Cloud", category: "Software Subscriptions", amount: m <= 1 ? 1799 : 1499, date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 14), isRecurring: true }, // price increase
        { userId, title: "Airtel Xstream Fiber Internet", category: "Utilities", amount: 1499, date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10), isRecurring: true },
        { userId, title: "Swiggy & Zomato Food Orders", category: "Food", amount: 6200 + (m * 450 % 2000), date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 16), isRecurring: false },
        { userId, title: "Uber Business Rides", category: "Transport", amount: 3400 + (m * 200 % 1500), date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 22), isRecurring: false }
      );
    }

    // Insert spending spike in current month (Anomaly)
    expenseDocs.push({
      userId,
      title: "Apple Studio Display & Mechanical Keyboard",
      category: "Shopping",
      amount: 68500,
      date: new Date(now.getFullYear(), now.getMonth(), 8),
      notes: "Hardware workstation upgrade",
      isRecurring: false,
    });

    // Insert intentional duplicate transaction pair (for duplicate detection test)
    const dupDate = new Date(now.getFullYear(), now.getMonth(), 13);
    expenseDocs.push(
      { userId, title: "AWS Cloud Infrastructure Payment", category: "Software Subscriptions", amount: 4999, date: dupDate, notes: "Transaction Ref A", isRecurring: false },
      { userId, title: "AWS Cloud Infrastructure Payment", category: "Software Subscriptions", amount: 4999, date: new Date(dupDate.getTime() + (24 * 60 * 60 * 1000)), notes: "Transaction Ref B (Duplicate candidate)", isRecurring: false }
    );

    await Income.insertMany(incomeDocs);
    await Expense.insertMany(expenseDocs);
    console.log(`✓ ${incomeDocs.length} Incomes and ${expenseDocs.length} Expenses seeded.`);

    // ─── 4. Goals & Recurring Transactions ─────────────────────────────────────
    await Goal.deleteMany({ userId });
    await Goal.insertMany([
      { userId, name: "Emergency Fund (6 Months Runway)", targetAmount: 300000, savedAmount: 210000, deadline: new Date(now.getFullYear() + 1, 2, 31), status: "Active" },
      { userId, name: "M3 Max Studio Workstation", targetAmount: 180000, savedAmount: 65000, deadline: new Date(now.getFullYear(), now.getMonth() + 6, 1), status: "Active" },
    ]);

    await RecurringTransaction.deleteMany({ userId });
    await RecurringTransaction.insertMany([
      { userId, type: "income", title: "Acme Technologies Retainer", category: "Freelance Income", amount: 75000, frequency: "monthly", nextRunAt: new Date(now.getFullYear(), now.getMonth() + 1, 5), active: true, isActive: true },
      { userId, type: "expense", title: "WeWork Coworking Desk", category: "Business", amount: 12500, frequency: "monthly", nextRunAt: new Date(now.getFullYear(), now.getMonth() + 1, 2), active: true, isActive: true },
      { userId, type: "expense", title: "AWS Cloud Hosting", category: "Software Subscriptions", amount: 5400, frequency: "monthly", nextRunAt: new Date(now.getFullYear(), now.getMonth() + 1, 12), active: true, isActive: true },
      { userId, type: "expense", title: "Adobe Creative Cloud", category: "Software Subscriptions", amount: 1799, frequency: "monthly", nextRunAt: new Date(now.getFullYear(), now.getMonth() + 1, 14), active: true, isActive: true },
    ]);

    // ─── 5. Project & Client Unit Economics ────────────────────────────────────
    const Project = require("../models/Project");
    await Project.deleteMany({ userId });
    await Project.insertMany([
      {
        userId,
        name: "FinTech Mobile App Redesign",
        clientName: "FinTech Pulse UK",
        feeType: "fixed",
        totalBilled: 150000,
        targetHourlyRate: 2500,
        loggedHours: 45,
        directExpenses: 12000,
        status: "active",
        hoursLog: [{ description: "Wireframing and Figma Components", hours: 25, date: new Date(now.getFullYear(), now.getMonth(), 5) }, { description: "React Native UI Implementation", hours: 20, date: new Date(now.getFullYear(), now.getMonth(), 15) }],
        expenseLog: [{ title: "Figma Team Seat & UI Kit", amount: 6000, category: "Design Assets" }, { title: "App Store Developer Enrollment", amount: 6000, category: "Infrastructure" }],
      },
      {
        userId,
        name: "Growth Marketing Engine",
        clientName: "GrowthHackers Digital",
        feeType: "retainer",
        totalBilled: 80000,
        targetHourlyRate: 2500,
        loggedHours: 28,
        directExpenses: 8500,
        status: "active",
        hoursLog: [{ description: "Funnel Optimization & Copy", hours: 28, date: new Date(now.getFullYear(), now.getMonth(), 10) }],
        expenseLog: [{ title: "OpenAI API Credits for Copy Generation", amount: 8500, category: "APIs & Tokens" }],
      },
      {
        userId,
        name: "E-Commerce Brand Redesign (Scope Creep Sample)",
        clientName: "Studio Pixel Mumbai",
        feeType: "fixed",
        totalBilled: 45000,
        targetHourlyRate: 2500,
        loggedHours: 52,
        directExpenses: 6000,
        status: "active",
        hoursLog: [{ description: "Round 1-4 Unbilled Revision Cycles", hours: 52, date: new Date(now.getFullYear(), now.getMonth(), 12) }],
        expenseLog: [{ title: "Custom Shopify Theme License", amount: 6000, category: "License" }],
      },
    ]);
    console.log("✓ Projects and Unit Economics seeded.");

    console.log("✓ Goals and Recurring Transactions seeded.");
    console.log("\n=== Demo Data Generation Completed Successfully! ===");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed with error:", err);
    process.exit(1);
  }
};

seedDemoData();
