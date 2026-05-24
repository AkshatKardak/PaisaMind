const express = require("express");

const {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateStatus,
  getInvoiceSummary,
  createPaymentLink,
} = require("../controllers/invoiceController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/summary", getInvoiceSummary);
router.post("/:id/payment-link", createPaymentLink);
router.patch("/:id/status", updateStatus);
router.route("/").get(getInvoices).post(createInvoice);
router.route("/:id").put(updateInvoice).delete(deleteInvoice);

module.exports = router;
