const AuditLog = require("../models/AuditLog");
const logger = require("./logger");

/**
 * Records a financial audit log event
 */
const logAuditEvent = async ({
  userId,
  action,
  resource,
  resourceId,
  details = {},
  req,
  result = "SUCCESS",
}) => {
  try {
    const ipAddress = req?.headers["x-forwarded-for"] || req?.socket?.remoteAddress || "";
    const userAgent = req?.headers["user-agent"] || "";

    // Sanitize details to avoid recording secrets
    const sanitizedDetails = { ...details };
    delete sanitizedDetails.password;
    delete sanitizedDetails.token;
    delete sanitizedDetails.apiKey;

    await AuditLog.create({
      userId,
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : undefined,
      details: sanitizedDetails,
      ipAddress: String(ipAddress),
      userAgent: String(userAgent).substring(0, 200),
      result,
    });
  } catch (err) {
    logger.error({ err }, "[AuditLog] Failed to persist audit log entry");
  }
};

module.exports = {
  logAuditEvent,
};
