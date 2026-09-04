/**
 * Zod request validation middleware
 */
const validate = (schema, source = "body") => (req, res, next) => {
  try {
    const dataToValidate = source === "query" ? req.query : source === "params" ? req.params : req.body;
    const parsed = schema.parse(dataToValidate);
    if (source === "body") req.body = parsed;
    else if (source === "query") req.query = parsed;
    else req.params = parsed;
    next();
  } catch (err) {
    if (err.errors) {
      const details = err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details,
        },
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: err.message,
      },
    });
  }
};

module.exports = { validate };
