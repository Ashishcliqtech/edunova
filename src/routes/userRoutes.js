const express = require('express');
const {
  getCourses,
  getCourse,
  getEvents,
  getEvent
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Course routes
router.get('/courses', getCourses);
router.get('/courses/:id', validateObjectId, getCourse);

// Event routes
router.get('/events', getEvents);
router.get('/events/:id', validateObjectId, getEvent);

module.exports = router;