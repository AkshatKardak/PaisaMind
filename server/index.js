require("dotenv").config(); // ← MUST be absolute first line
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);


const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const connectDB = require("./config/db");
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

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ message: "PaisaMind API running" });
});

app.use("/api/auth",     authRoutes);
app.use("/api/income",   incomeRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/goals",    goalRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/tax",      taxRoutes);
app.use("/api/ai",       aiRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});