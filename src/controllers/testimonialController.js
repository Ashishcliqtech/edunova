const Testimonial = require("../models/Testimonial");
const { catchAsync, AppError } = require("../utils/errorUtils");
const logger = require("../utils/logger");
const successResponse = require("../utils/successResponse");

const createTestimonial = catchAsync(async (req, res, next) => {
  try {
    const { name, designation, message } = req.body;

    if (!name || !designation || !message) {
      return next(new AppError("All fields are required!", 400));
    }

    const testimonialData = {
      name,
      designation,
      message,
    };

    const testimonial = await Testimonial.create(testimonialData);

    successResponse(res, 201, "Testimonial created successfully", {
      testimonial,
    });
  } catch (error) {
    logger.error("Error creating testimonial:", error);
    return next(new AppError("Failed to create testimonial", 500));
  }
});

const getAllTestimonials = catchAsync(async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });

    if (!testimonials || testimonials.length === 0) {
      return next(new AppError("No testimonials found", 404));
    }

    successResponse(res, 200, "Testimonials fetched successfully", {
      testimonials,
    });
  } catch (error) {
    logger.error("Error fetching testimonials:", error);
    return next(new AppError("Failed to fetch testimonials", 500));
  }
});

const deleteTestimonialById = catchAsync(async (req, res, next) => {
  try {
    const testimonialId = req.params.id;
    if (!testimonialId) {
      return next(new AppError("Testimonial ID is required", 400));
    }
    const testimonial = await Testimonial.findById(testimonialId);
    if (!testimonial) {
      return next(new AppError("Testimonial not found", 404));
    }

    await testimonial.deleteOne();

    successResponse(res, 200, "Testimonial deleted successfully");
  } catch (error) {
    logger.error("Error deleting testimonial:", error);
    return next(new AppError("Failed to delete testimonial", 500));
  }
});

const updateTestimonialById = catchAsync(async (req, res, next) => {
  try {
    const testimonialId = req.params.id;
    const { name, designation, message } = req.body;

    if (!testimonialId) {
      return next(new AppError("Testimonial ID is required", 400));
    }

    if (!name || !designation || !message) {
      return next(new AppError("All fields are required!", 400));
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      testimonialId,
      { name, designation, message },
      { isActive: true, new: true }
    );

    if (!testimonial) {
      return next(new AppError("Testimonial not found", 404));
    }

    successResponse(res, 200, "Testimonial updated successfully", {
      testimonial,
    });
  } catch (error) {
    logger.error("Error updating testimonial:", error);
    return next(new AppError("Failed to update testimonial", 500));
  }
});

module.exports = {
  createTestimonial,
  getAllTestimonials,
  deleteTestimonialById,
  updateTestimonialById,
};
