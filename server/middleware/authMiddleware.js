const admin = require("../config/firebaseAdmin");
const User  = require("../models/User");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const user    = await User.findOne({ firebaseUid: decoded.uid }).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found in database" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token verification failed" });
  }
};

module.exports = { protect };