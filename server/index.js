require("dotenv").config(); // ← MUST be absolute first line
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const morgan       = require("morgan");
const rateLimit    = require("express-rate-limit");
const connectDB    = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const authRoutes    = require("./routes/authRoutes");
const incomeRoutes  = require("./routes/incomeRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const goalRoutes    = require("./routes/goalRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const taxRoutes     = require("./routes/taxRoutes");
const aiRoutes      = require("./routes/aiRoutes");

connectDB();
const app = express();

// Fix: accept multiple origins so preview deployments and local dev don't break
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server calls (no origin) and whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Allow Firebase popup auth — COOP must not be same-origin
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// Fix: rate-limit all AI routes — each user gets max 30 requests per 10 minutes
// Prevents Groq API quota burnout from accidental loops or abuse
const aiLimiter = rateLimit({
  windowMs:         10 * 60 * 1000,  // 10 minutes
  max:              30,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { success: false, message: "Too many AI requests. Please wait a few minutes and try again." },
});

app.get("/", (req, res) => {
  res.json({ message: "PaisaMind API running" });
});

app.get("/health", (req, res) => res.sendStatus(200));

app.use("/api/auth",     authRoutes);
app.use("/api/income",   incomeRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/goals",    goalRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/tax",      taxRoutes);
app.use("/api/ai",       aiLimiter, aiRoutes);  // Fix: rate limiter applied here

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
