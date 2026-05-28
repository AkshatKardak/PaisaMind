const express = require("express");
const router = express.Router();
const {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendReminder,
  createCheckoutSession,
} = require("../controllers/invoiceController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getInvoices);
router.post("/", protect, createInvoice);
router.put("/:id", protect, updateInvoice);
router.delete("/:id", protect, deleteInvoice);
router.post("/:id/reminder", protect, sendReminder);
router.post("/:id/checkout", protect, createCheckoutSession);

module.exports = router;