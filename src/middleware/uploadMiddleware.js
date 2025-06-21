const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig'); // CORRECTED: Import cloudinary config here
const config = require('../config/config'); // Import the main config file
const { AppError } = require('../utils/errorUtils'); // Assuming you have an AppError utility

// Configure Multer to use memory storage
// This is crucial for Cloudinary uploads as it allows access to the file buffer.
const storage = multer.memoryStorage();

// Create the Multer instance with memory storage, file filter, and size limits
const multerUpload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Check if the uploaded file is an image
    if (file.mimetype.startsWith('image')) {
      cb(null, true); // Accept the file
    } else {
      // Reject the file and pass an error
      cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // Limit file size to 5MB (adjust as needed)
  }
});

/**
 * Middleware function to handle file upload and push to Cloudinary.
 * It uses Multer to process the file and then uploads the buffer to Cloudinary.
 * The Cloudinary secure_url is then attached to req.body[fieldName] for database storage.
 * @param {string} fieldName - The name of the field in the form that contains the file (e.g., 'image').
 * @returns {function} Express middleware function.
 */
const uploadToCloudinary = (fieldName) => {
  return async (req, res, next) => {
    // Use multerUpload.single() for processing a single file upload
    multerUpload.single(fieldName)(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        // Handle Multer specific errors (e.g., file size limit exceeded)
        return next(new AppError(`File upload error: ${err.message}`, 400));
      } else if (err) {
        // Handle other potential errors during file processing
        return next(err);
      }

      // If no file was provided in the request, proceed to the next middleware.
      // This is important for update operations where the image might not be changed.
      if (!req.file) {
        // If image is required for 'create' operation, your schema validation will catch it.
        return next();
      }

      // NEW: Defensive check for cloudinary initialization.
      // This is crucial if config/cloudinaryConfig.js failed to initialize it.
      if (!cloudinary || typeof cloudinary.uploader === 'undefined') {
        console.error("Cloudinary SDK not properly initialized or imported in uploadMiddleware.js. Check config/cloudinaryConfig.js and your .env variables.");
        return next(new AppError('Image upload service is not available. Please contact support.', 500));
      }

      try {
        // Upload the image buffer to Cloudinary
        // `req.file.buffer` contains the image data, `req.file.mimetype` provides the type.
        const result = await cloudinary.uploader.upload(
          `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
          {
            folder: config.CLOUDINARY_UPLOAD_FOLDER || 'default_uploads', // Use configurable folder
            resource_type: 'auto'    // Automatically detect resource type (image, video, raw)
          }
        );

        // Attach the Cloudinary secure URL to req.body.image
        // This URL will then be saved in your MongoDB database.
        req.body[fieldName] = result.secure_url;
        next(); // Proceed to the next middleware/controller
      } catch (error) {
        console.error('Cloudinary upload failed:', error);
        // Pass the error to the global error handling middleware
        return next(new AppError('Image upload to Cloudinary failed. Please try again.', 500));
      }
    });
  };
};

module.exports = { uploadToCloudinary };
