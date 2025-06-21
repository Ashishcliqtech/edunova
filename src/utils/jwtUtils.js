const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/config');

// Helper to extract access token from cookies or Authorization header
const extractAccessToken = (req) => {
  // Option 1: Check for token in 'accessToken' cookie
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }
  // Option 2: Check for token in Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null; // No token found
};

const generateAccessToken = (id, role) => {
  return jwt.sign({ id, role }, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRE,
  });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(config.REFRESH_TOKEN_LENGTH / 2).toString('hex');
};

// Modified verifyAccessToken to optionally take a request object
const verifyAccessToken = (tokenOrReq) => {
  let token;

  if (typeof tokenOrReq === 'object' && tokenOrReq !== null && tokenOrReq.cookies) {
    // If a request object is passed, try to extract token from cookies/headers
    token = extractAccessToken(tokenOrReq);
    if (!token) {
      throw new Error('No access token found in request cookies or headers.');
    }
  } else if (typeof tokenOrReq === 'string') {
    // If a string (the token itself) is passed
    token = tokenOrReq;
  } else {
    throw new Error('Invalid argument provided to verifyAccessToken. Expected token string or request object.');
  }

  return jwt.verify(token, config.JWT_ACCESS_SECRET);
};

const sendTokenResponse = (user, accessToken, refreshToken, statusCode, res) => {
  const refreshTokenExpireDate = new Date(Date.now() + config.REFRESH_TOKEN_EXPIRE_MS);

  // Parse JWT_ACCESS_EXPIRE to milliseconds for cookie expiration
  let accessTokenExpireMs;
  if (typeof config.JWT_ACCESS_EXPIRE === 'string') {
    const num = parseInt(config.JWT_ACCESS_EXPIRE);
    if (config.JWT_ACCESS_EXPIRE.includes('m')) accessTokenExpireMs = num * 60 * 1000;
    else if (config.JWT_ACCESS_EXPIRE.includes('h')) accessTokenExpireMs = num * 60 * 60 * 1000;
    else if (config.JWT_ACCESS_EXPIRE.includes('d')) accessTokenExpireMs = num * 24 * 60 * 60 * 1000;
    else accessTokenExpireMs = num; // Assume already milliseconds if no unit
  } else {
    accessTokenExpireMs = config.JWT_ACCESS_EXPIRE; // Assume it's already in ms
  }
  const accessTokenExpireDate = new Date(Date.now() + accessTokenExpireMs);

  res.cookie('refreshToken', refreshToken, {
    expires: refreshTokenExpireDate,
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  // Set the access token in a cookie
  // Set httpOnly: true for maximum security (token only accessible server-side)
  // Set httpOnly: false if client-side JS needs to read it (less secure, but sometimes necessary)
  res.cookie('accessToken', accessToken, {
    expires: accessTokenExpireDate,
    httpOnly: false, // Change to true if you always want clients to use Authorization header
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(statusCode).json({
    success: true,
    accessToken,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  sendTokenResponse,
  extractAccessToken // Export if you need it directly elsewhere
};