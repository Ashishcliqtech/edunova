const Course = require('../models/Course');
const { catchAsync, AppError } = require('../utils/errorUtils');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constant/Messages');

// ============================
// ADMIN: COURSE MANAGEMENT
// ============================

// POST /api/admin/courses
const createCourse = catchAsync(async (req, res, next) => {
  const { title, description, image } = req.body;

  const course = await Course.create({ title, description, image });

  res.status(201).json({
    success: true,
    message: SUCCESS_MESSAGES.COURSE_CREATED,
    data: { course }
  });
});

// PUT /api/admin/courses/:id
const updateCourse = catchAsync(async (req, res, next) => {
  let course = await Course.findById(req.params.id);
  if (!course) return next(new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, 404));

  const { title, description, image } = req.body;
  const updateData = { title, description };
  if (image) updateData.image = image;

  course = await Course.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.COURSE_UPDATED,
    data: { course }
  });
});

// DELETE /api/admin/courses/:id (Soft Delete)
const deleteCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, 404));

  course.isActive = false;
  await course.save();

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.COURSE_DELETED
  });
});


const getUserCourses = catchAsync(async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const filter = { isActive: true }; // Always show only active courses for users/public

  // Search filter - uses 'title' and 'description' from your Course schema
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const query = Course.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const [courses, total] = await Promise.all([
    query,
    Course.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.COURSE_FETCHED,
    count: courses.length,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    data: { courses }
  });
});



// GET /api/v1/admin/courses-all (Admin only - view all courses, active or inactive)
const getAdminCourses = catchAsync(async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const filter = {}; // Admins see all courses, no default isActive filter

  // Search filter - uses 'title' and 'description' from your Course schema
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const query = Course.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email'); // Admins get creator info

  const [courses, total] = await Promise.all([
    query,
    Course.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.COURSE_FETCHED,
    count: courses.length,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    data: { courses }
  });
});



// GET /api/courses/:id
const getCourseById = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course || !course.isActive) {
    return next(new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, 404));
  }

  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.COURSE_FETCHED,
    data: { course }
  });
});

// ============================
// EXPORTS
// ============================

module.exports = {
  createCourse,
  updateCourse,
  deleteCourse,
  getUserCourses,
  getAdminCourses,
  getCourseById
};
