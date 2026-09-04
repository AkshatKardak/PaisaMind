let pino;
try {
  pino = require("pino");
} catch (e) {
  // Fallback simple structured logger if pino is installing
  pino = () => ({
    info: (...args) => console.log(new Date().toISOString(), "[INFO]", ...args),
    warn: (...args) => console.warn(new Date().toISOString(), "[WARN]", ...args),
    error: (...args) => console.error(new Date().toISOString(), "[ERROR]", ...args),
    debug: (...args) => console.debug(new Date().toISOString(), "[DEBUG]", ...args),
    child: () => pino(),
  });
}

const isProduction = process.env.NODE_ENV === "production";

const logger = typeof pino === "function" && pino.name === "pino"
  ? pino({
      level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
      redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "password",
        "token",
        "apiKey",
        "GROQ_API_KEY",
        "FIREBASE_PRIVATE_KEY",
        "RESEND_API_KEY",
        "RAZORPAY_KEY_SECRET",
      ],
      timestamp: pino.stdTimeFunctions ? pino.stdTimeFunctions.isoTime : undefined,
    })
  : {
      info: (...args) => console.log(new Date().toISOString(), "[INFO]", ...args),
      warn: (...args) => console.warn(new Date().toISOString(), "[WARN]", ...args),
      error: (...args) => console.error(new Date().toISOString(), "[ERROR]", ...args),
      debug: (...args) => console.debug(new Date().toISOString(), "[DEBUG]", ...args),
      child: () => logger,
    };

module.exports = logger;
