const { verifyAccessToken } = require('../utils/jwtUtils');
const User = require('../models/User');
const config = require('../config/config');
const { AppError } = require('../utils/errorUtils');
const redisClient = require('../utils/redisClient/redisclient');

const publicRoutes = [
  '/api/v1/courses',
  '/api/v1/courses/:id',
  '/api/v1/events',
  '/api/v1/events/:id',
  '/api/v1/blog/posts',
  '/api/v1/blog/posts/:id',
  '/api/v1/testimonials',
  '/api/v1/certificates/verify/:code',
  '/api/v1/about',
  '/api/v1/footer',
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh-token',
];

const protect = async (req, res, next) => {
  try {
    const currentPath = req.path;
    const currentMethod = req.method;

    const isPublicGetRoute = publicRoutes.some(routePath => {
      if (routePath.includes(':')) {
        const baseRoute = routePath.split('/:')[0];
        return currentPath.startsWith(baseRoute) && currentMethod === 'GET';
      }
      return currentPath === routePath && currentMethod === 'GET';
    });

    if (isPublicGetRoute) {
      req.user = null;
      req.isAuthenticated = false;
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Access denied. No token provided.', 401));
    }

    const accessToken = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(accessToken);
    const isBlacklisted = await redisClient.get(`blacklist:${accessToken}`);
    if (isBlacklisted) {
      return next(new AppError('Access token is blacklisted. Please log in again.', 401));
    }

    req.user = decoded;
    req.isAuthenticated = true;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    next(new AppError('Authentication failed', 401));
  }
};

const adminOnly = async (req, res, next) => {
  if (!req.isAuthenticated || !req.user?.id) {
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
