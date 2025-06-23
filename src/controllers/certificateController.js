const Certificate = require('../models/Certificate');
const { AppError, catchAsync } = require('../utils/errorUtils');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constant/Messages');

// Admin: Add certificate (PDF upload handled by middleware)
exports.addCertificate = catchAsync(async (req, res, next) => {
  const pdfUrl = req.body.certificatePdf; // Set by uploadPdfToCloudinary middleware

  if (!pdfUrl) {
    return next(new AppError(ERROR_MESSAGES.PDF_UPLOAD_FAILED, 400));
  }

  // Generate a unique certificate key (e.g., CERT-<timestamp>-<random>)
  let certificateKey;
  let isUnique = false;
  while (!isUnique) {
    certificateKey = `CERT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const existing = await Certificate.findOne({ certificateKey });
    if (!existing) isUnique = true;
  }

  const cert = await Certificate.create({
    certificateKey,
    pdfUrl
  });

  res.status(201).json({
    success: true,
    message: SUCCESS_MESSAGES.CERTIFICATE_CREATED || "Certificate created successfully.",
    data: { certificate: cert }
  });
});

// Admin: View all certificates
exports.getAllCertificates = catchAsync(async (req, res, next) => {
  const certs = await Certificate.find();
  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.CERTIFICATE_FETCHED || "Certificates fetched successfully.",
    count: certs.length,
    data: { certificates: certs }
  });
});

// Public: Search certificate by key (no login required)
exports.getCertificateByKey = catchAsync(async (req, res, next) => {
  const { key } = req.params;
  const cert = await Certificate.findOne({ certificateKey: key, isActive: true });
  if (!cert) return next(new AppError(ERROR_MESSAGES.CERTIFICATE_NOT_FOUND || "Certificate not found.", 404));
  res.status(200).json({
    success: true,
    message: SUCCESS_MESSAGES.CERTIFICATE_FETCHED || "Certificate fetched successfully.",
    data: { certificate: cert }
  });
});

// User: Download certificate PDF (login required, anyone with key)
exports.downloadCertificate = catchAsync(async (req, res, next) => {
  const { key } = req.params;
  const cert = await Certificate.findOne({ certificateKey: key, isActive: true });
  if (!cert) return next(new AppError(ERROR_MESSAGES.CERTIFICATE_NOT_FOUND || "Certificate not found.", 404));
  // Anyone with the key can download
  res.redirect(cert.pdfUrl);
});

// Admin: Soft delete a certificate by key
exports.softDeleteCertificate = catchAsync(async (req, res, next) => {
  const { key } = req.params;
  const cert = await Certificate.findOne({ certificateKey: key, isActive: true });
  if (!cert) return next(new AppError(ERROR_MESSAGES.CERTIFICATE_NOT_FOUND || "Certificate not found.", 404));

  cert.isActive = false;
  await cert.save();

  res.status(200).json({
    success: true,
    message: "Certificate deleted successfully."
  });
});
