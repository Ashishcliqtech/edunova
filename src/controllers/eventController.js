<<<<<<< HEAD
const Event = require("../models/Event");
const { catchAsync, AppError } = require("../utils/errorUtils");
=======
const Event = require('../models/Event');
const { AppError } = require('../utils/errorUtils');
const PhonePeService = require('../utils/phonepe/PhonePeService');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constant/Messages');

>>>>>>> main

// ============================
// EVENT CONTROLLER (Admin + User)
// ============================

// POST /api/v1/admin/events
const createEvent = async (req, res, next) => {
  try {
    const { title, description, price, paymentUrl, image } = req.body;

<<<<<<< HEAD
  if (!title || !description || !image || !paymentUrl || !price) {
    return next(new AppError("All fields are required!", 400));
  }

  const event = await Event.create({
    title,
    description,
    price,
    paymentUrl,
    image,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: { event },
  });
});

// PUT /api/v1/admin/events/:id
const updateEvent = catchAsync(async (req, res, next) => {
  let event = await Event.findById(req.params.id);
  if (!event) return next(new AppError("Event not found", 404));

  const { title, description, price, paymentUrl, image } = req.body;
  const updateData = {
    ...(title && { title }),
    ...(description && { description }),
    ...(typeof price !== "undefined" && { price }),
    ...(paymentUrl && { paymentUrl }),
    ...(image && { image }),
  };

  event = await Event.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: { event },
  });
});

// DELETE /api/v1/admin/events/:id (Soft Delete)
const deleteEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) return next(new AppError("Event not found", 404));

  event.isActive = false;
  await event.save();

  res.status(200).json({
    success: true,
    message: "Event deleted successfully",
  });
});

=======
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
      message: SUCCESS_MESSAGES.EVENT_CREATED,
      data: { event }
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/admin/events/:id
const updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) return next(new AppError(ERROR_MESSAGES.EVENT_NOT_FOUND, 404));

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
      message: SUCCESS_MESSAGES.EVENT_UPDATED,
      data: { event }
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/admin/events/:id (Soft Delete)
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return next(new AppError(ERROR_MESSAGES.EVENT_NOT_FOUND, 404));

    event.isActive = false;
    await event.save();

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.EVENT_DELETED
    });
  } catch (err) {
    next(err);
  }
};

>>>>>>> main
// GET /api/v1/events
const getUserEvents = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const filter = { isActive: true }; // Always show only active events for users/public

<<<<<<< HEAD
  // Search filter - uses 'title' and 'description' from your Event schema
  if (req.query.search) {
    const regex = new RegExp(req.query.search, "i");
    filter.$or = [{ title: regex }, { description: regex }];
    // Add other relevant fields if available in your Event model, e.g.,
    // { location: regex }, { tags: regex }
  }

  const query = Event.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 }); // Assuming you have a createdAt field

  const [events, total] = await Promise.all([
    query,
    Event.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: events.length,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    data: { events },
  });
});
=======
    // Search filter - uses 'title' and 'description' from your Event schema
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [{ title: regex }, { description: regex }];
      // Add other relevant fields if available in your Event model, e.g.,
      // { location: regex }, { tags: regex }
    }

    const query = Event.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Assuming you have a createdAt field

    const [events, total] = await Promise.all([
      query,
      Event.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.EVENT_FETCHED,
      count: events.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: { events }
    });
  } catch (err) {
    next(err);
  }
};
>>>>>>> main

// GET /api/v1/admin/events
const getAdminEvents = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const filter = {}; // Admins see all events, no default isActive filter

<<<<<<< HEAD
  // Search filter - uses 'title' and 'description' from your Event schema
  if (req.query.search) {
    const regex = new RegExp(req.query.search, "i");
    filter.$or = [{ title: regex }, { description: regex }];
    // Add other relevant fields if available in your Event model, e.g.,
    // { location: regex }, { tags: regex }
  }

  const query = Event.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 }) // Assuming you have a createdAt field
    .populate("createdBy", "name email"); // Admins get creator info

  const [events, total] = await Promise.all([
    query,
    Event.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: events.length,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    data: { events },
  });
});

// GET /api/v1/events/:id
const getEventById = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event || !event.isActive) {
    return next(new AppError("Event not found", 404));
  }

  res.status(200).json({
    success: true,
    data: { event },
  });
});
=======
    // Search filter - uses 'title' and 'description' from your Event schema
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [{ title: regex }, { description: regex }];
      // Add other relevant fields if available in your Event model, e.g.,
      // { location: regex }, { tags: regex }
    }

    const query = Event.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // Assuming you have a createdAt field
      .populate('createdBy', 'name email'); // Admins get creator info

    const [events, total] = await Promise.all([
      query,
      Event.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.EVENT_FETCHED,
      count: events.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: { events }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/events/:id
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || !event.isActive) {
      return next(new AppError(ERROR_MESSAGES.EVENT_NOT_FOUND, 404));
    }

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.EVENT_FETCHED,
      data: { event }
    });
  } catch (err) {
    next(err);
  }
};
>>>>>>> main

// POST /api/v1/events/:id/enroll
const enrollInEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

<<<<<<< HEAD
  if (!event || !event.isActive) {
    return next(new AppError("Event not found", 404));
  }

  if (!event.paymentUrl) {
    return next(new AppError("Payment URL not available for this event", 400));
  }

  res.status(200).json({
    success: true,
    paymentUrl: event.paymentUrl,
    message: "Redirect to payment URL",
  });
});
=======
    if (!event || !event.isActive) {
      return next(new AppError(ERROR_MESSAGES.EVENT_NOT_FOUND, 404));
    }

    if (!event.paymentUrl) {
      return next(new AppError("Payment URL not available for this event", 400));
    }
    
    res.status(200).json({
      success: true,
      paymentUrl: event.paymentUrl,
      message: "Redirect to payment URL",
    });
  } catch (err) {
    next(err);
  }
};
>>>>>>> main

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getUserEvents,
  getAdminEvents,
  getEventById,
<<<<<<< HEAD
  enrollInEvent,
=======
  enrollInEvent
>>>>>>> main
};
