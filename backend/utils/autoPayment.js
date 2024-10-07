const mongoose = require('mongoose');
const InstructorPayment = require('../models/InstructorPayment');
const Payment = require('../models/Payment');
const PaymentError = require('../models/PaymentError');
const cron = require('node-cron');
const Redis = require('ioredis');
const { sendEmailToQueue } = require('./mailQueue');
const logger = require('./node_logger');
const redis = new Redis();
const paypalClient = require('../utils/paypalClient');

const LOCK_KEY = 'instructor_payment_lock';
const LAST_PAYMENT_DATE_KEY = 'last_payment_date'; // Key for storing last payment date
const LOCK_TIMEOUT = 60 * 1000; // Lock timeout in milliseconds

const payInstructors = async () => {
  const lock = await redis.set(LOCK_KEY, 'locked', 'PX', LOCK_TIMEOUT, 'NX');
  if (!lock) {
    logger.warn('Another instance is already processing payments.');
    return;
  }

  try {
    const lastPaymentDate = await redis.get(LAST_PAYMENT_DATE_KEY);
    const currentDate = new Date();
    const lastPayment = lastPaymentDate ? new Date(lastPaymentDate) : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const query = {
      status: 'completed',
      paymentDate: { $gt: lastPayment },
      paidInstructor: false
    };

    const payments = await Payment.find(query).populate({
      path: 'courseId',
      select: 'instructor',
      populate: {
        path: 'instructor',
        select: '+paypal_id +paymentProvider +email',
      },
    });

    let instructorPaymentsMap = new Map();
    let failedPayments = [];

    for (const payment of payments) {
      const instructor = payment.courseId.instructor;
      const currency = payment.currency;

      if (!instructorPaymentsMap.has(instructor._id)) {
        instructorPaymentsMap.set(instructor._id, {
          totalAmount: 0,
          payments: [],
          paypal_id: instructor.paypal_id,
          paymentProvider: instructor.paymentProvider,
          currency: currency,
          _id: instructor._id,
          email: instructor.email
        });
      }

      instructorPaymentsMap.get(instructor._id).totalAmount += payment.amount;
      instructorPaymentsMap.get(instructor._id).payments.push(payment);
    }

    for (const [instructorId, { totalAmount, payments, paypal_id, paymentProvider, currency, _id, email }] of instructorPaymentsMap.entries()) {
      try {
        const instructorShare = totalAmount * process.env.ISHARE;
        const companyShare = totalAmount * process.env.CSHARE;

        const paymentResult = await makePayPalTransfer({
          instructorPayPalId: paypal_id,
          currency,
          amount: instructorShare,
          paymentProvider,
        });

        if (!paymentResult.success) {
          throw new Error(`PayPal transfer failed for instructor with _id = ${_id}`);
        }

        const instructorPayment = new InstructorPayment({
          instructorId: _id,
          totalAmount,
          instructorShare: instructorShare,
          payments: payments.map(payment => payment._id),
          companyShare: companyShare,
          paymentDate: currentDate,
          details: paymentResult.details,
        });
        await instructorPayment.save();

        await Payment.updateMany({ _id: { $in: payments.map(payment => payment._id) }}, { $set: { paidInstructor: true, paidInstructorDate: currentDate } });

        await sendEmailToQueue({
          email: email,
          subject: 'Monthly Salary Payment',
          body: `Your salary payment of ${instructorShare} ${currency} has been processed successfully.`,
        }, 'payment');

      } catch (error) {
        logger.error(`Failed to process payment for instructor ${instructorId}: `, error);
        failedPayments.push({
          instructorId: _id,
          totalAmount,
          payments: payments.map(payment => payment._id),
          instructorPayPalId: paypal_id,
          paymentProvider: paymentProvider || 'paypal',
          currency,
          email,
        });

        await PaymentError.create({
          errorType: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
    }

    await retryFailedPayments(failedPayments);
    await redis.set(LAST_PAYMENT_DATE_KEY, currentDate.toISOString());

  } catch (error) {
    logger.error(`Error in processing payments: ${error}`);
    await PaymentError.create({
      errorType: error.name,
      message: error.message,
      stack: error.stack,
    });
  } finally {
    await redis.del(LOCK_KEY);
  }
};

const makePayPalTransfer = async ({ instructorPayPalId, currency, amount, paymentProvider }) => {
  if (paymentProvider !== 'paypal') {
    throw new Error('Currently, only PayPal payments are supported.');
  }

  if (!currency) {
    throw new Error(`Instructor with PayPal ID: ${instructorPayPalId} does not have currency information.`);
  }

  const payoutData = {
    sender_batch_header: {
      sender_batch_id: `batch_${new Date().getTime()}`,
      email_subject: 'You have a payment',
      email_message: 'You have received a payment from us! Devon instructor salary',
    },
    items: [{
      recipient_type: 'PAYPAL_ID',
      receiver: instructorPayPalId,
      amount: {
        value: parseFloat(amount).toFixed(2),
        currency: currency,
      },
      note: 'Thanks for your work!',
      sender_item_id: `item_${new Date().getTime()}`,
    }],
  };

  try {
    const response = await paypalClient.paypalRequest('/v1/payments/payouts', 'POST', payoutData);

    if (response.batch_header.batch_status === 'PENDING') {
      return { success: true, batchId: response.batch_header.payout_batch_id, details: response };
    } else {
      return { success: false, error: response };
    }
  } catch (error) {
    logger.error(`Error making PayPal payout: ${error}`);
    return { success: false, error };
  }
};

const retryFailedPayments = async (failedPayments) => {
  for (const { instructorId, totalAmount, payments, instructorPayPalId, paymentProvider, currency, email } of failedPayments) {
    try {
      const instructorShare = totalAmount * process.env.ISHARE;
      const companyShare = totalAmount * process.env.CSHARE;
      const paymentResult = await makePayPalTransfer({
        instructorPayPalId,
        amount: instructorShare,
        currency,
        paymentProvider: paymentProvider || 'paypal',
      });

      if (!paymentResult.success) {
        throw new Error('PayPal transfer retry failed');
      }
      const instructorPayment = new InstructorPayment({
        instructorId,
        totalAmount,
        instructorShare,
        payments: payments.map(payment => payment._id),
        companyShare: companyShare,
        paymentDate: new Date(),
        details: paymentResult.details,
      });
      await instructorPayment.save();
      await Payment.updateMany({ _id: { $in: payments.map(payment => payment._id) }}, { $set: { paidInstructor: true, paidInstructorDate: currentDate } });
      await sendEmailToQueue({
        email,
        subject: 'Retry: Monthly Salary Payment',
        body: `Your retry salary payment of ${instructorShare} ${currency} has been processed successfully.`,
      },'payment');

    } catch (error) {
      logger.error(`Retry failed for instructor ${instructorId}: ${error}`);
    }
  }
};

const schedulePaymentJob = () => {
  if(process.env.NODE_ENV==='development'){
    cron.schedule('*/20 * * * *', () => {
      payInstructors()
        .then(() => logger.info('Scheduled payment job ran successfully.'))
        .catch(error => logger.error(`Failed to run scheduled payment job: ${error}`));
    });
  }else{
    cron.schedule('0 0 28-31 * *', () => {
      if (isLastDayOfMonth()) {
        payInstructors()
          .then(() => logger.info('Scheduled payment job ran successfully.'))
          .catch(error => logger.error(`Failed to run scheduled payment job: ${error}`));
      } else {
        logger.info('Not the last day of the month, skipping payment job.');
      }
    });
  }
}
// Helper function to check if today is the last day of the month
const isLastDayOfMonth = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return tomorrow.getDate() === 1;
};

module.exports = { schedulePaymentJob };
