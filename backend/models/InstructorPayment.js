const mongoose = require('mongoose');
const { applyCacheToQueries } = require('../config/cache');

const instructorPaymentSchema = new mongoose.Schema({
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User schema (instructor)
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  instructorShare:{
    type: Number,
    required: true,
  },
  details:{
    type: Object,
    required: true,
  },
  companyShare:{
    type: Number,
    required: true,
  },
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment', // Reference to the Payment schema
  }],
  paymentDate: {
    type: Date,
    default: Date.now,
  },
});
applyCacheToQueries(instructorPaymentSchema)
const InstructorPayment = mongoose.model('InstructorPayment', instructorPaymentSchema);

module.exports = InstructorPayment;
