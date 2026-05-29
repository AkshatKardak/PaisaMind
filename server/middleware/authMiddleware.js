const admin = require("../config/firebaseAdmin");
const User  = require("../models/User");

const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const token   = header.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    // Find by Firebase UID first; fall back to email for legacy accounts
    let user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email });
      // Back-fill the uid so future lookups are fast
      if (user) {
        user.firebaseUid = decoded.uid;
        await user.save();
      }
    }

    if (!user) {
      // Auto-provision: first time a valid Firebase user hits the API
      user = await User.create({
        firebaseUid : decoded.uid,
        email       : decoded.email || "",
        name        : decoded.name  || decoded.email?.split("@")[0] || "User",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("[auth] token verification failed:", err.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = { protect };
