const Payment = require('../models/Payment');
const InstructorPayment = require('../models/InstructorPayment');
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const Course = require('../models/Course');
const customError= require("../utils/customError");
const axios=require("axios");
const User = require('../models/User');
const { empty } = require('../utils/notFoundInModel');
const PaymentError = require('../models/PaymentError');
// Create Payment Route

// Generate PayPal Access Token
exports.generateAccessToken = async () => {
  try {
    const response = await axios({
      url: process.env.PAYPAL_BASE_URL + '/v1/oauth2/token',
      method: 'post',
      data: 'grant_type=client_credentials',
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_CLIENT_SECRET,
      },
    });
    return response.data.access_token;
  } catch (error) {
    throw new customError('Failed to generate PayPal access token', 500);
  }
};
// Create PayPal Payment
exports.createPayment = asyncErrorHandler(async (req, res, next) => {
  const { total, currency, courseId } = req.body;
  const studentId = req.user._id;

  // Validate request body
  if (!total || !currency || !courseId || !studentId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if the instructor has PayPal ID entered
  const course = await Course.findById(courseId).populate({
    path: 'instructor',
    options:{skipMiddleware: true},
    select: '+paypal_id +paymentProvider',
  }).exec();

  if (!course || !course.instructor) {
    return next(new customError('Instructor or course not found.', 404));
  }

  if (!course.instructor.paypal_id || !course.instructor.paymentProvider) {
    return next(new customError("Instructor doesn't have a payment account yet.", 404));
  }

  // Check if amount and currency match the course details
  if (course.amount !== parseInt(total) || course.currency !== currency.toString()) {
    return next(new customError("Amount or currency doesn't match the course.", 404));
  }

  const user = await User.findById(studentId);
  if (!user) {
    return next(new customError("Invalid student ID, cannot identify student.", 400));
  }
  const checkPay=await Payment.findOne({studentId: studentId,courseId: courseId});
  //check if student have enrolled before and has paid
  if(user.enroll.find(enrolledId=> enrolledId.equals(courseId)) && checkPay) return next(new customError("You have recently paid for this course, go back and enjoy the course.", 400));
  try {
    // Generate PayPal access token
    const access_token = await exports.generateAccessToken();

    // Create PayPal order
    const response = await axios({
      url: process.env.PAYPAL_BASE_URL + '/v2/checkout/orders',
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token,
      },
      data: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          items: [{
            name: course.title,
            description: course.description,
            quantity: 1,
            unit_amount: {
              currency_code: currency,
              value: total,
            },
          }],
          amount: {
            currency_code: currency,
            value: total,
            breakdown: {
              item_total: {
                currency_code: currency,
                value: total,
              },
            },
          },
        }],
        application_context: {
          return_url: `${req.protocol}://${req.get('host')}/payment-success/${courseId}`, // Success URL
          cancel_url: `${req.protocol}://${req.get('host')}/payment-cancel/${courseId}`, // Cancel URL
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          brand_name: 'Devon',
        },
      }),
    });
    return res.status(200).json({
      status: 'success',
      orderID: response.data.id,
      approvalUrl: response.data.links.find(link => link.rel === 'approve').href,
    });
  } catch (error) {
    return next(new customError("Error creating PayPal payment: " + error.message, 500));
  }
});
// Capture Payment Route
exports.capturePayment = asyncErrorHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { courseId } = req.body; // Get courseId and studentId from request body
  const studentId = req.user._id;

  if (!orderId || !courseId || !studentId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check course and instructor details
  const course = await Course.findById(courseId)
    .populate({
      path: 'instructor',
      options:{skipMiddleware: true},
      select: '+paypal_id +paymentProvider',
    })
    .exec();
  
  if (!course.instructor) {
    return next(new customError('This instructor cannot be found.', 404));
  }
  if (!course.instructor.paypal_id || !course.instructor.paymentProvider) {
    return next(new customError("This instructor doesn't have a payment account yet.", 404));
  }
  
  // Validate student
  const user = await User.findById(studentId);
  if (!user) {
    return next(new customError("Invalid student ID, cannot identify student.", 400));
  }

  try {
    // Generate access token for PayPal
    const access_token = await exports.generateAccessToken();
    
    // Capture the payment with PayPal
    const response = await axios({
      url: process.env.PAYPAL_BASE_URL + `/v2/checkout/orders/${orderId}/capture`,
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token,
        'Prefer': 'return=representation' // Add this header
      }
    });

    const paypalData = response.data;
    // Check if payment was successful
    if (paypalData.status === 'COMPLETED') {
      // Store payment details in the database
      const payment = new Payment({
        studentId,
        courseId,
        amount: paypalData.purchase_units[0].amount.value,
        currency: paypalData.purchase_units[0].amount.currency_code,
        paymentMethod: 'paypal',
        status: paypalData.status.toLowerCase(),
        transactionId: paypalData.id,
        paymentDate: new Date(paypalData.create_time),
        refund: paypalData.purchase_units[0].payments.captures[0].links.find(
          (link) => link.rel === 'refund'
        )?.href || null, // Fetch refund link if available
      });

      await payment.save();

      // Enroll the student in the course
      const updateUser = await User.findById(studentId);
      if (await checkIfCourseExistInUser(updateUser, courseId)) {
        return next(new customError('You have already enrolled in this course.', 400));
      }

      updateUser.enroll = [...updateUser.enroll, courseId];
      await updateUser.save({ new: true, runValidators: true });

      // Send success response
      return res.status(200).json({
        status: 'success',
        message: 'Payment captured successfully',
        paymentDetails: paypalData,
      });
    } else {
      // Payment capture failed
      return res.status(400).json({
        status: 'error',
        message: 'Payment capture failed.',
      });
    }
  } catch (err) {
    return next(err);
  }
});
exports.getAllPayment=asyncErrorHandler(async(_,res,next)=>{
  const payments = await Payment.find({})
  .populate({
    path: 'studentId',
    options:{skipMiddleware: true}
  })  // Populates the studentId field with student data
  .populate({
    path: 'courseId',  // Populates the courseId field
    populate: {
       path: 'instructor',
       options:{skipMiddleware: true}
     }  // Nested populate for fields inside courseId, like instructorId (example)
  })
  .exec();
  empty(payments,'Server error: unable to fetch payments...',500,next);
  const instructorPayments = await InstructorPayment.find({}).populate({
    path:'instructorId',
    options:{skipMiddleware: true}
  }).populate('payments').exec()
  empty(instructorPayments,'Server error: unable to fetch instructor payments...',500,next);
  const paymentError=await PaymentError.find({}).populate('paymentId').exec();
  empty(paymentError,'Server error: unable to fetch automated payments...',500,next);
  return res.status(200).json({
      status: "success",
      data: {
          course:{
            completed: payments.filter(each=> each.status==='completed'),
            pending: payments.filter(each=> each.status==='pending'),
            failed: payments.filter(each=> each.status==='failed'),
            refunded: payments.filter(each=> each.status==='refunded')
          },
          instructor: instructorPayments,
          automated: paymentError
      }
  })
})
async function checkIfCourseExistInUser(user, courseId) {
  return user?.enroll.some(enrolledCourseId => enrolledCourseId.equals(courseId));
}