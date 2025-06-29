const Course = require("../models/Course");
const { AppError, catchAsync } = require("../utils/errorUtils");
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} = require("../utils/constant/Messages");
const successResponse = require("../utils/successResponse");
const logger = require("../utils/logger");
const emptyListResponse = require("../utils/emptyListResponse");

// ============================
// ADMIN: COURSE MANAGEMENT
// ============================

// POST /api/admin/courses
const createCourse = async (req, res, next) => {
  try {
    const { title, description, image } = req.body;

    const course = await Course.create({ title, description, image });

    res.status(201).json({
      success: true,
      message: SUCCESS_MESSAGES.COURSE_CREATED,
      data: { course },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/courses/:id
const updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);
    if (!course)
      return next(new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, 404));

    const { title, description, image } = req.body;
    const updateData = { title, description };
    if (image) updateData.image = image;

    course = await Course.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.COURSE_UPDATED,
      data: { course },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/courses/:id (Soft Delete)
const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course)
      return next(new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, 404));

    course.isActive = false;
    await course.save();

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.COURSE_DELETED,
    });
  } catch (err) {
    next(err);
  }
};

const getUserCourses = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const filter = { isActive: true }; // Always show only active courses for users/public

    // Search filter - uses 'title' and 'description' from your Course schema
    if (req.query.search) {
      const regex = new RegExp(req.query.search, "i");
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const query = Course.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const [courses, total] = await Promise.all([
      query,
      Course.countDocuments(filter),
    ]);

    if (!courses || courses.length === 0) {
      return emptyListResponse(
        res,
        ERROR_MESSAGES.COURSE_NOT_FOUND || "No courses found.",
        "courses",
        {
          pagination: {
            totalCourses: 0,
            totalPages: 1,
            currentPage: page,
            pageSize: limit,
          },
        }
      );
    }
    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.COURSE_FETCHED,
      count: courses.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: { courses },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/admin/courses-all (Admin only - view all courses, active or inactive)
const getAdminCourses = async (req, res, next) => {
  try {
    // --- Pagination ---
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    // Start with an empty filter object. Admins can see everything by default.
    const filter = {};
    // This allows the frontend to send `?isActive=true` or `?isActive=false`.
    if (req.query.isActive !== undefined && req.query.isActive !== null) {
      // The query parameter will be a string 'true' or 'false'.
      // We convert it to a boolean and add it to our filter.
      filter.isActive = req.query.isActive === "true";
    }
    // If 'isActive' is not in the query, the filter won't include this field,
    // so courses will be fetched regardless of their active status.

    // --- Search Filter ---
    // This part remains the same. It adds to the filter if a search term is provided.
    if (req.query.search) {
      const regex = new RegExp(req.query.search, "i");
      // Use $and to ensure both status and search filters apply if both are present
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: [{ title: regex }, { description: regex }] },
        ];
        delete filter.$or;
      } else {
        filter.$or = [{ title: regex }, { description: regex }];
      }
    }

    // --- Database Query ---
    // The `filter` object now contains all the necessary conditions.
    const query = Course.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

    // --- Execution and Response ---
    // Execute the query to get courses and a total count simultaneously.
    const [courses, total] = await Promise.all([
      query,
      Course.countDocuments(filter),
    ]);

    if (!courses || courses.length === 0) {
      return emptyListResponse(res, "No courses found", "courses", {
        pagination: {
          totalCourses: 0,
          totalPages: 1,
          currentPage: page,
          pageSize: limit,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Successfully fetched courses for admin.", // Using a clearer message
      count: courses.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: { courses },
    });
  } catch (err) {
    // Pass any errors to the error-handling middleware.
    next(err);
  }
};

// GET /api/courses/:id
const getCourseById = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    if (!courseId) {
      return next(new AppError(ERROR_MESSAGES.COURSE_ID_REQUIRED, 400));
    }
    const course = await Course.findById(req.params.id);
    if (!course || !course.isActive) {
      return next(new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, 404));
    }

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.COURSE_FETCHED,
      data: { course },
    });
  } catch (err) {
    next(err);
  }
};

const getCourseByIdAdmin = catchAsync(async (req, res, next) => {
  try {
    const courseId = req.params.id;
    if (!courseId) {
      return next(new AppError(ERROR_MESSAGES.COURSE_ID_REQUIRED, 400));
    }
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, 404));
    }

    successResponse(res, 200, SUCCESS_MESSAGES.COURSE_FETCHED, {
      course,
    });
  } catch (err) {
    logger.error("Error fetching course by ID:", err);
    return next(new AppError("Internal server Error ", 500));
  }
});

module.exports = {
  createCourse,
  updateCourse,
  deleteCourse,
  getUserCourses,
  getAdminCourses,
  getCourseById,
  getCourseByIdAdmin,
};
