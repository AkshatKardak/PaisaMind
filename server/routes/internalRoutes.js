const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { sweepPendingInvoices, verifySweepToken } = require("../services/paymentReconciliationService");

/**
 * @desc Scheduled sweep for pending invoices
 * @route POST /api/internal/sweep-pending
 * @access Protected via SWEEP_TOKEN header/query
 */
router.post(
  "/sweep-pending",
  asyncHandler(async (req, res) => {
    const providedToken = req.headers["x-sweep-token"] || req.query.token;

    if (!providedToken || !verifySweepToken(providedToken)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or missing sweep token.",
      });
    }

    const result = await sweepPendingInvoices();
    return res.status(200).json({
      success: true,
      ...result,
    });
  })
);

module.exports = router;
