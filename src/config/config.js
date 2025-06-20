require("dotenv").config();

// Helper function to parse time strings (e.g., "15m", "7d") into milliseconds
const parseTimeToMs = (timeString, defaultValueMs) => {
  if (!timeString) return defaultValueMs;

  const value = parseInt(timeString);
  const unit = timeString.slice(-1).toLowerCase();

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return defaultValueMs; // Fallback to default if unit is unrecognized or value is not a number
  }
};

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/enterprise-db",
  REFRESH_TOKEN_LENGTH: process.env.REFRESH_TOKEN_LENGTH || 64,
  REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE,
  // 7 days in milliseconds
  REFRESH_TOKEN_EXPIRE_MS: parseTimeToMs(
    process.env.REFRESH_TOKEN_EXPIRE,
    7 * 24 * 60 * 60 * 1000
  ),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRE || "15m",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@company.com",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "Admin@123456",
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
};
