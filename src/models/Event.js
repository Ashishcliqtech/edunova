const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Event price is required'],
    min: [0, 'Price cannot be negative']
  },
  paymentUrl: { // New field for payment link
    type: String,
    required: [true, 'Payment URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(v); // Basic URL validation
      },
      message: props => `${props.value} is not a valid URL!`
    },
    maxlength: [500, 'Payment URL cannot exceed 500 characters']
  },
  image: { // New field for event image URL
    type: String,
    trim: true,
    default: 'https://via.placeholder.com/400x300.png?text=Event+Image', // Placeholder or default image
    validate: {
      validator: function(v) {
        return v === null || /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(v); // Optional URL validation
      },
      message: props => `${props.value} is not a valid image URL!`
    },
    maxlength: [500, 'Image URL cannot exceed 500 characters']
  },
  createdBy: {
  type: mongoose.Schema.ObjectId,
  ref: 'User',
  required: [false, 'Event must belong to a user']
  },
  isActive: { // Assuming courses can be soft-deleted or activated/deactivated
    type: Boolean,
    default: true
  },
}, {
  timestamps: true // Keep timestamps for createdAt and updatedAt
});

module.exports = mongoose.model('Event', eventSchema);