const express = require('express');
const { protectRoutes, protectAdmins } = require('../authentication/protect');
const { capturePayment, createPayment, getAllPayment } = require('../controller/paymentController');

const Router = express.Router();
Router.route('/').get(protectRoutes,protectAdmins,getAllPayment);

// Create Payment Route
Router.route('/create-payment').post(protectRoutes,createPayment);
// Capture Payment Route
Router.route('/capture-payment/:orderId').post(protectRoutes,capturePayment);

module.exports = Router;
