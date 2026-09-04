const logger = require("../services/logger");

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const isProduction = process.env.NODE_ENV === "production";

  if (statusCode >= 500) {
    logger.error({ err, path: req.originalUrl, method: req.method }, "[ServerError] Unhandled error");
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode === 404 ? "NOT_FOUND" : statusCode === 401 ? "UNAUTHORIZED" : statusCode === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
      message: err.message || "An unexpected error occurred",
      stack: isProduction ? undefined : err.stack,
    },
  });
};

module.exports = { notFound, errorHandler };