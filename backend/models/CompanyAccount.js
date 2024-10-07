const mongoose = require('mongoose');

const companyAccountSchema = new mongoose.Schema({
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
});

const CompanyAccount = mongoose.model('CompanyAccount', companyAccountSchema);

module.exports = CompanyAccount;
