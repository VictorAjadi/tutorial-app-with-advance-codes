const cluster = require('cluster');
const os = require('os');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const spdy = require('spdy');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1); // Exit process on uncaught exception
});

const CERT_DIR = path.resolve(__dirname, 'cert');
const useSSL = process.env.SSL === 'true'; // Ensure SSL is a string 'true' or 'false'

const app = require('./app');
const { logCachedData } = require('./config/cache');

// Function to connect to the database and configure Redis
async function connectToDB() {
    try {
        await mongoose.connect(process.env.LOCAL_MONGO_CONN);
        console.log('MongoDB connected successfully....!');
        // Log cached data for debugging
        //logCachedData();
    } catch (err) {
        console.error('Error connecting to DB or cache:', err);
        process.exit(1);
    }
}

function createServer() {
    if (!useSSL) {
        return app; // No SSL, return the app
    }

    // Ensure certificates exist for development
    if (process.env.NODE_ENV === 'development') {
        if (!fs.existsSync(path.join(CERT_DIR, 'server.key')) || !fs.existsSync(path.join(CERT_DIR, 'server.cert'))) {
            throw new Error('SSL certificates are missing. Please generate them.');
        }

        return spdy.createServer({
            key: fs.readFileSync(path.join(CERT_DIR, 'server.key')),
            cert: fs.readFileSync(path.join(CERT_DIR, 'server.cert')),
        }, app);
    }

    // Placeholder for production SSL configuration
    return spdy.createServer({}, app);
}

// Function to start the server
function startServer() {
    const server = createServer();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`App listening on port ${PORT}!`);
        console.log(`SSL ${useSSL ? 'enabled' : 'disabled'}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
        console.error('Unhandled Rejection:', err);
        process.exit(1); // Exit on unhandled rejection
    });
}

// Check if this process is the master
if (cluster.isMaster) {
    const numCPUs = os.cpus().length; // Get the number of available CPU cores
    console.log(`Master ${process.pid} is running`);
    console.log(`Forking ${numCPUs} workers...`);

    // Fork workers for each available CPU core
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // If a worker dies, log it and fork a new worker
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        console.log('Forking a new worker...');
        cluster.fork();
    });
} else {
    // Worker processes run the app server
    connectToDB().then(startServer);
    console.log(`Worker ${process.pid} started`);
}

//How your config.env should look like 
/*
NODE_ENV=development
JWT_EXPIRES_IN=24h
PORT=5050
RESET_TOKEN_EXPIRES_IN=5 
LOCAL_MONGO_CONN=mongodb://localhost:27017/devon replace to global or local 
NODEMAILER_EMAIL=
NODEMAILER_PASS=generate from a business account
SERVICE=gmail
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
JWT_SECRET=base64 string preferrably
SECRET_KEY=base64 string preferrably
CLIENT_SECRET=for google api
CLIENT_ID= for google api
SESSION_KEY=base64 string preferrably
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
CACHE_ENGINE = redis
REDIS_HOST=localhost
REDIS_PORT=6379 using 6379 as default
REDIS_PASSWORD=
ISHARE=0.7
CSHARE=0.3
OTPTIME=2
OTPSECRET=base64 string preferrably

*/