// queue.js
const Bull = require('bull');
const Redis = require('ioredis');
const logger = require("../utils/node_logger");
const sendEmail = require('../config/email');
// Create a Redis client for Bull
const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
  //password: process.env.REDIS_PASSWORD, // Include if using authenticated Redis
});

// Create Bull queues for sending emails
const emailQueue = new Bull('emailQueue', {
  redis: redisClient,
});

// Process jobs in the email queue
emailQueue.process(async (job) => {
  const { option, type } = job.data;
  try {
    // Send the email using the provided options and type
    await sendEmail(option, type);
    logger.info(`Email of type ${type} sent to ${option.email}`);
  } catch (error) {
    logger.error(`Failed to send email: ${error}`);
    throw new Error('Email sending failed');
  }
});

// Handle failed jobs
emailQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed: ${err.message}`);
});

// Function to add email jobs to the queue
const sendEmailToQueue = async (emailOptions, type) => {
  await emailQueue.add({ option: emailOptions, type });
};

module.exports = { sendEmailToQueue };

