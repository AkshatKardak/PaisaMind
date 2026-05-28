const express = require("express");
const router  = express.Router();
const { firebaseSync, getMe, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/firebase-sync", firebaseSync);       // called after every login
router.get("/me",             protect, getMe);
router.put("/profile",        protect, updateProfile);

module.exports = router;