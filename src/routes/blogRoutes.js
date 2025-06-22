const express = require('express');
const {
  createBlog,
  getAllBlogs,
  getBlogbyId,
  updateBlog,
  deleteBlog,
  getAllBlogForAdmin
} = require('../controllers/blogController'); 
const { protect, adminOnly } = require('../middleware/authMiddleware'); 
const { validateBlog, validateUpdateBlog } = require('../middleware/validationMiddleware'); 
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');


const router = express.Router();

// =======================
// PUBLIC ROUTES
// =======================

// GET /api/v1/blog 
router.get('/blog-for-user', getAllBlogs);

// GET /api/v1/blog/:id 
router.get('/blog/:id', getBlogbyId);

// =======================
// ADMIN ROUTES
// =======================


router.get(
  '/admin/blog-all',
  protect,
  adminOnly, 
  getAllBlogForAdmin);

// POST /api/v1/admin/blog - Admin Only
router.post(
  '/admin/blog',
  protect,
  adminOnly,
  validateBlog, 
  uploadToCloudinary('image'),
  createBlog
);

// PUT /api/v1/admin/blog/:id - Admin Only
router.patch(
  '/admin/blog/:id',
  protect,
  adminOnly,
  validateUpdateBlog,
  uploadToCloudinary('image'), // optional image update
  updateBlog
);

// DELETE /api/v1/admin/blog/:id - Admin Only
router.delete(
  '/admin/blog/:id',
  protect,
  adminOnly,
  deleteBlog
);


module.exports = router;