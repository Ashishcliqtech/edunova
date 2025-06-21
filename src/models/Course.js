const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  image: {
    type: String, // This field will store the Cloudinary URL of the image
    required: [true, 'Course image is required'],
    trim: true
  },
  // NEW: Add createdBy field to link course to the user who created it
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Reference the User model
    required: [false, 'Course must belong to a user']
  },
  isActive: { // Assuming courses can be soft-deleted or activated/deactivated
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // This will automatically add createdAt and updatedAt fields
});

// Index for better performance
courseSchema.index({ title: 1 });

module.exports = mongoose.model('Course', courseSchema);
