
const {catchAsync, appError}= require("../utils/errorUtils");
const User = require("../models/User");
const successResponse = require("../utils/successResponse");
const logger = require("../utils/logger");

const getAllUsers = catchAsync(async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    if (!users || users.length === 0) {
      return next(new appError("No users found", 404));
    }

    successResponse(res, 200, "Users fetched successfully", { users });
  } catch (error) {
    logger.error("Error fetching users:", error);
    return next(new appError("Failed to fetch users: internal server error", 500));
  }
});



module.exports = {
  getAllUsers,
};