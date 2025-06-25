const express = require("express");
const router = express.Router();

const {
  createEvent,
  updateEvent,
  deleteEvent,
  getUserEvents,
  getAdminEvents,
  getEventById,
  enrollInEvent,
  getEventByIdAdmin,
} = require("../controllers/eventController");

const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  validateEvent,
  validateUpdateEvent,
} = require("../middleware/validationMiddleware"); // Assuming you have a validation middleware for events
const { uploadImageToCloudinary } = require("../middleware/uploadMiddleware");

// =========================
// PUBLIC & USER ROUTES
// =========================

// GET /api/v1/events - Public
router.get("/events", getUserEvents);

// GET /api/v1/events/:id - Public
router.get("/events/:id", getEventById);

// POST /api/v1/events/:id/enroll - Logged-in users
router.post("/events/enroll/:id", protect, enrollInEvent);

// =========================
// ADMIN ROUTES
// =========================

router.get("/admin/events", protect, adminOnly, getAdminEvents);
router.get("/admin/events/:id", protect, adminOnly, getEventByIdAdmin);
// POST /api/v1/admin/events - Create event
router.post(
  "/admin/create-events",
  protect,
  adminOnly,
  uploadImageToCloudinary("image", "events"),
  validateEvent,
  createEvent
);

// Patch /api/v1/admin/events/:id - Update event
router.patch(
  "/admin/update-events/:id",
  protect,
  adminOnly,
  uploadImageToCloudinary("image", "events"),
  validateUpdateEvent,
  updateEvent
);

// DELETE /api/v1/admin/events/:id - Soft delete
router.patch("/admin/delete-events/:id", protect, adminOnly, deleteEvent);

module.exports = router;
