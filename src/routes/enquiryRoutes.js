const express = require("express");
const router = express.Router();
const {
  protect,
  userOnly,
  adminOnly,
} = require("../middleware/authMiddleware");
const {
  createEnquiry,
  getAllEnquiry,
  getEnquiryByUserId,
  statusEnquiryById,
  getEnquiryById,
} = require("../controllers/enquiryController");
const { validateEnquiryDto } = require("../middleware/validationMiddleware");

router.post(
  "/user/create-enquiry",
  protect,
  validateEnquiryDto,
  userOnly,
  createEnquiry
);
router.get("/admin/get-enquiry/:id", protect, adminOnly, getEnquiryById);
router.get("/admin/get-enquiry", protect, adminOnly, getAllEnquiry);
router.get(
  "/admin/enquiries-userId/:userId",
  protect,
  adminOnly,
  getEnquiryByUserId
);
router.patch(
  "/admin/enquiry-status/:id",
  protect,
  adminOnly,
  statusEnquiryById
);
module.exports = router;
