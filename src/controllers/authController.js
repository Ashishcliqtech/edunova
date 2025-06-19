const User = require("../models/User");
const { catchAsync, AppError } = require("../utils/errorUtils");
const { generateToken } = require("../utils/jwtUtils");
const successResponse = require("../utils/successResponse");
const logger = require("../utils/logger");
const SendGridService = require("../utils/sendgrid/SendGridService");
const crypto = require("crypto");

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
    // const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.create({
      name,
      email,
      password,
      role: "user",
      otp,
      otpExpireAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await user.save();

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
    const user = await User.findOne({ email }).select("+otp");

    if (!user) return next(new AppError("Not found: ", 404));

    // const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    console.log(`user otp: ${user.otp}, Body otp: ${otp}`);

    if (user.otp !== otp || user.otpExpireAt < Date.now()) {
      return next(new AppError("Invalid or expired Otp", 400));
    }

    // Generate JWT
    const token = generateToken(user._id);

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpireAt = undefined;
    user.lastLogin = new Date();
    user.token = token;
    user.isActive = true;
    await user.save();

    const data = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
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
    const userId = user._id;

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError("Invalid email or password", 401));
    }

    if (!user.isActive) {
      return next(new AppError("Account is deactivated", 401));
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
