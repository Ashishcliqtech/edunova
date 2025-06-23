const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: { // Renamed from 'content' to 'description' for consistency with your example
    type: String,
    required: [true, 'Blog description is required'],
    trim: true,
    minlength: [50, 'Description must be at least 50 characters long'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  image: {
    type: String, // This field will store the Cloudinary URL of the image
    required: [true, 'Blog image is required'],
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Assuming you have a User model
    required: [false, 'Blog must belong to a user']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // This will automatically add createdAt and updatedAt fields
});

// Index for better performance on title lookups
blogSchema.index({ title: 1 });

module.exports = mongoose.model('Blog', blogSchema);