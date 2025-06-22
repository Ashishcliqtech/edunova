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

const { protect, adminOnly } = require('../middleware/authMiddleware'); // path to protect.js
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');
const { validateCourse } = require('../middleware/validationMiddleware'); 

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
  validateCourse, 
  uploadToCloudinary('image'),
  createCourse
);

// patch /api/v1/admin/courses/:id - Admin Only
router.patch(
  '/admin/courses/:id',
  protect,
  adminOnly,
  uploadToCloudinary('image'), // optional image update
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
