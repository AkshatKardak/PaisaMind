require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const goalRoutes = require("./routes/goalRoutes");
const taxRoutes = require("./routes/taxRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { stripeWebhook } = require("./controllers/invoiceController");
const startCronJobs = require("./jobs/cronJobs");

const app = express();
const PORT = process.env.PORT || 5000;

app.post(
  "/api/invoices/webhook/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "PaisaMind API is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/tax", taxRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    startCronJobs();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
