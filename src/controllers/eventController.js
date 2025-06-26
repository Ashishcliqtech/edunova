const Event = require("../models/Event");
const { AppError, catchAsync } = require("../utils/errorUtils");
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} = require("../utils/constant/Messages");
const successResponse = require("../utils/successResponse");
const logger = require("../utils/logger");

// ============================
// EVENT CONTROLLER (Admin + User)
// ============================

// POST /api/v1/admin/events
const createEvent = async (req, res, next) => {
  try {
    const { title, description, price, paymentUrl, image } = req.body;

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
      message: SUCCESS_MESSAGES.EVENT_CREATED,
      data: { event },
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
      message: SUCCESS_MESSAGES.EVENT_UPDATED,
      data: { event },
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
      message: SUCCESS_MESSAGES.EVENT_DELETED,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/events
const getUserEvents = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const filter = { isActive: true }; // Always show only active events for users/public

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
      message: SUCCESS_MESSAGES.EVENT_FETCHED,
      count: events.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: { events },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/admin/events
const getAdminEvents = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const filter = {}; // Admins see all events by default

    // Filter by active status
    if (req.query.isActive !== undefined && req.query.isActive !== null) {
      filter.isActive = req.query.isActive === 'true';
    }

    // Filter by search term
    if (req.query.search) {
      const regex = new RegExp(req.query.search, "i");
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const query = Event.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

    const [events, total] = await Promise.all([
      query,
      Event.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Successfully fetched events for admin.",
      count: events.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: { events },
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
      data: { event },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/events/:id/enroll
const enrollInEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event || !event.isActive) {
      return next(new AppError(ERROR_MESSAGES.EVENT_NOT_FOUND, 404));
    }

    if (!event.paymentUrl) {
      return next(
        new AppError("Payment URL not available for this event", 400)
      );
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

const getEventByIdAdmin = catchAsync(async (req, res, next) => {
  try {
    const eventId = req.params.id;
    if (!eventId) {
      return next(new AppError(ERROR_MESSAGES.EVENT_ID_REQUIRED, 400));
    }
    const event = await Event.findById(eventId); // Admins get creator info
    if (!event) {
      return next(new AppError(ERROR_MESSAGES.EVENT_NOT_FOUND, 404));
    }
    successResponse(res, 200, SUCCESS_MESSAGES.EVENT_FETCHED, {
      event,
    });
  } catch (err) {
    logger.error("Error fetching event by ID:", err);
    return next(
      new AppError("Failed to fetch event Internal server error", 500)
    );
  }
});

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getUserEvents,
  getAdminEvents,
  getEventById,
  enrollInEvent,
  getEventByIdAdmin,
};
