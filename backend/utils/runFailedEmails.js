const cron = require('node-cron');
const FailedEmail = require('../models/FailedEmail');
const sendEmail = require('../config/email');
const logger = require('./node_logger');

// Schedule the cron job to run every 20 minute
const scheduleFailedMails = () => {
    cron.schedule('*/20 * * * *', async () => {

    // Find all unsent emails
    const unsentEmails = await FailedEmail.find({ isSent: false });

    for (const email of unsentEmails) {
        try {
        // Retry sending the email
        await sendEmail(JSON.parse(email.option),email.type);
        // Mark the email as sent
        email.isSent = true;
        await email.save();
        } catch (error) {
            logger.error(`Failed to send email to ${email.email}:`, error);
        }
    }
    });
}
module.exports = scheduleFailedMails;
