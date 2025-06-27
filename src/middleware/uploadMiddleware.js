const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig'); // Ensure this initializes cloudinary correctly
const { AppError } = require('../utils/errorUtils');
const { ERROR_MESSAGES } = require('../utils/constant/Messages');

// --- Multer Storage Configuration ---
const storage = multer.memoryStorage(); // Crucial for Cloudinary uploads (access to buffer)

// --- Multer File Filters ---
const imageFileFilter = (req, file, cb) => {
  try {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new AppError(ERROR_MESSAGES.INVALID_IMAGE_FILE, 400), false);
    }
  } catch (err) {
    cb(err, false);
  }
};

const pdfFileFilter = (req, file, cb) => {
  try {
    if (file.mimetype === 'certificatePdf') {
      cb(null, true);
    } else {
      cb(new AppError(ERROR_MESSAGES.INVALID_PDF_FILE, 400), false);
    }
  } catch (err) {
    cb(err, false);
  }
};

// --- Multer Instances ---
const imageMulterUpload = multer({
  storage: storage, 
  fileFilter: imageFileFilter, 
  limits: {
    fileSize: 10* 1024 * 1024 // 2 MB (in bytes) - Aim for smaller originals
  }
});

const pdfMulterUpload = multer({
  storage: storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for PDFs (adjust as needed)
  }
});

/**
 * Generic Cloudinary upload handler.
 * This abstracts the common logic for uploading to Cloudinary.
 * @param {Object} req - The Express request object.
 * @param {Function} next - The Express next middleware function.
 * @param {string} fieldName - The name of the field in the form that contains the file.
 * @param {string} errorMessage - Specific error message for Cloudinary failure.
 * @param {string} targetFolder - The specific folder name in Cloudinary (e.g., 'blogs', 'certificates').
 */
const handleCloudinaryUpload = async (req, next, fieldName, errorMessage, targetFolder) => {
  try {
    if (!req.file) {
      return next(); // No file uploaded, proceed. Your schema validation should handle required fields.
    }

    // Defensive check for cloudinary initialization
    if (!cloudinary || !cloudinary.uploader) {
      console.error("Cloudinary SDK not properly initialized or imported. Check config/cloudinaryConfig.js and your .env variables.");
      return next(new AppError(errorMessage, 500));
    }

    try {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        {
          folder: targetFolder, // THIS IS THE KEY CHANGE! Use the dynamic targetFolder
          resource_type: 'auto'
        }
      );
      req.body[fieldName] = result.secure_url;
      next();
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      return next(new AppError(errorMessage, 500));
    }
  } catch (err) {
    return next(new AppError(errorMessage, 500));
  }
};

/**
 * Middleware function to handle image upload and push to Cloudinary.
 * @param {string} fieldName - The name of the field in the form (e.g., 'image').
 * @param {string} folderName - The specific folder in Cloudinary for this upload (e.g., 'blogs', 'events').
 * @returns {function} Express middleware function.
 */
const uploadImageToCloudinary = (fieldName, folderName) => {
  return (req, res, next) => {
    try {
      imageMulterUpload.single(fieldName)(req, res, async (err) => {
        try {
          if (err instanceof multer.MulterError) {
            return next(new AppError(`${ERROR_MESSAGES.FILE_SIZE_EXCEEDED}: ${err.message}`, 400));
          } else if (err) {
            return next(err);
          }
          // Pass the folderName to the handler
          await handleCloudinaryUpload(req, next, fieldName, ERROR_MESSAGES.IMAGE_UPLOAD_FAILED, folderName);
        } catch (error) {
          return next(error);
        }
      });
    } catch (err) {
      return next(err);
    }
  };
};

/**
 * Middleware function to handle PDF upload and push to Cloudinary.
 * @param {string} fieldName - The name of the field in the form (e.g., 'pdfDocument').
 * @param {string} folderName - The specific folder in Cloudinary for this upload (e.g., 'certificates').
 * @returns {function} Express middleware function.
 */
const uploadPdfToCloudinary = (fieldName, folderName) => {
  return (req, res, next) => {
    try {
      pdfMulterUpload.single(fieldName)(req, res, async (err) => {
        try {
          if (err instanceof multer.MulterError) {
            return next(new AppError(`${ERROR_MESSAGES.FILE_SIZE_EXCEEDED}: ${err.message}`, 400));
          } else if (err) {
            return next(err);
          }
          // Pass the folderName to the handler
          await handleCloudinaryUpload(req, next, fieldName, ERROR_MESSAGES.PDF_UPLOAD_FAILED, folderName);
        } catch (error) {
          return next(error);
        }
      });
    } catch (err) {
      return next(err);
    }
  };
};

module.exports = {
  uploadImageToCloudinary,
  uploadPdfToCloudinary
};