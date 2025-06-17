const Course = require('../models/Course');
const Event = require('../models/Event');
const User = require('../models/User');
const { catchAsync, AppError } = require('../utils/errorUtils');

// Dashboard stats
const getDashboardStats = catchAsync(async (req, res, next) => {
  const totalCourses = await Course.countDocuments({ isActive: true });
  const totalEvents = await Event.countDocuments({ isActive: true });
  const totalUsers = await User.countDocuments({ role: 'user', isActive: true });
  const upcomingEvents = await Event.countDocuments({ 
    isActive: true, 
    date: { $gte: new Date() } 
  });

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalCourses,
        totalEvents,
        totalUsers,
        upcomingEvents
      }
    }
  });
});

// Course management
const createCourse = catchAsync(async (req, res, next) => {
  const courseData = {
    ...req.body,
    createdBy: req.user._id
  };

  const course = await Course.create(courseData);

  res.status(201).json({
    success: true,
    data: { course }
  });
});

const updateCourse = catchAsync(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: { course }
  });
});

const deleteCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  // Soft delete
  course.isActive = false;
  await course.save();

  res.status(200).json({
    success: true,
    message: 'Course deleted successfully'
  });
});

const getAllCourses = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  
  if (req.query.status) {
    filter.isActive = req.query.status === 'active';
  }

  const courses = await Course.find(filter)
    .populate('createdBy', 'name email')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Course.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: courses.length,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    data: { courses }
  });
});

// Event management
const createEvent = catchAsync(async (req, res, next) => {
  const eventData = {
    ...req.body,
    createdBy: req.user._id
  };

  const event = await Event.create(eventData);

  res.status(201).json({
    success: true,
    data: { event }
  });
});

const updateEvent = catchAsync(async (req, res, next) => {
  let event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: { event }
  });
});

const deleteEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  // Soft delete
  event.isActive = false;
  await event.save();

  res.status(200).json({
    success: true,
    message: 'Event deleted successfully'
  });
});

const getAllEvents = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  
  if (req.query.status) {
    filter.isActive = req.query.status === 'active';
  }

  const events = await Event.find(filter)
    .populate('createdBy', 'name email')
    .skip(skip)
    .limit(limit)
    .sort({ date: 1 });

  const total = await Event.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: events.length,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    data: { events }
  });
});

module.exports = {
  getDashboardStats,
  createCourse,
  updateCourse,
  deleteCourse,
  getAllCourses,
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvents
};