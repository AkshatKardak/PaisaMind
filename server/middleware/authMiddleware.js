let admin;
try {
  admin = require("../config/firebaseAdmin");
} catch (e) {
  console.error("[auth] firebaseAdmin failed to load:", e.message);
}

const User = require("../models/User");

const protect = async (req, res, next) => {
  // Guard: if Firebase Admin didn't initialise (missing env vars), fail fast with a clear message
  if (!admin) {
    return res.status(500).json({
      success: false,
      message: "Server auth not configured — FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY missing from .env",
    });
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const token   = header.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    // 1. Find by Firebase UID
    let user = await User.findOne({ firebaseUid: decoded.uid });

    // 2. Fall back to email for accounts created before UID was stored
    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email });
      if (user) {
        user.firebaseUid = decoded.uid;
        await user.save();
      }
    }

    // 3. Auto-provision — first-ever login for this Firebase user
    if (!user) {
      const email = decoded.email;
      if (!email) {
        // Phone-auth or anonymous users have no email — cannot create User doc
        return res.status(401).json({ success: false, message: "Account has no email address" });
      }
      user = await User.create({
        firebaseUid : decoded.uid,
        email,
        name        : decoded.name || email.split("@")[0] || "User",
        photoURL    : decoded.picture || "",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("[auth] protect middleware error:", err.message);
    // Distinguish token errors from DB errors so the client shows the right message
    const isTokenError = err.code?.startsWith("auth/") || err.message?.includes("token");
    return res.status(isTokenError ? 401 : 500).json({
      success: false,
      message: isTokenError ? "Invalid or expired token" : err.message,
    });
  }
};

module.exports = { protect };
