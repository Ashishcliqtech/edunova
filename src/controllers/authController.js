const User = require("../models/User");
const { catchAsync, AppError } = require("../utils/errorUtils");
const {
  generateAccessToken,
  generateRefreshToken,
  sendTokenResponse,
  verifyAccessToken,
} = require("../utils/jwtUtils");
const successResponse = require("../utils/successResponse");
const logger = require("../utils/logger");
const SendGridService = require("../utils/sendgrid/SendGridService");
const redis = require("../utils/redisClient/redisclient");
const config = require("../config/config");

// Utility function to generate a 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Utility function to extract refresh token from request cookies
const getRefreshTokenFromCookie = (req) =>
  req.cookies ? req.cookies.refreshToken : null;

// Handles user signup by storing data in Redis and sending OTP for verification
// @param {Object} req - Express request object containing name, email, and password in body
// @param {Object} res - Express response object
// @param {Function} next - Express next middleware function
// @returns {Object} JSON response with success message
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

    // Generate OTP and check for existing OTP in Redis
    const otp = generateOTP();
    const redisKey = `signup:${email.toLowerCase()}`;
    const existingOtp = await redis.get(redisKey);
    if (existingOtp) {
      return next(
        new AppError("OTP already sent. Please check your email.", 400)
      );
    }

    // Store user data temporarily in Redis with 10-minute expiry
    const redisData = { name, email, password, role: "user", otp };
    await redis.set(redisKey, JSON.stringify(redisData), { ex: 600 });

    // Send OTP via email
    await SendGridService.sendOtp(name, email, otp);

    return successResponse(res, 201, "OTP sent to your email. Please verify.");
  } catch (error) {
    logger.error("Error during signup:", error);
    return next(
      new AppError("Internal server error during signup", 500, error)
    );
  }
});

// Verifies OTP and creates a new user account
// @param {Object} req - Express request object containing email and otp in body
// @param {Object} res - Express response object
// @param {Function} next - Express next middleware function
// @returns {Object} JSON response with tokens and user data
const verifyOtp = catchAsync(async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const redisKey = `signup:${email.toLowerCase()}`;
    const userDataJson = await redis.get(redisKey);

    // Check if signup session exists
    if (!userDataJson) {
      return next(
        new AppError(
          "Signup session expired or invalid. Please try signing up again.",
          400
        )
      );
    }

    const parsedUserData = userDataJson;
    if (parsedUserData.otp !== otp) {
      return next(new AppError("Invalid OTP", 400));
    }

    // Create new user in database
    const newUser = await User.create({
      name: parsedUserData.name,
      email: parsedUserData.email,
      password: parsedUserData.password,
      role: parsedUserData.role,
      isVerified: true,
      isActive: true,
    });

    // Generate tokens and store refresh token
    const accessToken = generateAccessToken(newUser._id, newUser.role);
    const refreshToken = generateRefreshToken();
    await newUser.setRefreshToken(refreshToken);
    newUser.lastLogin = new Date();
    await newUser.save({ validateBeforeSave: false });

    // Clean up Redis
    await redis.del(redisKey);

    // Set custom headers
    res.setHeader("x-access-token", accessToken);
    res.setHeader("x-user-id", newUser._id.toString());

    return sendTokenResponse(newUser, accessToken, refreshToken, 200, res);
  } catch (error) {
    logger.error("Error during OTP verification:", error);
    return next(
      new AppError("Internal server error during OTP verification", 500, error)
    );
  }
});

// Authenticates user and generates access and refresh tokens
// @param {Object} req - Express request object containing email and password in body
// @param {Object} res - Express response object
// @param {Function} next - Express next middleware function
// @returns {Object} JSON response with tokens and user data
const login = catchAsync(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return next(new AppError("Please provide an email and password", 400));
    }

    // Fetch user with password and refresh token
    const user = await User.findOne({ email }).select(
      "+password +refreshToken"
    );

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError("Invalid email or password", 401));
    }

    // Check account status
    if (!user.isActive) {
      return next(
        new AppError(
          "Your account is deactivated. Please contact support.",
          401
        )
      );
    }
    if (!user.isVerified) {
      return next(new AppError("Please verify your email to login.", 403));
    }

    // Generate tokens and update user
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken();
    await user.setRefreshToken(refreshToken);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Set custom headers
    res.setHeader("x-access-token", accessToken);
    res.setHeader("x-user-id", user._id.toString());

    return sendTokenResponse(user, accessToken, refreshToken, 200, res);
  } catch (error) {
    logger.error(`Error during login:`, error);
    return next(new AppError("Internal server error during login", 500, error));
  }
});

// Logs out user by clearing tokens and blacklisting access token
// @param {Object} req - Express request object with authorization header and cookies
// @param {Object} res - Express response object
// @param {Function} next - Express next middleware function
// @returns {Object} JSON response with success message
const logout = catchAsync(async (req, res, next) => {
  const accessToken = req.headers.authorization.split(" ")[1];
  const refreshTokenFromCookie = getRefreshTokenFromCookie(req);

  try {
    // Blacklist access token in Redis
    const decodedAccessToken = verifyAccessToken(accessToken);
    const expiresInSeconds =
      decodedAccessToken.exp - Math.floor(Date.now() / 1000);
    if (expiresInSeconds > 0) {
      await redis.set(`blacklist:${accessToken}`, "true", {
        EX: expiresInSeconds,
      });
    }

    // Clear refresh token from user
    const user = await User.findById(req.user.id).select("+refreshToken");
    if (user && user.refreshToken === refreshTokenFromCookie) {
      await user.clearRefreshToken();
      await user.save({ validateBeforeSave: false });
    }

    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict",
    });

    return successResponse(res, 200, "Logout successful");
  } catch (error) {
    logger.error("Error during logout:", error);
    return next(
      new AppError("Logout failed due to a server error.", 500, error)
    );
  }
});

// Refreshes access token using a valid refresh token
// @param {Object} req - Express request object with refresh token in cookies
// @param {Object} res - Express response object
// @param {Function} next - Express next middleware function
// @returns {Object} JSON response with new tokens
const refreshAccessToken = catchAsync(async (req, res, next) => {
  const refreshToken = getRefreshTokenFromCookie(req);

  if (!refreshToken) {
    return next(
      new AppError(
        "No refresh token provided in cookies. Please log in again.",
        401
      )
    );
  }

  try {
    // Verify refresh token and user
    const user = await User.findOne({ refreshToken }).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken) {
      return next(
        new AppError(
          "Invalid or expired refresh token. Please log in again.",
          401
        )
      );
    }

    if (!user.isActive) {
      return next(
        new AppError("Account deactivated. Please contact support.", 401)
      );
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken();
    await user.setRefreshToken(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    return sendTokenResponse(user, newAccessToken, newRefreshToken, 200, res);
  } catch (error) {
    logger.error("Error refreshing token:", error);
    return next(
      new AppError("Token refresh failed due to a server error.", 500, error)
    );
  }
});

// Initiates password reset by sending OTP to user's email
// @param {Object} req - Express request object containing email in body
// @param {Object} res - Express response object
// @param {Function} next - Express next middleware function
// @returns {Object} JSON response with success message
const forgotPassword = catchAsync(async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(
        new AppError(`Account doesn't exist with this email: ${email}`, 404)
      );
    }

    // Generate and store OTP
    const otp = generateOTP();
    const redisKey = `forgot:${email.toLowerCase()}`;
    const existing = await redis.get(redisKey);
    if (existing) {
      return next(
        new AppError(
          "OTP already sent. Please wait for 10 minutes before resending.",
          429
        )
      );
    }

    await redis.set(redisKey, JSON.stringify({ otp }), { ex: 600 });
    await SendGridService.sendOtp(user.name, email, otp);

    return successResponse(
      res,
      200,
      "OTP sent to your email for password reset."
    );
  } catch (error) {
    logger.error("Error during forgot password:", error);
    return next(
      new AppError("Internal server error during forgot password", 500, error)
    );
  }
});

// Verifies OTP for password reset
// @param {Object} req - Express request object containing email and otp in body
// @param {Object} res - Express response object
// @param {Function} next - Express next middleware function
// @returns {Object} JSON response with success message
const verifyForgotOtp = catchAsync(async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const redisKey = `forgot:${email.toLowerCase()}`;
    const redisDataJson = await redis.get(redisKey);

    if (!redisDataJson) {
      return next(new AppError("OTP expired or invalid", 400));
    }

    const parsed = redisDataJson;
    if (parsed.otp !== otp) {
      return next(new AppError("Invalid OTP", 400));
    }

    // Mark OTP as verified
    await redis.set(`verified:${email.toLowerCase()}`, "true", { ex: 600 });

    return successResponse(
      res,
      200,
      "OTP verified. You may now reset your password."
    );
  } catch (error) {
    logger.error("Error verifying OTP for forgot password:", error);
    return next(
      new AppError("Internal server error during OTP verification", 500, error)
    );
  }
});

// Resets user password after OTP verification
// @param {Object} req - Express request object containing email, newPassword, and confirmPassword in body
// @param {Object} res - Express response object
// @param {Function} next - Express next middleware function
// @returns {Object} JSON response with success message
const resetPassword = catchAsync(async (req, res, next) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return next(new AppError("User not found", 404));

    if (newPassword !== confirmPassword) {
      return next(new AppError("Passwords do not match", 400));
    }

    // Check if OTP was verified
    const verifiedKey = `verified:${email.toLowerCase()}`;
    const verified = await redis.get(verifiedKey);
    if (!verified) {
      return next(
        new AppError(
          "OTP not verified or session expired. Please go through forgot password flow again.",
          403
        )
      );
    }

    // Update password and clean up Redis
    user.password = newPassword;
    await user.save();
    await redis.del(verifiedKey);
    await redis.del(`forgot:${email.toLowerCase()}`);

    return successResponse(
      res,
      200,
      "Password reset successfully. Please login."
    );
  } catch (error) {
    logger.error("Error resetting password:", error);
    return next(
      new AppError("Internal server error during password reset", 500, error)
    );
  }
});

// Changes password for an authenticated user
// @param {Object} req - Express request object containing currentPassword, newPassword, and confirmPassword in body
// @param {Object} res - Express response object
// @param {Function} next - Express next middleware function
// @returns {Object} JSON response with success message
const changePassword = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Verify current password
    const user = await User.findById(userId).select("+password");
    if (!user || !(await user.comparePassword(currentPassword))) {
      return next(new AppError("Current password is incorrect", 401));
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError("New passwords do not match", 400));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return successResponse(res, 200, "Password changed successfully.");
  } catch (error) {
    logger.error("Error during change password:", error);
    return next(
      new AppError("Internal server error during password change", 500, error)
    );
  }
});

// Sends OTP for general verification purposes
// @param {Object} req - Express request object containing email in body
// @param {Object} res - Express response object
// @param {Function} next - Express next middleware function
// @returns {Object} JSON response with success message
const resendOtp = catchAsync(async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError("No account found with this email", 404));
    }

    // Generate and store OTP
    const otp = generateOTP();
    const redisKey = `generic_otp:${email.toLowerCase()}`;
    const existing = await redis.get(redisKey);
    if (existing) {
      return next(
        new AppError(
          "OTP already sent. Please wait for 10 minutes before resending.",
          429
        )
      );
    }

    await redis.set(redisKey, JSON.stringify({ otp }), { ex: 60 });
    await SendGridService.sendOtp(user.name, email, otp);

    return successResponse(res, 200, "OTP sent successfully.");
  } catch (error) {
    logger.error("Error during sending OTP:", error);
    return next(
      new AppError("Internal server error during sending OTP", 500, error)
    );
  }
});

// Retrieves data for the currently authenticated user
// @param {Object} req - Express request object with user data in req.user
// @param {Object} res - Express response object
// @param {Function} next - Express next middleware function
// @returns {Object} JSON response with user data
const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select(
    "-password -refreshToken"
  );
  if (!user) {
    return next(
      new AppError("User not found. Token might be for a deleted user.", 404)
    );
  }

  return successResponse(res, 200, "User data retrieved successfully", {
    user: user.toJSON(),
  });
});

module.exports = {
  signup,
  login,
  logout,
  refreshAccessToken,
  verifyOtp,
  resendOtp,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
  changePassword,
  getMe,
};
