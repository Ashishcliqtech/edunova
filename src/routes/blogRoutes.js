const express = require("express");
const {
  createBlog,
  getAllBlogs,
  getBlogbyId,
  updateBlog,
  deleteBlog,
  getAllBlogForAdmin,
  getBlogbyIdAdmin,
} = require("../controllers/blogController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  validateBlog,
  validateUpdateBlog,
} = require("../middleware/validationMiddleware");
const { uploadImageToCloudinary } = require("../middleware/uploadMiddleware");

const router = express.Router();

// =======================
// PUBLIC ROUTES
// =======================

// GET /api/v1/blog
router.get("/blogs", getAllBlogs);

// GET /api/v1/blog/:id
router.get("/blogs/:id", getBlogbyId);
router.get("/admin/blogs/:id", getBlogbyIdAdmin);
// =======================
// ADMIN ROUTES
// =======================

router.get("/admin/blogs", protect, adminOnly, getAllBlogForAdmin);

// POST /api/v1/admin/blog - Admin Only
router.post(
  "/admin/create-blog",
  protect,
  adminOnly,
  uploadImageToCloudinary("image", "blogs"),
  validateBlog,
  createBlog
);

// PUT /api/v1/admin/blog/:id - Admin Only
router.patch(
  "/admin/update-blog/:id",
  protect,
  adminOnly,
  uploadImageToCloudinary("image", "blogs"),
  validateUpdateBlog,
  updateBlog
);

// DELETE /api/v1/admin/blog/:id - Admin Only
router.patch("/admin/delete-blog/:id", protect, adminOnly, deleteBlog);

module.exports = router;
