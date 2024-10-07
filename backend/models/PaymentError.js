const mongoose = require('mongoose');
const { applyCacheToQueries } = require('../config/cache');

const paymentErrorSchema = new mongoose.Schema({
  errorType: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  stack: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
});
applyCacheToQueries(paymentErrorSchema)
const PaymentError = mongoose.model('PaymentError', paymentErrorSchema);

module.exports = PaymentError;
