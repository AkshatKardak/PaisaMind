const asyncHandler = require("express-async-handler");
const admin  = require("../config/firebaseAdmin");
const User   = require("../models/User");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/* Called by client after every Firebase sign-in to sync user to MongoDB */
const firebaseSync = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token" });
  }

  const idToken = authHeader.split(" ")[1];
  const decoded = await admin.auth().verifyIdToken(idToken);

  const { uid, name, email, photoURL } = req.body;

  let user = await User.findOne({ firebaseUid: uid });

  if (!user) {
    // New user — create in MongoDB
    user = await User.create({
      firebaseUid: uid,
      name:        name || decoded.name || "PaisaMind User",
      email:       email || decoded.email,
      photoURL:    photoURL || decoded.picture || "",
    });

    // Welcome email
    try {
      await resend.emails.send({
        from:    process.env.EMAIL_FROM,
        to:      user.email,
        subject: "Welcome to PaisaMind 🎉",
        html:    `<p>Hi ${user.name}, welcome to PaisaMind — your AI-powered finance OS!</p>`,
      });
    } catch (_) {}
  }

  res.status(200).json({ success: true, data: user });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ firebaseUid: req.user.firebaseUid });

  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  user.name           = req.body.name           ?? user.name;
  user.taxRegime      = req.body.taxRegime       ?? user.taxRegime;
  user.investments80C = req.body.investments80C  ?? user.investments80C;
  user.investments80D = req.body.investments80D  ?? user.investments80D;

  const updated = await user.save();
  res.json({ success: true, data: updated });
});

module.exports = { firebaseSync, getMe, updateProfile };