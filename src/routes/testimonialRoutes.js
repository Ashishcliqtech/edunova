const express = require("express");
const router = express.Router();

const {
  createTestimonial,
  getAllTestimonials,
  deleteTestimonialById,
} = require("../controllers/testimonialController");
const {
  validateTestimonialDto,
} = require("../middleware/validationMiddleware");

const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/create-testimonial", validateTestimonialDto, createTestimonial);
router.get("/get-testimonials", getAllTestimonials);
router.post(
  "/admin/delete-testimonial/:id",
  protect,
  adminOnly,
  deleteTestimonialById
);
module.exports = router;
