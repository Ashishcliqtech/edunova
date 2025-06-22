const Blog = require('../models/blogModel'); 
const { AppError, catchAsync }  = require('../utils/errorUtils'); 



// Create a new blog post
exports.createBlog = catchAsync(async (req, res, next) => {
  // Assuming 'createdBy' is taken from the authenticated user's ID
  // You would typically get req.user.id from an authentication middleware
  if (req.body.createdBy) {
    // If createdBy is manually provided in the body, remove it to prevent manipulation
    // and use the ID from the authenticated user.
    delete req.body.createdBy;
  }
  req.body.createdBy = req.user ? req.user.id : null; // Set createdBy if user is authenticated

  const newBlog = await Blog.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      blog: newBlog
    }
  });
});

// Get all blog posts
exports.getAllBlogs = catchAsync(async (req, res, next) => {
  const blogs = await Blog.find({ isActive: true }).populate({
    path: 'createdBy',
    select: 'name email' // Populate with user name and email
  });

  res.status(200).json({
    status: 'success',
    results: blogs.length,
    data: {
      blogs
    }
  });
});

// NEW: Get all Blog (for admin) - active and inactive
exports.getAllBlogForAdmin = catchAsync(async (req, res, next) => {
  // Admin can view all blogs, regardless of 'isActive' status
  const blogs = await Blog.find().populate({ // Changed from Course.find() to Blog.find()
    path: 'createdBy',
    select: 'name email' // Populate with user name and email
  });

  res.status(200).json({
    status: 'success',
    results: blogs.length,
    data: {
      blogs: blogs // Changed from courses to blogs
    }
  });
});

// Get a single blog post by ID
exports.getBlogbyId = catchAsync(async (req, res, next) => {
  const blog = await Blog.findOne({ _id: req.params.id, isActive: true }).populate({
    path: 'createdBy',
    select: 'name email'
  });

  if (!blog) {
    return next(new AppError('No blog found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      blog
    }
  });
});

// Update a blog post by ID
exports.updateBlog = catchAsync(async (req, res, next) => {
  // Prevent direct update of createdBy field
  if (req.body.createdBy) {
    return next(new AppError('You cannot change the creator of a blog post', 400));
  }

  const blog = await Blog.findOneAndUpdate({ _id: req.params.id, createdBy: req.user.id }, req.body, {
    new: true, // Return the modified document rather than the original
    runValidators: true // Run schema validators on update
  });

  if (!blog) {
    return next(new AppError('No blog found with that ID or you do not have permission to update it.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      blog
    }
  });
});

// Delete a blog post (soft delete)
exports.deleteBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findOneAndUpdate({ _id: req.params.id, createdBy: req.user.id }, { isActive: false }, {
    new: true
  });

  if (!blog) {
    return next(new AppError('No blog found with that ID or you do not have permission to delete it.', 404));
  }

  res.status(204).json({ // 204 No Content for successful deletion
    status: 'success',
    data: null
  });
});