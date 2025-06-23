const ERROR_MESSAGES = {
  COURSE_NOT_FOUND: "Course not found.",
  EVENT_NOT_FOUND: "Event not found.",
  BLOG_NOT_FOUND: "Blog not found.",
  COURSE_DELETE_FORBIDDEN: "You do not have permission to delete this course.",
  EVENT_DELETE_FORBIDDEN: "You do not have permission to delete this event.",
  BLOG_DELETE_FORBIDDEN: "You do not have permission to delete this blog.",
  COURSE_UPDATE_FORBIDDEN: "You do not have permission to update this course.",
  EVENT_UPDATE_FORBIDDEN: "You do not have permission to update this event.",
  BLOG_UPDATE_FORBIDDEN: "You do not have permission to update this blog.",
  DUPLICATE_COURSE: "A course with this title already exists.",
  DUPLICATE_EVENT: "An event with this title already exists.",
  DUPLICATE_BLOG: "A blog with this title already exists.",
  INVALID_COURSE_ID: "Invalid course ID.",
  INVALID_EVENT_ID: "Invalid event ID.",
  INVALID_BLOG_ID: "Invalid blog ID.",
  IMAGE_UPLOAD_FAILED: "Image upload to Cloudinary failed. Please try again.",
  FILE_UPLOAD_ERROR: "File upload error.",
  PDF_UPLOAD_FAILED: "PDF upload to Cloudinary failed.",
  INVALID_IMAGE_FILE: "Only image files are allowed.",
  INVALID_PDF_FILE: "Only PDF files are allowed.",
  FILE_SIZE_EXCEEDED: "File size exceeds the allowed limit.",
  CERTIFICATE_NOT_FOUND: "Certificate not found.",
  CERTIFICATE_CREATE_FORBIDDEN: "You do not have permission to create a certificate.",
  CERTIFICATE_DOWNLOAD_FORBIDDEN: "You do not have permission to download this certificate."
  // Add more as needed...
};

const SUCCESS_MESSAGES = {
  COURSE_CREATED: "Course created successfully.",
  COURSE_UPDATED: "Course updated successfully.",
  COURSE_DELETED: "Course deleted successfully.",
  EVENT_CREATED: "Event created successfully.",
  EVENT_UPDATED: "Event updated successfully.",
  EVENT_DELETED: "Event deleted successfully.",
  BLOG_CREATED: "Blog created successfully.",
  BLOG_UPDATED: "Blog updated successfully.",
  BLOG_DELETED: "Blog deleted successfully.",
  COURSE_FETCHED: "Course fetched successfully.",
  EVENT_FETCHED: "Event fetched successfully.",
  BLOG_FETCHED: "Blog fetched successfully.",
  CERTIFICATE_CREATED: "Certificate created successfully.",
  CERTIFICATE_FETCHED: "Certificate fetched successfully.",
  // Add more as needed...
};

const OTHER_CONSTANTS = {
  // Define any other constants that are not error or success messages
};

module.exports = {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  OTHER_CONSTANTS,
};
