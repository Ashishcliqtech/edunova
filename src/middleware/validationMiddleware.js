const { body, param, validationResult } = require("express-validator");
const { AppError } = require("../utils/errorUtils");

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

const validateSendOtp = [
  body('email').isEmail().normalizeEmail()
];
const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
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
  body("instructor")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Instructor name must be between 2 and 50 characters"),
  body("duration")
    .isInt({ min: 1, max: 1000 })
    .withMessage("Duration must be between 1 and 1000 hours"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category")
    .isIn([
      "Programming",
      "Design",
      "Business",
      "Marketing",
      "Photography",
      "Music",
      "Other",
    ])
    .withMessage("Invalid category"),
  body("level")
    .isIn(["Beginner", "Intermediate", "Advanced"])
    .withMessage("Invalid level"),
  handleValidationErrors,
];

const validateEvent = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("date")
    .isISO8601()
    .withMessage("Please provide a valid date")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Event date must be in the future");
      }
      return true;
    }),
  body("location")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Location must be between 3 and 200 characters"),
  body("capacity")
    .isInt({ min: 1, max: 10000 })
    .withMessage("Capacity must be between 1 and 10000"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category")
    .isIn([
      "Conference",
      "Workshop",
      "Seminar",
      "Webinar",
      "Networking",
      "Other",
    ])
    .withMessage("Invalid category"),
  handleValidationErrors,
];

const validateObjectId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
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
};
