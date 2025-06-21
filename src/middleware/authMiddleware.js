// middleware/authMiddleware.js (UPDATED)
const { verifyAccessToken } = require('../utils/jwtUtils'); // This now expects a more flexible verifyAccessToken
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
  '/api/v1/auth/register', // Assuming /api/v1/auth/signup is meant here from your API summary
  '/api/v1/auth/refresh-token',
  // Add other public routes as needed, e.g., for OTP sending/verification
  '/api/v1/auth/send-otp',
  '/api/v1/auth/verify-otp',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/verify-forgot-otp',
  // Health and root routes
  '/health',
  '/'
];

const protect = async (req, res, next) => {
  try {
    const currentPath = req.path;
    const currentMethod = req.method;

    // Check if the current route is a public GET route (flexible check)
    const isPublicGetRoute = publicRoutes.some(routePath => {
        // Handle dynamic routes like /api/v1/courses/:id
        const pattern = new RegExp(`^${routePath.replace(/:\w+/g, '[^/]+')}$`);
        return pattern.test(currentPath) && currentMethod === 'GET';
    });

    if (isPublicGetRoute) {
      req.user = null; // Ensure req.user is null for public access
      req.isAuthenticated = false;
      return next(); // Allow access to public GET routes without token
    }

    // Attempt to verify the token from the request (will check cookies then headers)
    const decoded = verifyAccessToken(req); // Pass the entire request object here
    
    // Check if token is blacklisted (if a blacklist mechanism is implemented)
    // Note: Blacklisting access tokens in Redis is more common for short-lived tokens,
    // and relies on efficient Redis lookups.
    const isBlacklisted = await redisClient.get(`blacklist:${decoded.jti || decoded.id}`); // Use JTI or a unique ID from token
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

const adminOnly = async (req, res, next) => {
  if (!req.isAuthenticated || !req.user?.id) { // req.user.id is now safe because req.user is the Mongoose document
    return next(new AppError('Authentication required to check admin privileges.', 401));
  }

  // If req.user is already a Mongoose document, directly check its role
  if (req.user.role !== 'admin') {
    // If you need to re-fetch the user to ensure latest role from DB
    // (e.g., if roles can change frequently after token issuance)
    // const userInDB = await User.findById(req.user.id).select('role');
    // if (!userInDB || userInDB.role !== 'admin') {
    //   return next(new AppError('Admin privileges required.', 403));
    // }
    return next(new AppError('Admin privileges required.', 403));
  }

  next();
};

module.exports = { protect, adminOnly };