require("dotenv").config(); // ← MUST be absolute first line
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

console.log("[server] Starting backend...");

const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const morgan       = require("morgan");
const rateLimit    = require("express-rate-limit");
const helmet       = require("helmet");
const connectDB    = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const authRoutes       = require("./routes/authRoutes");
const incomeRoutes     = require("./routes/incomeRoutes");
const expenseRoutes    = require("./routes/expenseRoutes");
const goalRoutes       = require("./routes/goalRoutes");
const invoiceRoutes    = require("./routes/invoiceRoutes");
const taxRoutes        = require("./routes/taxRoutes");
const aiRoutes         = require("./routes/aiRoutes");
const budgetRoutes     = require("./routes/budgetRoutes");
const recurringRoutes  = require("./routes/recurringRoutes");
const analyticsRoutes  = require("./routes/analyticsRoutes");
const scenarioRoutes   = require("./routes/scenarioRoutes");
const netWorthRoutes   = require("./routes/netWorthRoutes");
const statementRoutes  = require("./routes/statementRoutes");
const copilotRoutes    = require("./routes/copilotRoutes");
const startCronJobs    = require("./jobs/cronJobs");

connectDB();

const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: false,
  })
);

// Public health check endpoint for monitoring & keep-alive pings
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many requests. Please try again later." } },
});

const copilotLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many AI requests. Please wait a few minutes and try again." } },
});

app.use("/api/", generalLimiter);

app.get("/", (req, res) => {
  res.json({ message: "PaisaMind API running - Financial Intelligence OS" });
});

// Existing Core Routes
app.use("/api/auth",       authRoutes);
app.use("/api/income",     incomeRoutes);
app.use("/api/expenses",   expenseRoutes);
app.use("/api/goals",      goalRoutes);
app.use("/api/invoices",   invoiceRoutes);
app.use("/api/tax",        taxRoutes);
app.use("/api/ai",         copilotLimiter, aiRoutes);
app.use("/api/budgets",    budgetRoutes);
app.use("/api/recurring",  recurringRoutes);

// Upgraded Financial Intelligence Routes
app.use("/api/analytics",  analyticsRoutes);
app.use("/api/scenarios",  scenarioRoutes);
app.use("/api/net-worth",  netWorthRoutes);
app.use("/api/statements", statementRoutes);
app.use("/api/profitability", require("./routes/profitabilityRoutes"));
app.use("/api/tds",           require("./routes/tdsRoutes"));
app.use("/api/copilot",    copilotLimiter, copilotRoutes);

app.use(notFound);
app.use(errorHandler);

startCronJobs();
console.log("[server] Cron job loaded");

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[server] Server running on port ${PORT}`);
});
