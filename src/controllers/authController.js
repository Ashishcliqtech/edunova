const User = require("../models/User");
const { catchAsync, AppError } = require("../utils/errorUtils");
const { generateToken } = require("../utils/jwtUtils");
const successResponse = require("../utils/successResponse");
const logger = require("../utils/logger");
const SendGridService = require("../utils/sendgrid/SendGridService");
const crypto = require("crypto");
const redis = require("../utils/redisClient/redisclient");

const signup = catchAsync(async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (!existingUser.isVerified) {
        return next(
          new AppError(
            "Please verify your email to activate your account.",
            400
          )
        );
      }
      return next(
        new AppError("Account already registered. Please login.", 400)
      );
    }

    const otp = generateOTP();
    const redisKey = `signup:${email.toLowerCase()}`;

    // Check if OTP already exists in Redis
    const existingOtp = await redis.get(redisKey);
    if (existingOtp) {
      return next(
        new AppError("Otp already sent. Please check your email.", 400)
      );
    }

    // Prepare data to store in Redis
    const redisData = {
      name,
      email,
      password,
      role: "user",
      otp,
    };

    // Store OTP in Redis with a 10-minute expiration
    await redis.set(redisKey, JSON.stringify(redisData), { ex: 600 });

    await SendGridService.sendOtp(name, email, otp);

    return successResponse(res, 201, "Otp sent to your email. Please verify.");
  } catch (error) {
    logger.error("Error during signup", error);
    throw next(new AppError("Internal server error during signup", 500, error));
  }
});

const verifyOtp = catchAsync(async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const redisKey = `signup:${email.toLowerCase()}`;
    const userData = await redis.get(redisKey);

    if (!userData)
      return next(new AppError("Signup session expired or invalid", 400));

    const parsed = userData;

    if (parsed.otp !== otp) {
      return next(new AppError("Invalid OTP", 400));
    }

    const newUser = await User.create({
      name: parsed.name,
      email: parsed.email,
      password: parsed.password,
      role: "user",
      isVerified: true,
      lastLogin: new Date(),
      isActive: true,
    });

    // Generate JWT token for the new user
    const token = generateToken(newUser._id);
    newUser.token = token;
    await newUser.save();

    // clean up Redis key after successful verification
    await redis.del(redisKey);

    const data = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token: token,
    };

    return successResponse(res, 200, "Otp verified, Logged In: ", data);
  } catch (error) {
    logger.error("Error during otp veify", error);
    throw next(
      new AppError("Internal server error during verifying otp: ", 500, error)
    );
  }
});

// Send OTP to user's email for password reset or verification
const sendOtp = catchAsync(async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return next(new AppError("No account found with this email", 404));
    }

    const otp = generateOTP();

    user.otp = otp;
    user.otpExpireAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await SendGridService.sendOtp(user.name, email, otp);
    return successResponse(res, 200, "Otp send successfuly ");
  } catch (error) {
    logger.error("Error during sending otp", error);
    throw next(
      new AppError("Internal server error during sending otp : ", 500, error)
    );
  }
});

const logout = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user._id; // Get user ID from decoded token (middleware)

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Optional: Invalidate token stored in DB (if using token-based logout)
    user.token = undefined;
    await user.save({ validateBeforeSave: false });

    return successResponse(res, 200, "Logout successful");
  } catch (error) {
    logger.error("Error during logout", error);
    return next(
      new AppError("Internal server error during logout", 500, error)
    );
  }
});

const login = catchAsync(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    console.log("User found:", user);
    const userId = user._id;

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError("Invalid email or password", 401));
    }

    console.log("User found and password matched:", user);
    if (!user.isActive) {
      return next(new AppError("Account is deactivated", 401));
    }

    // 🔒 Optional: Check if email is verified
    if (!user.isVerified) {
      return next(new AppError("Please verify your email to login.", 403));
    }
    const token = generateToken(userId);

    user.lastLogin = new Date();
    user.token = token; // Optional: only if you store tokens in DB
    await user.save({ validateBeforeSave: false });

    const saferData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: token,
    };

    return successResponse(res, 200, "Login Successfully", saferData);
  } catch (error) {
    logger.error(`Error during login: ${error}`);
    throw next(new AppError("Interner server error during login", 500));
  }
});

const getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

module.exports = { signup, login, getMe, verifyOtp, sendOtp, logout };
