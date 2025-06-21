// config/cloudinaryConfig.js
const cloudinary = require('cloudinary').v2; // Directly assign cloudinary.v2

const config = require('./config');

// Retrieve Cloudinary credentials from config
const cloud_name = config.CLOUDINARY_CLOUD_NAME;
const api_key = config.CLOUDINARY_API_KEY;
const api_secret = config.CLOUDINARY_API_SECRET;

// Log a critical error if any essential credentials are missing
if (!cloud_name || !api_key || !api_secret) {
  console.error('CRITICAL ERROR: Cloudinary environment variables (CLOUD_NAME, API_KEY, API_SECRET) are not fully defined in your .env file or config.js. Cloudinary functionality will be impaired.');
  // In a production app, you might consider throwing an error here or exiting.
  // For now, we proceed but expect issues without proper credentials.
}

try {
  // Perform Cloudinary configuration
  cloudinary.config({
    cloud_name: cloud_name,
    api_key: api_key,
    api_secret: api_secret
  });
} catch (error) {
  // This catch block handles errors during the cloudinary.config() call itself.
  console.error('Error configuring Cloudinary SDK:', error);
  // If configuration fails, ensure 'cloudinary' is an object but mark it as invalid/unusable
  // by potentially unsetting its methods or setting a flag.
  // For robustness, if config fails, the API key might be bad, and further calls will likely fail.
}

// Export the configured Cloudinary instance directly.
// This ensures that 'cloudinary' in uploadMiddleware.js refers to the properly configured object.
module.exports = cloudinary;
