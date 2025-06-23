const Blog = require('../models/blogModel'); 
const { AppError }  = require('../utils/errorUtils'); 
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constant/Messages');


// Create a new blog post
exports.createBlog = async (req, res, next) => {
  try {
    if (req.body.createdBy) {
      delete req.body.createdBy;
    }
    req.body.createdBy = req.user ? req.user.id : null;

    const newBlog = await Blog.create(req.body);

    res.status(201).json({
      success: true,
      message: SUCCESS_MESSAGES.BLOG_CREATED,
      data: { blog: newBlog }
    });
  } catch (err) {
    next(err);
  }
};

// Get all blog posts
exports.getAllBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find({ isActive: true }).populate({
      path: 'createdBy',
      select: 'name email'
    });

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.BLOG_FETCHED,
      results: blogs.length,
      data: { blogs }
    });
  } catch (err) {
    next(err);
  }
};

// NEW: Get all Blog (for admin) - active and inactive
exports.getAllBlogForAdmin = async (req, res, next) => {
  try {
    const blogs = await Blog.find().populate({
      path: 'createdBy',
      select: 'name email'
    });

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.BLOG_FETCHED,
      results: blogs.length,
      data: { blogs }
    });
  } catch (err) {
    next(err);
  }
};

// Get a single blog post by ID
exports.getBlogbyId = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ _id: req.params.id, isActive: true }).populate({
      path: 'createdBy',
      select: 'name email'
    });

    if (!blog) {
      return next(new AppError(ERROR_MESSAGES.BLOG_NOT_FOUND, 404));
    }

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.BLOG_FETCHED,
      data: { blog }
    });
  } catch (err) {
    next(err);
  }
};

// Update a blog post by ID
exports.updateBlog = async (req, res, next) => {
  try {
    if (req.body.createdBy) {
      return next(new AppError(ERROR_MESSAGES.BLOG_UPDATE_FORBIDDEN, 400));
    }

    const blog = await Blog.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!blog) {
      return next(new AppError(ERROR_MESSAGES.BLOG_NOT_FOUND, 404));
    }

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.BLOG_UPDATED,
      data: { blog }
    });
  } catch (err) {
    next(err);
  }
};

// Delete a blog post (soft delete)
exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!blog) {
      return next(new AppError(ERROR_MESSAGES.BLOG_NOT_FOUND, 404));
    }

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.BLOG_DELETED,
      data: null
    });
  } catch (err) {
    next(err);
  }
};