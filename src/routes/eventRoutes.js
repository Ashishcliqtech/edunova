const express = require('express');
const router = express.Router();

const {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  getEventById,
  enrollInEvent,
  getPendingEnrollments,
  confirmPayment
} = require('../controllers/eventController');

const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateEvent } = require('../middleware/validationMiddleware'); // Assuming you have a validation middleware for events
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');

// =========================
// PUBLIC & USER ROUTES
// =========================

// GET /api/v1/events - Public 
router.get('/events', getEvents);

// GET /api/v1/events/:id - Public 
router.get('/events/:id', getEventById);

// POST /api/v1/events/:id/enroll - Logged-in users
router.post('/events/:id/enroll', protect, enrollInEvent);

// =========================
// ADMIN ROUTES
// =========================

// POST /api/v1/admin/events - Create event
router.post('/admin/events', protect, adminOnly, uploadToCloudinary('image'),validateEvent, createEvent);

// PUT /api/v1/admin/events/:id - Update event
router.put('/admin/events/:id', protect, adminOnly, uploadToCloudinary('image'), updateEvent);

// DELETE /api/v1/admin/events/:id - Soft delete
router.delete('/admin/events/:id', protect, adminOnly, deleteEvent);

// View pending enrollments
router.get('/admin/enrollments/pending', protect, adminOnly, getPendingEnrollments);

// Confirm payment for an enrollment
router.post('/admin/enrollments/:enrollmentId/confirm', protect, adminOnly, confirmPayment);

module.exports = router;
