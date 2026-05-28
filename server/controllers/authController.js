const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ success: false, message: "User already exists" });
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Welcome to PaisaMind",
        html: `<p>Hi ${user.name}, welcome to PaisaMind.</p>`,
      });
    } catch (error) {}

    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ success: false, message: "Invalid user data" });
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ success: false, message: "Invalid email or password" });
  }
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  res.status(200).json({
    success: true,
    data: user,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.taxRegime = req.body.taxRegime || user.taxRegime;
    user.investments80C = req.body.investments80C ?? user.investments80C;
    user.investments80D = req.body.investments80D ?? user.investments80D;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      taxRegime: updatedUser.taxRegime,
      investments80C: updatedUser.investments80C,
      investments80D: updatedUser.investments80D,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404).json({ success: false, message: "User not found" });
  }
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
};