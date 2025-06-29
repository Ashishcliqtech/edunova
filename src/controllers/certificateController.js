const Certificate = require("../models/Certificate");
const { AppError, catchAsync } = require("../utils/errorUtils");
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} = require("../utils/constant/Messages");
const logger = require("../utils/logger");
const emptyListResponse = require("../utils/emptyListResponse");

// Admin: Add certificate (PDF upload handled by middleware)
exports.addCertificate = async (req, res, next) => {
  try {
    const pdfUrl = req.body.certificatePdf;
    const userEmail = req.body.userEmail;

    if (!userEmail) {
      return next(new AppError("User email is required.", 400));
    }
    if (!pdfUrl) {
      return next(new AppError(ERROR_MESSAGES.PDF_UPLOAD_FAILED, 400));
    }

    // Generate a unique certificate key (e.g., CERT-<timestamp>-<random>)
    let certificateKey;
    let isUnique = false;
    while (!isUnique) {
      certificateKey = `Edunova-${Date.now()}-${Math.floor(
        Math.random() * 10000
      )}`;
      const existing = await Certificate.findOne({ certificateKey });
      if (!existing) isUnique = true;
    }

    const cert = await Certificate.create({
      certificateKey,
      pdfUrl,
      userEmail,
    });

    res.status(201).json({
      success: true,
      message:
        SUCCESS_MESSAGES.CERTIFICATE_CREATED ||
        "Certificate uploaded successfully.",
      data: { certificate: cert },
    });
  } catch (err) {
    logger.error("Error uploading certificate:", err);
    return next(
      new AppError("Failed to upload certificate Internal server Error.", 500)
    );
  }
};

// Admin: View all certificates
exports.getAllCertificates = async (req, res, next) => {
  try {
    const certs = await Certificate.find().sort({ createdAt: -1 });
    if (!certs || certs.length === 0) {
      return emptyListResponse(
        res,
        ERROR_MESSAGES.CERTIFICATE_NOT_FOUND || "certificates not found.",
        "certs"
      );
    }
    res.status(200).json({
      success: true,
      message:
        SUCCESS_MESSAGES.CERTIFICATE_FETCHED ||
        "Certificates fetched successfully.",
      count: certs.length,
      data: { certificates: certs },
    });
  } catch (err) {
    next(err);
  }
};

// Public: Search certificate by key (no login required)
exports.getCertificateByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!key) {
      return next(new AppError("Certificate key not found"));
    }
    const cert = await Certificate.findOne({
      certificateKey: key,
      isActive: true,
    });
    if (!cert)
      return next(
        new AppError(
          ERROR_MESSAGES.CERTIFICATE_NOT_FOUND || "Certificate not found.",
          404
        )
      );
    res.status(200).json({
      success: true,
      message:
        SUCCESS_MESSAGES.CERTIFICATE_FETCHED ||
        "Certificate fetched successfully.",
      data: { certificate: cert },
    });
  } catch (err) {
    next(err);
  }
};

exports.getCertificateByKeyForAdmin = catchAsync(async (req, res, next) => {
  const { key } = req.params;
  if (!key) return next(new AppError("Certificate key is required.", 400));
  const cert = await Certificate.findOne({
    certificateKey: key,
  });
  if (!cert)
    return next(
      new AppError(
        ERROR_MESSAGES.CERTIFICATE_NOT_FOUND || "Certificate not found.",
        404
      )
    );
  res.status(200).json({
    success: true,
    message:
      SUCCESS_MESSAGES.CERTIFICATE_FETCHED ||
      "Certificate fetched successfully.",
    data: { certificate: cert },
  });
});
// User: Download certificate PDF (login required, anyone with key)
exports.downloadCertificate = async (req, res, next) => {
  try {
    const { key } = req.params;
    const cert = await Certificate.findOne({
      certificateKey: key,
      isActive: true,
    });
    if (!cert)
      return next(
        new AppError(
          ERROR_MESSAGES.CERTIFICATE_NOT_FOUND || "Certificate not found.",
          404
        )
      );
    // Anyone with the key can download
    res.redirect(cert.pdfUrl);
  } catch (err) {
    next(err);
  }
};

// Admin: Soft delete a certificate by key
exports.softDeleteCertificate = async (req, res, next) => {
  try {
    const { key } = req.params;
    const cert = await Certificate.findOne({
      certificateKey: key,
      isActive: true,
    });
    if (!cert)
      return next(
        new AppError(
          ERROR_MESSAGES.CERTIFICATE_NOT_FOUND || "Certificate not found.",
          404
        )
      );

    cert.isActive = false;
    await cert.save();

    res.status(200).json({
      success: true,
      message: "Certificate deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};
