const asyncHandler = require("express-async-handler");
const Asset = require("../models/Asset");
const Liability = require("../models/Liability");
const { calculateNetWorthAndDebt } = require("../services/netWorthService");
const { logAuditEvent } = require("../services/auditService");

const getNetWorthOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const data = await calculateNetWorthAndDebt(userId);
  return res.status(200).json({ success: true, data });
});

const createAsset = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const asset = await Asset.create({ ...req.body, userId });
  await logAuditEvent({
    userId,
    action: "ASSET_MODIFIED",
    resource: "Asset",
    resourceId: String(asset._id),
    details: { name: asset.name, amount: asset.amount },
    req,
  });
  return res.status(201).json({ success: true, data: asset });
});

const deleteAsset = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const asset = await Asset.findOneAndDelete({ _id: req.params.id, userId });
  if (!asset) return res.status(404).json({ success: false, message: "Asset not found" });
  await logAuditEvent({
    userId,
    action: "ASSET_MODIFIED",
    resource: "Asset",
    resourceId: req.params.id,
    details: { action: "deleted" },
    req,
  });
  return res.status(200).json({ success: true, message: "Asset removed successfully" });
});

const createLiability = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const liability = await Liability.create({ ...req.body, userId });
  await logAuditEvent({
    userId,
    action: "LIABILITY_MODIFIED",
    resource: "Liability",
    resourceId: String(liability._id),
    details: { name: liability.name, currentBalance: liability.currentBalance },
    req,
  });
  return res.status(201).json({ success: true, data: liability });
});

const deleteLiability = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const liability = await Liability.findOneAndDelete({ _id: req.params.id, userId });
  if (!liability) return res.status(404).json({ success: false, message: "Liability not found" });
  await logAuditEvent({
    userId,
    action: "LIABILITY_MODIFIED",
    resource: "Liability",
    resourceId: req.params.id,
    details: { action: "deleted" },
    req,
  });
  return res.status(200).json({ success: true, message: "Liability removed successfully" });
});

module.exports = {
  getNetWorthOverview,
  createAsset,
  deleteAsset,
  createLiability,
  deleteLiability,
};
