const express = require('express');
const router = express.Router();

const {
  createCourse,
  updateCourse,
  deleteCourse,
  getUserCourses,
  getAdminCourses,
  getCourseById,
} = require('../controllers/courseController');

<<<<<<< HEAD
const { protect, adminOnly } = require('../middleware/authMiddleware'); 
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');
const { validateCourse } = require('../middleware/validationMiddleware'); 
=======
const { protect, adminOnly } = require('../middleware/authMiddleware'); // path to protect.js
const { uploadImageToCloudinary } = require('../middleware/uploadMiddleware');
const { validateCourse,validateUpdateCourse } = require('../middleware/validationMiddleware'); 
>>>>>>> main

// =======================
// PUBLIC ROUTES
// =======================

// GET /api/v1/courses 
router.get('/courses', getUserCourses);

// GET /api/v1/courses/:id 
router.get('/courses/:id', getCourseById);

// =======================
// ADMIN ROUTES
// =======================


router.get(
  '/admin/courses-all',
  protect,
  adminOnly, 
  getAdminCourses);

// POST /api/v1/admin/courses - Admin Only
router.post(
  '/admin/courses',
  protect,
  adminOnly,
  uploadImageToCloudinary('image', 'courses'), // <-- THIS MUST COME FIRST TO PARSE form-data
  validateCourse, // <-- NOW validateCourse can access correctly parsed req.body
  createCourse
);

// patch /api/v1/admin/courses/:id - Admin Only
router.patch(
  '/admin/courses/:id',
  protect,
  adminOnly,
  // For PATCH, if image update is optional, Multer's `handleCloudinaryUpload` correctly handles `!req.file`.
  uploadImageToCloudinary('image', 'courses'), // <-- RUN MULTER/CLOUDINARY FIRST
  validateUpdateCourse, // <-- THEN RUN VALIDATION
  updateCourse
);


// DELETE /api/v1/admin/courses/:id - Admin Only
router.delete(
  '/admin/courses/:id',
  protect,
  adminOnly,
  deleteCourse
);

module.exports = router;
