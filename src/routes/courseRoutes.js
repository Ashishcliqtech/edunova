const express = require("express");
const router = express.Router();

const {
  createCourse,
  updateCourse,
  deleteCourse,
  getUserCourses,
  getAdminCourses,
  getCourseById,
  getCourseByIdAdmin,
} = require("../controllers/courseController");

const { protect, adminOnly } = require("../middleware/authMiddleware"); // path to protect.js
const { uploadImageToCloudinary } = require("../middleware/uploadMiddleware");
const {
  validateCourse,
  validateUpdateCourse,
} = require("../middleware/validationMiddleware");

// =======================
// PUBLIC ROUTES
// =======================

// GET /api/v1/courses
router.get("/courses", getUserCourses);

// GET /api/v1/courses/:id
router.get("/courses/:id", getCourseById);

// =======================
// ADMIN ROUTES
// =======================

router.get("/admin/courses", protect, adminOnly, getAdminCourses);
router.get("/admin/courses/:id", protect, adminOnly, getCourseByIdAdmin);
// POST /api/v1/admin/courses - Admin Only
router.post(
  "/admin/create-courses",
  protect,
  adminOnly,
  uploadImageToCloudinary("image", "courses"), // <-- THIS MUST COME FIRST TO PARSE form-data
  validateCourse, // <-- NOW validateCourse can access correctly parsed req.body
  createCourse
);

// patch /api/v1/admin/courses/:id - Admin Only
router.patch(
  "/admin/courses/:id",
  protect,
  adminOnly,
  // For PATCH, if image update is optional, Multer's `handleCloudinaryUpload` correctly handles `!req.file`.
  uploadImageToCloudinary("image", "courses"), // <-- RUN MULTER/CLOUDINARY FIRST
  validateUpdateCourse, // <-- THEN RUN VALIDATION
  updateCourse
);

// DELETE /api/v1/admin/courses/:id - Admin Only
router.patch("/admin/delete-courses/:id", protect, adminOnly, deleteCourse);

module.exports = router;
