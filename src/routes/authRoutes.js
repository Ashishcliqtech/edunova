const express = require("express");
const {
  signup,
  login,
  getMe,
  verifyOtp,
  logout,
  forgotPassword,
  changePassword,
  verifyForgotOtp,
  resetPassword,
  refreshAccessToken,
  resendOtp,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const {
  validateSignup,
  validateLogin,
  validateVerifyOtp,
  validateSendOtp,
  validateChangePasswordDto,
  resetPasswordDto,
} = require("../middleware/validationMiddleware");

const router = express.Router();

router.post("/signup", validateSignup, signup);
router.post("/verify-otp", validateVerifyOtp, verifyOtp);
router.post("/resend-otp", validateSendOtp, resendOtp);
router.post("/login", validateLogin, login);
router.get("/refresh-token", refreshAccessToken);
router.post("/logout", protect, logout);
router.post("/forgot-password", validateSendOtp, forgotPassword);
router.post("/reset-password", resetPasswordDto, resetPassword);
router.post("/verify-forgot-otp", validateVerifyOtp, verifyForgotOtp);
router.post(
  "/change-password",
  protect,
  validateChangePasswordDto,
  changePassword
);
router.get("/me", protect, getMe);

module.exports = router;
