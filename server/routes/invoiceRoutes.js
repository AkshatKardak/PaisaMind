const express = require("express");
const router = express.Router();
const {
  getInvoices,
  getSummary,
  createInvoice,
  updateInvoice,
  updateStatus,
  deleteInvoice,
  sendReminder,
  createCheckoutSession,
  handleWebhook,
  downloadPDF,
} = require("../controllers/invoiceController");
const { protect } = require("../middleware/authMiddleware");

// IMPORTANT: /summary must be before /:id so Express doesn't treat "summary" as an id param
router.get("/summary", protect, getSummary);
router.get("/", protect, getInvoices);
router.post("/", protect, createInvoice);
router.put("/:id", protect, updateInvoice);
router.patch("/:id/status", protect, updateStatus);
router.delete("/:id", protect, deleteInvoice);
router.post("/:id/reminder", protect, sendReminder);
router.post("/:id/checkout", protect, createCheckoutSession);
router.get("/:id/pdf", protect, downloadPDF);

// Razorpay webhook — public, no JWT auth
router.post("/webhook/razorpay", handleWebhook);

module.exports = router;
