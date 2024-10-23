const mongoose = require('mongoose');

const FailedEmailSchema = new mongoose.Schema({
  email: { type: String, required: true },
  option: { type: String, required: true },
  type: { type: String, required: true },
  isSent: { type: Boolean, default: false }, // track if email was successfully sent
  createdAt: { type: Date, default: Date.now }
});

const FailedEmail = mongoose.model('FailedEmail', FailedEmailSchema);
module.exports = FailedEmail;
