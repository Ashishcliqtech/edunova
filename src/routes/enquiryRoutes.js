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
  deleteEnquiryById,
} = require("../controllers/enquiryController");
const { validateEnquiryDto } = require("../middleware/validationMiddleware");

router.post(
  "/user/create-enquiry",
  protect,
  validateEnquiryDto,
  userOnly,
  createEnquiry
);
router.get("/get-enquiry", getAllEnquiry);
router.get(
  "/admin/get-enquiry/:userId",
  protect,
  adminOnly,
  getEnquiryByUserId
);
router.patch(
  "/admin/delete-enquiry/:eId",
  protect,
  adminOnly,
  deleteEnquiryById
);
module.exports = router;
