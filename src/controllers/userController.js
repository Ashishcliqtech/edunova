const Course = require('../models/Course');
const Event = require('../models/Event');
const { catchAsync } = require('../utils/errorUtils');

const getCourses = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { isActive: true };
  
  if (req.query.category) {
    filter.category = req.query.category;
  }
  
  if (req.query.level) {
    filter.level = req.query.level;
  }

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
      { instructor: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const courses = await Course.find(filter)
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

const getCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findOne({ 
    _id: req.params.id, 
    isActive: true 
  }).populate('createdBy', 'name email');

  if (!course) {
    return next(new AppError('Course not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { course }
  });
});

const getEvents = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { isActive: true };
  
  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.upcoming) {
    filter.date = { $gte: new Date() };
  }

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
      { location: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const events = await Event.find(filter)
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

const getEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findOne({ 
    _id: req.params.id, 
    isActive: true 
  }).populate('createdBy', 'name email');

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { event }
  });
});

module.exports = {
  getCourses,
  getCourse,
  getEvents,
  getEvent
};