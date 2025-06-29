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

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const getRefreshTokenFromCookie = (req) =>
  req.cookies ? req.cookies.refreshToken : null;

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
    const existingOtp = await redis.get(redisKey);
    if (existingOtp) {
      return next(
        new AppError("OTP already sent. Please check your email.", 400)
      );
    }

    const redisData = { name, email, password, otp };
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

    const accessToken = generateAccessToken(newUser._id, newUser.role);
    const refreshToken = generateRefreshToken();
    newUser.refreshTokenExpires = Date.now() + config.REFRESH_TOKEN_EXPIRE_MS;
    await newUser.setRefreshToken(refreshToken);
    newUser.lastLogin = new Date();
    await newUser.save({ validateBeforeSave: false });

    await redis.del(redisKey);

    res.setHeader("x-access-token", accessToken);
    res.setHeader("x-user-id", newUser._id.toString());
    res.setHeader("x-user-role", newUser.role);
    logger.info(`User role: ${newUser.role}`);
    return sendTokenResponse(newUser, refreshToken, 200, res);
  } catch (error) {
    logger.error("Error during OTP verification:", error);
    return next(
      new AppError("Internal server error during OTP verification", 500, error)
    );
  }
});

const login = catchAsync(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Please provide an email and password", 400));
    }

    const user = await User.findOne({ email }).select(
      "+password +refreshToken"
    );

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError("Invalid email or password", 401));
    }

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

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken();
    user.refreshTokenExpires = Date.now() + config.REFRESH_TOKEN_EXPIRE_MS;
    await user.setRefreshToken(refreshToken);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.setHeader("x-access-token", accessToken);
    res.setHeader("x-user-id", user._id.toString());
    res.setHeader("x-user-role", user.role);
    logger.info(`User role: ${user.role}`);

    return sendTokenResponse(user, refreshToken, 200, res);
  } catch (error) {
    logger.error(`Error during login:`, error);
    return next(new AppError("Internal server error during login", 500, error));
  }
});

const logout = catchAsync(async (req, res, next) => {
  const accessToken = req.headers.authorization.split(" ")[1];
  const refreshTokenFromCookie = getRefreshTokenFromCookie(req);

  try {
    const decodedAccessToken = verifyAccessToken(accessToken);
    const expiresInSeconds =
      decodedAccessToken.exp - Math.floor(Date.now() / 1000);
    if (expiresInSeconds > 0) {
      await redis.set(`blacklist:${accessToken}`, "true", {
        EX: expiresInSeconds,
      });
    }

    const user = await User.findById(req.user.id).select("+refreshToken");
    if (user && user.refreshToken === refreshTokenFromCookie) {
      await user.clearRefreshToken();
      await user.save({ validateBeforeSave: false });
    }

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

const refreshAccessToken = catchAsync(async (req, res, next) => {
  const refreshToken = req.headers["x-refresh-token"];

  if (!refreshToken) {
    return next(
      new AppError("No refresh token provided. Please log in again.", 401)
    );
  }

  try {
    const user = await User.findOne({ refreshToken }).select(
      "+refreshToken +refreshTokenExpires"
    );

    if (
      !user ||
      user.refreshToken !== refreshToken ||
      user.refreshTokenExpires < Date.now()
    ) {
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
    user.refreshTokenExpires = Date.now() + config.REFRESH_TOKEN_EXPIRE_MS;
    await user.setRefreshToken(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    res.setHeader("x-access-token", newAccessToken);
    res.setHeader("x-user-id", user._id.toString());
    res.setHeader("x-user-role", user.role);
    logger.info(`User role: ${user.role}`);
    return sendTokenResponse(user, newRefreshToken, 200, res);
  } catch (error) {
    logger.error("Error refreshing token:", error);
    return next(
      new AppError("Token refresh failed due to a server error.", 500, error)
    );
  }
});

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
