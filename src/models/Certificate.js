const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  pdfUrl: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificate', certificateSchema);
