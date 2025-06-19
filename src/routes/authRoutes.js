const express = require('express');
const { signup, login, getMe, verifyOtp, sendOtp, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateSignup, validateLogin, validateVerifyOtp, validateSendOtp } = require('../middleware/validationMiddleware');

const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/verify-otp', validateVerifyOtp, verifyOtp);
router.post('/send-otp', validateSendOtp, sendOtp)
router.post('/login', validateLogin, login);
router.delete('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;