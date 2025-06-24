const { body, param, validationResult } = require("express-validator");
const { AppError } = require("../utils/errorUtils");
const { ERROR_MESSAGES } = require("../utils/constant/Messages");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((error) => error.msg)
      .join(", ");
    return next(new AppError(errorMessages, 400));
  }
  next();
};

const validateSignup = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  handleValidationErrors,
];

const validateVerifyOtp = [
  body("email").isEmail().normalizeEmail(),
  body("otp").isString(),
];

const validateSendOtp = [body("email").isEmail().normalizeEmail()];
const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

const validateChangePasswordDto = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Confirm password does not match new password");
      }
      return true;
    }),
  handleValidationErrors,
];

const resetPasswordDto = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Confirm password does not match new password");
      }
      return true;
    }),
  handleValidationErrors,
];

const validateCourse = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  // If 'image' is a URL string in the body, validate it as such.
  // If 'image' is handled via file upload middleware (like multer),
  // then it won't be in body directly and won't need body validation here.
  // Assuming 'image' is an optional URL string in the body for this validation:
  body("image")
    .optional() // Make image optional, or .notEmpty() if it's required
    .isURL()
    .withMessage("Image must be a valid URL"),
  // Removed validations for 'instructor', 'duration', 'price', 'category', 'level'
  // as they are not present in your provided `createCourse` controller's `req.body` destructuring.
  handleValidationErrors,
];

const validateEvent = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters")
    .notEmpty()
    .withMessage("Event title is required"), // Added notEmpty for required field
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters")
    .notEmpty()
    .withMessage("Event description is required"), // Added notEmpty for required field
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number")
    .notEmpty()
    .withMessage("Event price is required"), // Added notEmpty for required field
  body("paymentUrl")
    .trim()
    .notEmpty()
    .withMessage("Payment URL is required") // Required field
    .isURL()
    .withMessage("Payment URL must be a valid URL") // Basic URL validation
    .isLength({ max: 500 })
    .withMessage("Payment URL cannot exceed 500 characters"),
  body("image")
    .optional({ checkFalsy: true }) // Allows field to be missing or empty string/null
    .isURL()
    .withMessage("Image URL must be a valid URL") // Validate if present
    .isLength({ max: 500 })
    .withMessage("Image URL cannot exceed 500 characters"),

  handleValidationErrors,
];

const validateBlog = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Blog title is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters long"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Blog description is required")
    .isLength({ min: 50, max: 5000 })
    .withMessage("Description must be between 50 and 5000 characters long"),

  body("image")
    .trim()
    .notEmpty()
    .withMessage("Blog image is required")
    .isURL()
    .withMessage("Image URL must be a valid URL"),

  handleValidationErrors,
];

const validateUpdateCourse = [
  body("title")
    .optional() // Make title optional for updates
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),
  body("description")
    .optional() // Make description optional for updates
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("image")
    .optional() // Make image optional for updates (and checkFalsy if empty string is allowed)
    .isURL()
    .withMessage("Image must be a valid URL"),
  handleValidationErrors,
];

const validateUpdateEvent = [
  body("title")
    .optional() // Make title optional for updates
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),
  body("description")
    .optional() // Make description optional for updates
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("price")
    .optional() // Make price optional for updates
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("paymentUrl")
    .optional() // Make paymentUrl optional for updates
    .trim()
    .isURL()
    .withMessage("Payment URL must be a valid URL")
    .isLength({ max: 500 })
    .withMessage("Payment URL cannot exceed 500 characters"),
  body("image")
    .optional({ checkFalsy: true }) // Allows field to be missing, null, or empty string for updates
    .isURL()
    .withMessage("Image URL must be a valid URL")
    .isLength({ max: 500 })
    .withMessage("Image URL cannot exceed 500 characters"),
  handleValidationErrors,
];

const validateUpdateBlog = [
  body("title")
    .optional() // Make title optional for updates
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters long"),
  body("description")
    .optional() // Make description optional for updates
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage("Description must be between 50 and 5000 characters long"),
  body("image")
    .optional() // Make image optional for updates
    .trim()
    .isURL()
    .withMessage("Image URL must be a valid URL"),
  handleValidationErrors,
];

const validateCertificate = [
  body("certificatePdf")
    .notEmpty()
    .withMessage("Certificate PDF is required")
    .isURL()
    .withMessage(ERROR_MESSAGES.PDF_UPLOAD_FAILED),

  handleValidationErrors,
];

const validateObjectId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  handleValidationErrors,
];

const validateEnquiryDto = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("phone")
    .trim()
    .matches(/^\+91\s\d{10}$/, "g")
    .withMessage("Phone number must be in the format: +91 6203971817"),
  body("message")
    .trim()
    .isLength({ min: 5, max: 2000 })
    .withMessage("Message must be between 5 and 2000 characters"),
  handleValidationErrors,
];

const validateTestimonialDto = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full Name must be between 2 and 50 characters"),
  body("designation")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Designation must be between 2 and 50 characters"),
  body("message")
    .trim()
    .isLength({ min: 5, max: 2000 })
    .withMessage("Message must be between 5 and 2000 characters"),
  handleValidationErrors,
];

module.exports = {
  validateSignup,
  validateLogin,
  validateCourse,
  validateEvent,
  validateObjectId,
  validateVerifyOtp,
  validateSendOtp,
  validateChangePasswordDto,
  resetPasswordDto,
  validateBlog,
  validateUpdateCourse,
  validateUpdateEvent,
  validateUpdateBlog,
  validateCertificate,
  validateTestimonialDto,
  validateEnquiryDto,
};
