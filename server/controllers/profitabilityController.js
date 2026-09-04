const asyncHandler = require("express-async-handler");
const Project = require("../models/Project");
const { calculateProfitabilityOverview } = require("../services/profitabilityService");
const { logAuditEvent } = require("../services/auditService");

/**
 * Get full unit economics & profitability overview
 */
const getProfitabilityOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const overview = await calculateProfitabilityOverview(userId);
  return res.status(200).json({ success: true, data: overview });
});

/**
 * Create a new client project
 */
const createProject = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name, clientName, feeType, totalBilled, targetHourlyRate, deadline, notes } = req.body;

  const project = await Project.create({
    userId,
    name,
    clientName,
    feeType: feeType || "fixed",
    totalBilled: Number(totalBilled || 0),
    targetHourlyRate: Number(targetHourlyRate || 2500),
    deadline: deadline || undefined,
    notes: notes || "",
  });

  await logAuditEvent({
    userId,
    action: "PROJECT_CREATED",
    resource: "Project",
    resourceId: String(project._id),
    details: { name: project.name, clientName: project.clientName },
    req,
  });

  return res.status(201).json({ success: true, data: project });
});

/**
 * Log work hours on a project
 */
const logProjectHours = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { hours, description, date } = req.body;

  const project = await Project.findOne({ _id: id, userId });
  if (!project) return res.status(404).json({ success: false, message: "Project not found" });

  const numHours = Number(hours || 0);
  project.hoursLog.push({
    description: description || "Development & design work",
    hours: numHours,
    date: date || new Date(),
  });
  project.loggedHours = (project.loggedHours || 0) + numHours;
  await project.save();

  return res.status(200).json({ success: true, data: project });
});

/**
 * Log direct cost/expense on a project
 */
const logProjectExpense = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { title, amount, category, date } = req.body;

  const project = await Project.findOne({ _id: id, userId });
  if (!project) return res.status(404).json({ success: false, message: "Project not found" });

  const numAmount = Number(amount || 0);
  project.expenseLog.push({
    title,
    amount: numAmount,
    category: category || "Direct Project Cost",
    date: date || new Date(),
  });
  project.directExpenses = (project.directExpenses || 0) + numAmount;
  await project.save();

  return res.status(200).json({ success: true, data: project });
});

/**
 * Delete a project
 */
const deleteProject = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const project = await Project.findOneAndDelete({ _id: req.params.id, userId });
  if (!project) return res.status(404).json({ success: false, message: "Project not found" });

  await logAuditEvent({
    userId,
    action: "PROJECT_DELETED",
    resource: "Project",
    resourceId: req.params.id,
    details: { name: project.name },
    req,
  });

  return res.status(200).json({ success: true, message: "Project removed successfully." });
});

module.exports = {
  getProfitabilityOverview,
  createProject,
  logProjectHours,
  logProjectExpense,
  deleteProject,
};
