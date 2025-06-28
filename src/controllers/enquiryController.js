const Enquiry = require("../models/Enquiry");
const { catchAsync, AppError } = require("../utils/errorUtils");
const successResponse = require("../utils/successResponse");
const logger = require("../utils/logger");

const createEnquiry = catchAsync(async (req, res, next) => {
  const { fullName, email, phone, message } = req.body;
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError("User ID is required", 400));
    }

    if (!fullName || !email || !phone || !message) {
      return next(new AppError("All fields are required", 400));
    }

    const enquiryData = {
      userId,
      fullName,
      email,
      phone,
      message,
    };
    await Enquiry.create(enquiryData);

    return successResponse(res, 201, "Enquiry submitted successfully");
  } catch (error) {
    logger.error("Error creating enquiry:", error);
    return next(new AppError("Failed to create enquiry", 500));
  }
});

const getAllEnquiry = catchAsync(async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const filter = {};

    // Filter by isActive if provided
    if (typeof req.query.isResolved !== "undefined") {
      filter.isResolved = req.query.isResolved === "true";
    }

    // Search by fullName, email, or phone
    if (req.query.search) {
      const regex = new RegExp(req.query.search, "i");
      filter.$or = [{ fullName: regex }, { email: regex }, { phone: regex }];
    }

    const query = Enquiry.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const [enquiries, total] = await Promise.all([
      query,
      Enquiry.countDocuments(filter),
    ]);

    if (!enquiries || enquiries.length === 0) {
      return next(new AppError("No enquiries found", 404));
    }

    return successResponse(res, 200, "Enquiries fetched successfully", {
      count: enquiries.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      enquiries,
    });
  } catch (error) {
    logger.error("Error fetching enquiries:", error);
    return next(new AppError("Failed to fetch enquiries", 500));
  }
});

const getEnquiryByUserId = catchAsync(async (req, res, next) => {
  try {
    const userId = req.params.userId;

    logger.info("Fetching enquiries By user ID");

    if (!userId) {
      return next(new AppError("User ID is required", 400));
    }

    console.log("User ID:", userId);
    const enquiriesByUser = await Enquiry.find({ userId })
      .sort({
        createdAt: -1,
      })
      .populate("userId", "name email");

    if (!enquiriesByUser || enquiriesByUser.length === 0) {
      return next(new AppError("No enquiries found for this user", 404));
    }

    return successResponse(res, 200, "Enquiries fetched successfully", {
      enquiriesByUser,
    });
  } catch (error) {
    logger.error("Error fetching enquiry by user ID:", error);
    return next(new AppError("Failed to fetch enquiry", 500));
  }
});

const getEnquiryById = catchAsync(async (req, res, next) => {
  try {
    const enquiryId = req.params.id;

    if (!enquiryId) {
      return next(new AppError("Enquiry ID is required", 400));
    }

    logger.info("Fetching enquiries for Enquiry ID:");
    console.log("Enquiry ID:", enquiryId);
    const enquiryById = await Enquiry.findById(enquiryId);

    if (!enquiryById || enquiryById.length === 0) {
      return next(new AppError("No enquiries found", 404));
    }

    return successResponse(res, 200, "Enquiries fetched successfully", {
      enquiryById,
    });
  } catch (error) {
    logger.error("Error fetching enquiry by enquiry ID:", error);
    return next(new AppError("Failed to fetch enquiry", 500));
  }
});

const statusEnquiryById = catchAsync(async (req, res, next) => {
  try {
    const enquiryId = req.params.id;

    if (!enquiryId) {
      return next(new AppError("Enquiry ID is required", 400));
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      enquiryId,
      { isResolved: true },
      { new: true }
    );

    if (!enquiry) {
      return next(new AppError("Enquiry not found", 404));
    }

    return successResponse(res, 200, "Enquiry Resolved", {
      enquiry,
    });
  } catch (error) {
    logger.error("Error deleting enquiry by Eid:", error);
    return next(new AppError("Failed to change status of  enquiry", 500));
  }
});

module.exports = {
  createEnquiry,
  getAllEnquiry,
  getEnquiryByUserId,
  statusEnquiryById,
  getEnquiryById,
};
