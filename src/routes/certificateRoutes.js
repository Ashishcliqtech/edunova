const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { validateCertificate } = require("../middleware/validationMiddleware");
const { uploadPdfToCloudinary } = require("../middleware/uploadMiddleware");
const {
  addCertificate,
  getAllCertificates,
  getCertificateByKey,
  downloadCertificate,
  softDeleteCertificate,
  getCertificateByKeyForAdmin,
} = require("../controllers/certificateController");

const router = express.Router();

// Admin: Add certificate (PDF upload)
router.post(
  "/admin/certificates",
  protect,
  adminOnly,
  uploadPdfToCloudinary("certificatePdf", "certificates"),
  validateCertificate,
  addCertificate
);

// Admin: View all certificates
router.get("/admin/certificates", protect, adminOnly, getAllCertificates);

// Admin: Soft delete certificate by key
router.patch(
  "/admin/certificates/:key",
  protect,
  adminOnly,
  softDeleteCertificate
);

// Public: Search certificate by key (no login required)
router.get("/certificate/:key", getCertificateByKey);
router.get(
  "/admin/certificate/:key",
  protect,
  adminOnly,
  getCertificateByKeyForAdmin
);

// User: Download certificate (login required)
router.get("/certificate/:key/download", protect, downloadCertificate);

module.exports = router;
