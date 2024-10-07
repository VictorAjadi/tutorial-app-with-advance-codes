const pino = require('pino');
const fs = require('fs');
const path = require('path');

// Ensure the logs directory exists
const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Basic Pino logger setup with file writing
const logger = pino({
  level: 'info', // Set logging level to 'info'
  transport: {
    targets: [
      {
        target: 'pino-pretty', // Pretty printing for easier reading
        options: {
          colorize: true,
          translateTime: 'SYS:standard', // Show time in standard format
        },
        level: 'info',
      },
      {
        target: 'pino/file', // File transport
        options: {
          destination: path.join(logDirectory, 'app.log'), // Path to the log file
        },
        level: 'info',
      },
    ],
  },
});

module.exports = logger;
