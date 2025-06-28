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
    const testimonials = await Testimonial.find({ isActive: true }).sort({
      createdAt: -1,
    });

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

const getAllTestimonialsAdmin = catchAsync(async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const filter = {};

    // Filter by isActive if provided, otherwise default to true
    if (typeof req.query.isActive !== "undefined") {
      filter.isActive = req.query.isActive === "true";
    }

    // Search by name, designation, or message
    if (req.query.search) {
      const regex = new RegExp(req.query.search, "i");
      filter.$or = [
        { name: regex },
        { designation: regex },
        { message: regex },
      ];
    }

    const query = Testimonial.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const [testimonials, total] = await Promise.all([
      query,
      Testimonial.countDocuments(filter),
    ]);

    if (!testimonials || testimonials.length === 0) {
      return next(new AppError("No testimonials found", 404));
    }

    successResponse(res, 200, "Testimonials fetched successfully", {
      count: testimonials.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      testimonials,
    });
  } catch (error) {
    logger.error("Error fetching testimonials:", error);
    return next(new AppError("Failed to fetch testimonials", 500));
  }
});

const verifyTestimonialById = catchAsync(async (req, res, next) => {
  try {
    const testimonialId = req.params.id;
    if (!testimonialId) {
      return next(new AppError("Testimonial ID is required", 400));
    }
    const oldTestimonial = await Testimonial.findById(testimonialId);
    if (!oldTestimonial) {
      return next(new AppError("Testimonial not found", 404));
    }

    if (oldTestimonial.isActive === true) {
      return next(new AppError("Testimonial is already verified", 400));
    }
    const testimonial = await Testimonial.findByIdAndUpdate(
      testimonialId,
      { isActive: true },
      { new: true }
    );
    if (!testimonial) {
      return next(new AppError("Testimonial not verified", 404));
    }

    successResponse(res, 200, "Testimonial verified successfully");
  } catch (error) {
    logger.error("Error verifying testimonial:", error);
    return next(new AppError("Failed to verify testimonial", 500));
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
      { name, designation, message, isActive: true },
      { new: true }
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
module.exports = {
  createTestimonial,
  getAllTestimonials,
  verifyTestimonialById,
  updateTestimonialById,
  getAllTestimonialsAdmin,
  deleteTestimonialById,
};
