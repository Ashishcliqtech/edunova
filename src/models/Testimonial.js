const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Full Name must be at least 2 characters long"],
      maxlength: [50, "Full Name cannot exceed 50 characters"],
    },
    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
      minlength: [2, "Designation must be at least 2 characters long"],
      maxlength: [50, "Designation cannot exceed 50 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 5 characters long"],
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);
