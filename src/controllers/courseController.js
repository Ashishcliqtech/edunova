const Course = require('../models/Course');
const { catchAsync, AppError } = require('../utils/errorUtils');

// ============================
// ADMIN: COURSE MANAGEMENT
// ============================

// POST /api/admin/courses
const createCourse = catchAsync(async (req, res, next) => {
  const { title, description, image } = req.body;

  const course = await Course.create({ title, description, image });

  res.status(201).json({
    success: true,
    data: { course }
  });
});

// PUT /api/admin/courses/:id
const updateCourse = catchAsync(async (req, res, next) => {
  let course = await Course.findById(req.params.id);
  if (!course) return next(new AppError('Course not found', 404));

  const { title, description, image } = req.body;
  const updateData = { title, description };
  if (image) updateData.image = image;

  course = await Course.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: { course }
  });
});

// DELETE /api/admin/courses/:id (Soft Delete)
const deleteCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new AppError('Course not found', 404));

  course.isActive = false;
  await course.save();

  res.status(200).json({
    success: true,
    message: 'Course deleted successfully'
  });
});


// GET /api/admin/courses Reusable for both Admin & User
const getCourses = catchAsync(async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const filter = {};

  const isAdmin = req.user && req.user.role === 'admin';

  // For users: only show active courses
  if (!isAdmin) {
    filter.isActive = true;
  } else if (req.query.status) {
    filter.isActive = req.query.status === 'active';
  }

  // Search filter
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const query = Course.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  // Admin gets creator info
  if (isAdmin) {
    query.populate('createdBy', 'name email');
  }

  const [courses, total] = await Promise.all([
    query,
    Course.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
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
    return next(new AppError('Course not found', 404));
  }

  res.status(200).json({
    success: true,
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
  getCourses,
  getCourseById
};
