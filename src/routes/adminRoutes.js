const express = require('express');
const {
  getDashboardStats,
  createCourse,
  updateCourse,
  deleteCourse,
  getAllCourses,
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvents
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  validateCourse,
  validateEvent,
  validateObjectId
} = require('../middleware/validationMiddleware');

const router = express.Router();

// Protect all routes and require admin privileges
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Course routes
router.route('/courses')
  .get(getAllCourses)
  .post(validateCourse, createCourse);

router.route('/courses/:id')
  .put(validateObjectId, validateCourse, updateCourse)
  .delete(validateObjectId, deleteCourse);

// Event routes
router.route('/events')
  .get(getAllEvents)
  .post(validateEvent, createEvent);

router.route('/events/:id')
  .put(validateObjectId, validateEvent, updateEvent)
  .delete(validateObjectId, deleteEvent);

module.exports = router;