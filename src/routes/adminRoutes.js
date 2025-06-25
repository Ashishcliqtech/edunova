const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  deleteUserById,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/admin/users/get-all-users", protect, adminOnly, getAllUsers);
router.get("/users/get-user/:id", protect, getUserById);
router.patch(
  "/admin/users/delete-user/:id",
  protect,
  adminOnly,
  deleteUserById
);
module.exports = router;
