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

    return successResponse(res, 201, "Enquiry submitted successfully", {
      enquiryData,
    });
  } catch (error) {
    logger.error("Error creating enquiry:", error);
    return next(new AppError("Failed to create enquiry", 500));
  }
});

const getAllEnquiry = catchAsync(async (req, res, next) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });

    if (!enquiries || enquiries.length === 0) {
      return next(new AppError("No enquiries found", 404));
    }

    return successResponse(res, 200, "Enquiries fetched successfully", {
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

    logger.info("Fetching enquiries for user ID:", userId);

    if (!userId) {
      return next(new AppError("User ID is required", 400));
    }

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

const deleteEnquiryById = catchAsync(async (req, res, next) => {
  try {
    const enquiryId = req.params.eId;

    if (!enquiryId) {
      return next(new AppError("Enquiry ID is required", 400));
    }

    const enquiry = await Enquiry.findByIdAndDelete(enquiryId);

    if (!enquiry) {
      return next(new AppError("Enquiry not found", 404));
    }

    return successResponse(res, 200, "Enquiry deleted successfully", {
      enquiry,
    });
  } catch (error) {
    logger.error("Error deleting enquiry by Eid:", error);
    return next(new AppError("Failed to delete enquiry", 500));
  }
});

module.exports = {
  createEnquiry,
  getAllEnquiry,
  getEnquiryByUserId,
  deleteEnquiryById,
};
