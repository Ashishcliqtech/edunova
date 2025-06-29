const { catchAsync, AppError } = require("../utils/errorUtils");
const User = require("../models/User");
const successResponse = require("../utils/successResponse");
const logger = require("../utils/logger");
const emptyListResponse = require("../utils/emptyListResponse");

const getAllUsers = catchAsync(async (req, res, next) => {
  try {
    let users, totalUsers, totalPages, page, limit;

    if (!req.query.page && !req.query.limit) {
      // No pagination params: return all users
      users = await User.find({ role: { $ne: "admin" } })
        .select("-password")
        .sort({ createdAt: -1 });
      totalUsers = users.length;
      totalPages = 1;
      page = 1;
      limit = totalUsers;
    } else {
      // Paginated response
      page = Math.max(parseInt(req.query.page) || 1, 1);
      limit = Math.max(parseInt(req.query.limit) || 10, 1);
      const skip = (page - 1) * limit;

      users = await User.find({ role: { $ne: "admin" } })
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      totalUsers = await User.countDocuments({ role: { $ne: "admin" } });
      totalPages = Math.ceil(totalUsers / limit);
    }

    if (!users || users.length === 0) {
      return emptyListResponse(res, "No users found", "users", {
        pagination: {
          totalUsers: 0,
          totalPages: 1,
          currentPage: page,
          pageSize: limit,
        },
      });
    }

    successResponse(res, 200, "Users fetched successfully", {
      users,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    logger.error("Error fetching users:", error);
    return next(
      new AppError("Failed to fetch users: internal server error", 500)
    );
  }
});

const deleteUserById = catchAsync(async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return next(new AppError("User ID is required", 400));
    }
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    if (user.role === "admin") {
      return next(new AppError("Cannot delete admin user", 403));
    }
    await user.deleteOne();
    successResponse(res, 200, "User deleted successfully", { userId });
  } catch (error) {
    logger.error("Error deleting user:", error);
    return next(
      new AppError("Failed to delete user: internal server error", 500)
    );
  }
});

const getUserById = catchAsync(async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return next(new AppError("User ID is required", 400));
    }

    // access control: only admin or the user themselves can access this endpoint
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return next(new AppError("Access denied", 403));
    }
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return next(new AppError("User not found", 404));
    }
    successResponse(res, 200, "User fetched successfully", { user });
  } catch (error) {
    logger.error("Error fetching user:", error);
    return next(
      new AppError("Failed to fetch user: internal server error", 500)
    );
  }
});

module.exports = {
  getAllUsers,
  deleteUserById,
  getUserById,
};
