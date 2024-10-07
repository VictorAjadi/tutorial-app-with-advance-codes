const express = require('express');
const rateLimiter = require("express-rate-limit");
const mongoSanitizer = require("express-mongo-sanitize");
const helmet = require("helmet");
const hpp = require("hpp");
const xssFilters = require("xss-filters");
const path = require('path');
const cookieParser = require('cookie-parser');
const userRouter = require("./routes/user_route");
const tutorialRoute = require("./routes/tutorial_route");
const globalErrorController = require("./controller/errorController");
const morgan = require("morgan");
const cors = require("cors");
const customError = require('./utils/customError');
const { protectRoutes } = require('./authentication/protect');
const session=require("express-session");
const passport=require("passport");
const { generateSignaturedUrl } = require('./utils/generateSignaturedUrl');
const { videoStreamSignaturedUrl } = require('./utils/streamFromSignedUrl');
const { sendContactMail } = require('./utils/contactMailing');
const { secureHelmet } = require('./utils/helmetSecurity');
const compression = require('compression');
const { schedulePaymentJob } = require('./utils/autoPayment');
const flash=require('connect-flash')
//const User = require('./models/User');
const { default: mongoose } = require('mongoose');

//passport config
const app = express();

// Middleware to parse cookies
app.use(cookieParser()); 

  
// Enable express middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded bodies (form submissions)
//passport config for express session
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { 
       secure: process.env.NODE_ENV === 'production',  
       maxAge: parseInt(process.env.JWT_EXPIRES_IN.split('h')[0], 10) * 3600 * 1000
    }
}));
app.use(flash());
app.use((req,res,next)=>{
    res.locals.success_msg=req.flash('success')
    res.locals.error_msg=req.flash('error')
    next();
})
app.use(passport.initialize());
app.use(passport.session()); 
require("./config/passport");

// Security measures and security policies mimicking https secure headers
// Adjust your Content Security Policy settings
app.use(helmet(secureHelmet));
app.use(hpp());
app.use(mongoSanitizer()); // Sanitize request body

const sanitizeInput = (req, res, next) => {
    req.params = sanitizeObject(req.params);
    req.query = sanitizeObject(req.query);
    req.body = sanitizeObject(req.body);
    next();
};
//sanitize inputs from users, sort of security measures
const sanitizeObject = (obj) => {
    const sanitizedObj = {};
    for (const key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) {
            sanitizedObj[key] = xssFilters.inHTMLData(obj[key]);
        }
    }
    return sanitizedObj;
};

app.use(sanitizeInput); // Apply the middleware to all routes
app.use(compression());
//************update all schema******************** */
 app.use(async(req,res,next)=>{
/*     await Payment.updateMany({},{$set: {paidInstructorDate: undefined,paidInstructor: false}});
    console.log('update done') */
/*     await User.create({
         name: 'Admin Victor',
         password: 'samsungs25ultra@',
         email: 'devonadmin@gmail.com'
    }) */
    next();
}) 

const limiter = rateLimiter({
    max: 1500, //maximum of 1000 request from an app to my api
    windowMs: 60 * 60 * 1000, // 1 hour
    handler: (req,res)=>{
        res.status(429).send({
          status: "fail",
          message: 'Too many requests from this IP, try again later in about 1 hour.'
        })
      }
});
const limiterForLogin = rateLimiter({
    max: 5, //maximum of 1000 request from an app to my api
    windowMs: 60 * 60 * 1000, // 1 hour
    handler: (req,res)=>{
      res.status(429).send({
        status: "fail",
        message: 'You have tried logging in too may times, try again after an hour.'
      })
    }
});
app.use('/api/user/login', limiterForLogin);
app.use('/api/admin/login', limiterForLogin);
app.use('/api*', limiter);


if (process.env.NODE_ENV === "development") {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:5050'];
    app.use(cors({
        origin: function (origin, callback) {
            if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    app.use(morgan("dev"));
}else{
    app.use(cors())
}
mongoose.connection.on('connected', () => {
    console.log('MongoDB is ready, starting payment job.');
    schedulePaymentJob(); // Start the cron job once MongoDB is connected
  });
  
mongoose.connection.on('error', (err) => {
console.error('MongoDB connection error:', err);
});
//**** route middle-wares *****
app.use("/auth", require("./routes/passportRoute")); // passport router middleware
app.use("/rating", require("./routes/ratingsRoute")); // rating router middleware
app.use("/report", require("./routes/reportRoute")); // report router middleware
app.use("/api/admin", require("./routes/adminRoute")); // admin router middleware
app.use("/api/user", userRouter); // User router middleware
app.use("/api/tutorial", tutorialRoute); // tutorial router middleware
app.use("/api/payments", require('./routes/paymentRoute')); // payments router middleware
//get user session token for login
app.get("/token", (async (req, res, next) => {
try{
    const token = req.cookies.auth_token;
    if(!token){
        return res.status(400).send({
            status: 'error',
            message: "You can not access this page, you have to login or signup"
        });
    }
    return res.status(200).json({
        status: "success",
        data: {
            token: token
        }
    });
}catch(error){
 next(error)
}
}));
app.get('/flash-messages',(req,res)=>{
    const error_msg=req.flash('error');
    console.log(error_msg)
    res.json({error_msg: error_msg[0]})
})
//payment cancel route
app.get("/payment-cancel/:courseId",(req,res)=>{
     res.redirect(`/courses/details/${req.params.courseId}`);
})
//******generate signature url */
app.post("/url/signed",protectRoutes, generateSignaturedUrl);

// Route to handle signed URL and stream video
app.get("/authenticated/videoUrl", videoStreamSignaturedUrl);

//send message to the company email address from contact.
app.post("/message", sendContactMail);

//route to log users out
app.get("/logout", (req, res, next) => {
    // Clear the token cookie
    res.clearCookie('auth_token');
    return res.status(200).json({
        status: "success",
        message: "Logged out successfully..."
    });
});

// Serve React app
app.use(express.static(path.join(__dirname, "./../dist")));
// Serve static files from React build file
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, "./../dist", "index.html"));
});

// Handle invalid routes
app.all("*", (req, res, next) => {
    next(new customError(`Can't find this page or route ${req.originalUrl}`, 400));
});
//middle-ware to handle all errors
app.use(globalErrorController);

module.exports = app;
