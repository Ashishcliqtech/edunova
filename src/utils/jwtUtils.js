const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../config/config");

const generateAccessToken = (id, role) => {
  return jwt.sign({ id, role }, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRE,
  });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(config.REFRESH_TOKEN_LENGTH / 2).toString("hex");
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.JWT_ACCESS_SECRET);
};

const sendTokenResponse = (user, refreshToken, statusCode, res) => {
  res.setHeader("x-refresh-token", refreshToken);

  res.status(statusCode).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  sendTokenResponse,
};
