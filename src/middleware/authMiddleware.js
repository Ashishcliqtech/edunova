// middleware/authMiddleware.js (UPDATED)
const { verifyAccessToken } = require('../utils/jwtUtils');
const User = require('../models/User');
const config = require('../config/config');
const { AppError } = require('../utils/errorUtils');
const redisClient = require('../utils/redisClient/redisclient');

const protect = async (req, res, next) => {
  try {
    let accessToken;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.split(' ')[1];
    }

    if (!accessToken) {
      return next(new AppError('Access denied. No token provided.', 401));
    }

    const decoded = verifyAccessToken(accessToken);

    const isBlacklisted = await redisClient.get(`blacklist:${accessToken}`);
    if (isBlacklisted) {
      return next(new AppError('Access token is blacklisted. Please log in again.', 401));
    }

    const user = await User.findById(decoded.id).select('-password'); 
    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401));
    }
    if (!user.isActive) { 
      return next(new AppError('Your account has been deactivated.', 401));
    }

    req.user = user; 
    req.isAuthenticated = true; 
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.message.includes('No access token found')) {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired. Please refresh your token or log in again.', 401));
    }
    console.error("Authentication Error:", error.message);
    next(new AppError('Authentication failed. Please try again.', 401));
  }
};

const userOnly = async (req, res, next) => {
  if (!req.user?.id) {
    return next(new AppError('Authentication required.', 401));
  }

  try {
    const userInDB = await User.findById(req.user.id).select('role isActive');

    if (!userInDB) return next(new AppError('User not found.', 404));
    if (!userInDB.isActive) return next(new AppError('Account deactivated.', 401));
    if (userInDB.role !== 'user') {
      return next(new AppError('User privileges required.', 403));
    }

    req.user.role = userInDB.role;
    next();
  } catch (error) {
    next(new AppError('Authorization error', 500));
  }
};

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

module.exports = { protect, adminOnly, userOnly };
