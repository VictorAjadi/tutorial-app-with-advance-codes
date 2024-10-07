const mongoose = require('mongoose');
const { applyCacheToQueries } = require('../config/cache');

// Define Payment Schema
const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User schema (assuming students are also stored in User model)
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course', // Reference to the Course schema
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    required: true,
    default: 'pending',
  },
  transactionId: {
    type: String,
    unique: true,
    required: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
    required: false, // Optional field for any additional information
  },
  refund: {
    type: String,
    required: true
  },
  paidInstructor:{
    type: Boolean,
    required: true,
    default: false
  },
  paidInstructorDate:{
    type: Date
  }
});

applyCacheToQueries(paymentSchema);

// Create Payment Model
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
