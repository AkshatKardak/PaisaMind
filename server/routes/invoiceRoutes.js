const express = require("express");
const router = express.Router();
const {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendReminder,
  createCheckoutSession,
  handleWebhook,
} = require("../controllers/invoiceController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getInvoices);
router.post("/", protect, createInvoice);
router.put("/:id", protect, updateInvoice);
router.delete("/:id", protect, deleteInvoice);
router.post("/:id/reminder", protect, sendReminder);
router.post("/:id/checkout", protect, createCheckoutSession);

// Razorpay webhook — public, no JWT auth
router.post("/webhook/razorpay", handleWebhook);

module.exports = router;