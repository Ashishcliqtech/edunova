const express = require("express");
const router = express.Router();

const {
  createTestimonial,
  getAllTestimonials,
  verifyTestimonialById,
  updateTestimonialById,
  getAllTestimonialsAdmin,
  deleteTestimonialById,
} = require("../controllers/testimonialController");
const {
  validateTestimonialDto,
} = require("../middleware/validationMiddleware");

const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/create-testimonial", validateTestimonialDto, createTestimonial);
router.get("/user/get-testimonials", getAllTestimonials);
router.patch(
  "/admin/verify-testimonial/:id",
  protect,
  adminOnly,
  verifyTestimonialById
);

router.get(
  "/admin/get-testimonials",
  protect,
  adminOnly,
  getAllTestimonialsAdmin
);

router.patch(
  "/admin/update-testimonial/:id",
  protect,
  adminOnly,
  validateTestimonialDto,
  updateTestimonialById
);
router.delete(
  "/admin/delete-testimonial/:id",
  protect,
  adminOnly,
  deleteTestimonialById
);
module.exports = router;
