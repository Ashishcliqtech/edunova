// middleware/authMiddleware.js (UPDATED)
const { verifyAccessToken } = require('../utils/jwtUtils'); // This now expects a more flexible verifyAccessToken
const User = require('../models/User');
const config = require('../config/config');
const { AppError } = require('../utils/errorUtils');
const redisClient = require('../utils/redisClient/redisclient');

// Middleware to verify user authentication
const protect = async (req, res, next) => {
  try {
    // Support both Authorization and x-access-token headers
    let accessToken;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.split(' ')[1];
    } else if (req.headers['x-access-token']) {
      accessToken = req.headers['x-access-token'];
    }

    if (!accessToken) {
      return next(new AppError('Access denied. No token provided.', 401));
    }

    const decoded = verifyAccessToken(accessToken);

    const isBlacklisted = await redisClient.get(`blacklist:${accessToken}`);
    if (isBlacklisted) {
      return next(new AppError('Access token is blacklisted. Please log in again.', 401));
    }

    // Find the user from the database based on the decoded token ID
    const user = await User.findById(decoded.id).select('-password'); // Exclude password from user object
    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401));
    }
    if (!user.isActive) { // Assuming an isActive field for user accounts
      return next(new AppError('Your account has been deactivated.', 401));
    }


    req.user = user; // Attach the full user object (or specific fields) to the request
    req.isAuthenticated = true; // Indicate that the user is authenticated
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.message.includes('No access token found')) {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      // You might handle refresh token logic here or on the client-side
      return next(new AppError('Access token expired. Please refresh your token or log in again.', 401));
    }
    // Generic error for any other authentication failure
    console.error("Authentication Error:", error.message);
    next(new AppError('Authentication failed. Please try again.', 401));
  }
};

// Middleware to restrict access to admin users
const adminOnly = async (req, res, next) => {
  if (!req.user?.id) {
    return next(new AppError('Authentication required.', 401));
  }

  try {
    const userInDB = await User.findById(req.user.id).select('role isActive');

    if (!userInDB) return next(new AppError('User not found.', 404));
    if (!userInDB.isActive) return next(new AppError('Account deactivated.', 401));
    if (userInDB.role !== 'admin') {
      return next(new AppError('Admin privileges required.', 403));
    }

    req.user.role = userInDB.role;
    next();
  } catch (error) {
    next(new AppError('Authorization error', 500));
  }
};

module.exports = { protect, adminOnly };