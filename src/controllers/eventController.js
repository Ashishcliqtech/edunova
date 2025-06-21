const Event = require('../models/Event');
const Enrollment = require('../models/enrollmentModel');
const { catchAsync, AppError } = require('../utils/errorUtils');
const PhonePeService = require('../utils/phonepe/PhonePeService');


// ============================
// EVENT CONTROLLER (Admin + User)
// ============================

// POST /api/v1/admin/events
const createEvent = catchAsync(async (req, res, next) => {
  const { title, description, price, paymentUrl, image } = req.body;

  const event = await Event.create({
    title,
    description,
    price,
    paymentUrl,
    image,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    data: { event }
  });
});

// PUT /api/v1/admin/events/:id
const updateEvent = catchAsync(async (req, res, next) => {
  let event = await Event.findById(req.params.id);
  if (!event) return next(new AppError('Event not found', 404));

  const { title, description, price, paymentUrl, image } = req.body;
  const updateData = {
    ...(title && { title }),
    ...(description && { description }),
    ...(typeof price !== 'undefined' && { price }),
    ...(paymentUrl && { paymentUrl }),
    ...(image && { image })
  };

  event = await Event.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: { event }
  });
});

// DELETE /api/v1/admin/events/:id (Soft Delete)
const deleteEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) return next(new AppError('Event not found', 404));

  event.isActive = false;
  await event.save();

  res.status(200).json({
    success: true,
    message: 'Event deleted successfully'
  });
});

// GET /api/v1/admin/events
// GET /api/v1/events
const getEvents = catchAsync(async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const filter = {};
  const isAdmin = req.user && req.user.role === 'admin';

  if (!isAdmin) {
    filter.isActive = true;
  } else if (req.query.status) {
    filter.isActive = req.query.status === 'active';
  }

  const query = Event.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ date: 1 });

  if (isAdmin) query.populate('createdBy', 'name email');

  const [events, total] = await Promise.all([
    query,
    Event.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    count: events.length,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    data: { events }
  });
});

// GET /api/v1/events/:id
const getEventById = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event || !event.isActive) {
    return next(new AppError('Event not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { event }
  });
});

// POST /api/v1/events/:id/enroll
const enrollInEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) return next(new AppError('Event not found', 404));

  // Create enrollment record
  const enrollment = await Enrollment.create({
    event: event._id,
    user: req.user._id,
    isPaid: false,
  });

  res.status(201).json({
    status: 'success',
    message: 'Enrolled successfully!',
    enrollment,
  });
});

// const enrollInEvent = catchAsync(async (req, res, next) => {
//   const event = await Event.findById(req.params.id);
//   if (!event) return next(new AppError('Event not found', 404));

//   // Create enrollment record first
//   const enrollment = await Enrollment.create({
//     event: event._id,
//     user: req.user._id,
//   });

//   // Generate dynamic UPI payment link using PhonePeService
//   const transactionId = `TID-${enrollment._id}-${Date.now()}`;
//   const paymentLink = PhonePeService.generatePaymentLink({
//     amount: event.price,  // event.price in INR
//     transactionId,
//     mobile: req.user.phone,  // assuming you have phone in user model
//     name: req.user.name,     // assuming you have name in user model
//   });

//   // Redirect to generated UPI payment link
//   return res.redirect(paymentLink);
// });




// GET /api/v1/admin/enrollments/pending


const getPendingEnrollments = catchAsync(async (req, res, next) => {
  const enrollments = await Enrollment.find({ isPaid: false }).populate('user event');

  res.status(200).json({
    status: 'success',
    results: enrollments.length,
    enrollments,
  });
});

// POST /api/v1/admin/enrollments/:enrollmentId/confirm
const confirmPayment = catchAsync(async (req, res, next) => {
  const enrollment = await Enrollment.findById(req.params.enrollmentId);
  if (!enrollment) return next(new AppError('Enrollment not found', 404));

  enrollment.isPaid = true;
  await enrollment.save();

  res.status(200).json({
    status: 'success',
    message: 'Payment confirmed successfully',
    enrollment,
  });
});


module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  getEventById,
  enrollInEvent,
  getPendingEnrollments,
  confirmPayment

};
