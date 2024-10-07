const sendEmail = require("../config/email");
const Payment = require("../models/Payment");
const Rating = require("../models/Rating");
const Report = require("../models/Report");
const User = require("../models/User");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const create_jwt_token = require("../utils/create_jwt_token");
const customError = require("../utils/customError");
const { deleteCourseToDepth } = require("../utils/globalDeleting");
const { empty } = require("../utils/notFoundInModel")
const crypto=require("crypto")
const otpGenerator = require('otp-generator')
const jwt = require("jsonwebtoken");
const utils=require("util");
exports.getUserWithId=asyncErrorHandler(async(req,res,next)=>{
  const {id}=req.params
  if(!id){
    return next(new customError('User ID must be provide to access this route.',404))
  }
  const user=await User.findById(id).populate("enroll").select("+role +paypal_id +paymentProvider").exec();
  if(!user){
    return next(new customError('This User is unavalable, retry some other time.',404))
  }
/*   create_jwt_token(res,user,200);
 */
  user.password=undefined;
  return res.status(200).json({
    status: "success",
    data:{
        user
    }
  })
})
exports.createUser=asyncErrorHandler(async(req,res,next)=>{
 const newUser = await User.create(req.body);
 empty(newUser, "Error occurred while creating document...",400,next);
        // Function to attempt email sending with retry mechanism
        const sendEmailWithRetry = async (options, retries = 3) => {
          for (let i = 0; i < retries; i++) {
              try {
                  await sendEmail(options, "register");
                  create_jwt_token(res,newUser,201,next);
                } catch (error) {
                  if (i === retries - 1) {
                    await User.findOneAndDelete({email: req.body.email,_id: newUser._id});
                    return next(new customError("Failed to sign up user, due to bad network connection...",400)); // Throw error if it's the last attempt
                  }
              }
          }
      };

      // Attempt to send email with 3 retries
      await sendEmailWithRetry({
          email: newUser.email,
          name: newUser.name,
          subject: "User registered successfully"
      });
})
exports.createInstructor=asyncErrorHandler(async(req,res,next)=>{
  const newUser = await User.create({...req.body, role: "instructor"});
  empty(newUser, "Error occurred while creating document...",400,next);
         // Function to attempt email sending with retry mechanism
         const sendEmailWithRetry = async (options, retries = 3) => {
           for (let i = 0; i < retries; i++) {
               try {
                   await sendEmail(options, "register");
                   create_jwt_token(res,newUser,201,next);
               } catch (error) {
                if (i === retries - 1) {
                  await User.findOneAndDelete({email: req.body.email,_id: newUser._id});
                  return next(new customError("Failed to sign up user, due to bad network connection...",400)); // Throw error if it's the last attempt
                }
             }
           }
       };
 
       // Attempt to send email with 3 retries
       await sendEmailWithRetry({
           email: newUser.email,
           name: newUser.name,
           subject: "Instructor registered successfully"
       });
})
exports.loginUser=asyncErrorHandler(async(req,res,next)=>{
    res.clearCookie('auth_token');
    empty(req.body.email,"Please enter your email address...",400,next)
    empty(req.body.password,"Please enter your password...",400,next)
    //confirm email and password existence
    const login_user=await User.findOne({email: req.body.email}).select("+password");
    if(!login_user || !(await login_user.comparePassword(req.body.password, login_user.password))) return next(new customError("Email or Password does not exist...",404));
    create_jwt_token(res,login_user,200,next);
});
exports.forgot_password_reset_token=asyncErrorHandler(async(req,res,next)=>{
  empty(req.body.email,"Please enter the email field...",401,next);
  let user = await User.findOne({email: req.body.email});
  empty(user, `User with ${req.body.email} email address can not be found...`, 400,next);
  if(user.oauthProvider!=='none') return next(new customError("Service not provided for this user, you must have been authenticated via social media links...",401))
  const reset_token=await user.createResetToken();
  user = await user.save({validateBeforeSave: false});
  const resetUrl= `${req.protocol}://${req.get('host')}/resetPassword/${reset_token}`
  try{
      //send mail now
    await sendEmail({
      email: user.email,
      name: user.name,
      url: resetUrl,
      subject: "password reset link"
    },"reset")
   //successful email
   return res.status(200).json({
    status: 'success',
    message : 'Check your email for password reset link...'
   })
  }catch(error){
    user.hashedResetToken=undefined;
    user.resetTokenExpiresIn=undefined;
    return next(new customError('An error occurred while sending reset link...',500))
  }
});
exports.reset_password=asyncErrorHandler(async(req,res,next)=>{
  empty(req.body.password,"Please enter the password field...",404,next);
  empty(req.body.confirm_password,"Please enter the confirm password field...",404,next);
   const reset_token=req.params.token;
   empty(reset_token,"Error occurred while identifying reset token...",404,next);
   const token = crypto.createHash('sha256').update(reset_token).digest('hex');
   const user =await User.findOne({hashedResetToken: token}).select("+password");
   if(!user || (await user.isResetTokenExpired(user.resetTokenExpiresIn))){
    return next(new customError("Your password reset link or token has expired...",400));
   }
   user.passwordChangedAt=Date.now();
   user.password=req.body.password;
   user.confirm_password=req.body.confirm_password;
   user.resetTokenExpiresIn=undefined;
   user.hashedResetToken=undefined;
   user.updatedAt=Date.now();
   await user.save();
   res.clearCookie('auth_token');
   return res.status(200).json({
    status: "success",
    message: "Password reset was successful, login with new password..."
   })
})
exports.updatePassword=asyncErrorHandler(async(req,res,next)=>{
  empty(req.user,"User not logged in, try logging in...",404,next);
  const id=req.user._id;
  empty(id,"User not logged in, login and try again...",404,next);
  empty(req.body.password,"Please enter the password field...",404,next);
  empty(req.body.confirm_password,"Please enter the confirm password field...",404,next);
  empty(req.body.current_password,"Please enter the current password field...",404,next);
  if(req.user.oauthProvider!=='none') return next(new customError("Service not provided for this user, you must have been authenticated via social media links...",401))
  if(!(await req.user.comparePassword(req.body.current_password, req.user.password))) return next(new customError("Incorrect user password, try again..."));
  req.user.passwordChangedAt=Date.now();
  req.user.password=req.body.password;
  req.user.confirm_password=req.body.confirm_password;
  req.user.updatedAt=Date.now();
  const user=await req.user.save();
  empty(user,"Invalid user ID, login and try again...",404,next);
  res.clearCookie('auth_token');
  return res.status(200).json({
    status: "success",
    message: "Password update was successful, re-enter new password..."
  })
})
exports.deactivateUser=asyncErrorHandler(async(req,res,next)=>{
  const id=req.user._id;
  empty(req.user,"User not logged in, try logging in...",404,next);
  empty(id,"User not logged in, login and try again...",404,next);
  const user = await User.updateOne({_id: id},{$set: {inactiveAt: Date.now(),active: false}})
   empty(user,"Invalid user ID, login and try again...",404,next);
   res.clearCookie('auth_token');
   return res.status(200).json({
    status: "success",
    message: "User account deactivated..."
  })
})
exports.deleteUser=asyncErrorHandler(async(req,res,next)=>{
  const id=req.user._id;
  empty(req.user,"User not logged in, try logging in...",404,next);
  empty(id,"User not logged in, login and try again...",404,next);
  //delete all courses user created
  deleteCourseToDepth(id,next);
  //delete rating user created
  await Rating.deleteMany({student: req.user._id});
  //delete report user created
  await Report.deleteMany({from: req.user._id});
  //delete payment made by user
  await Payment.deleteMany({studentId: req.user._id});
  // Attempt to delete the user
  const deletedUser = await User.findByIdAndDelete(id);
  // If user was not found in the database
  if (!deletedUser) {
    return next(new customError("User not found", 404));
  }
  res.clearCookie('auth_token');
  return res.status(200).json({
    status: "success",
    message: "User account deleted..."
  })
})
exports.getReactivateOTPToken=asyncErrorHandler(async(req,res,next)=>{
  //check email
  empty(req.query.email,'Please enter your email address...',400,next);
  const user = await User.findOne({ email: req.query.email, active: false }).setOptions({ skipMiddleware: true }).select("+active +password");
  empty(user,'User with this email address can not be found or still active...',404,next);
  const otpToken = await otpGenerator.generate(7, {digits: true, upperCaseAlphabets: true, specialChars: false });
  empty(otpToken,'An error occurred while generating OTP...',500,next);
  //send mail
  const sendEmailWithRetry = async (options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        await sendEmail(options, "otp");
        break;
      } catch (error) {
        if (i === retries - 1) {
          return next(new customError("Failed to send OTP Code to mail, due to bad network connection...", 400)); // Throw error if it's the last attempt
        }
      }
    }
  };
  await sendEmailWithRetry({
    email: req.query.email,
    name: user.name,
    otp: otpToken,
    validDuration: process.env.OTPTIME,
    subject: "OTP Verification Code"
  });
  //create token time
  const token = jwt.sign(
      { otp: otpToken },
      process.env.OTPSECRET,
      { expiresIn: (process.env.OTPTIME * 60 * 1000) }
  );
  const expiresInMs = process.env.OTPTIME * 60 * 1000;
  const cookiesOption = {
      maxAge: expiresInMs,
      httpOnly: true,
      signed: false, // Ensure this is set to false
      secure: process.env.NODE_ENV === 'production' // Use secure cookies in production
  };
  res.cookie('ptoedocresu', token, cookiesOption);
  return res.status(200).json({
    status: 'success',
    message: 'OTP Code has been sent to your email...'
  })
})
exports.reactivateUser = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const { code } = req.query;

  // Check if the OTP code is present
  empty(code, 'OTP Code not found...', 400, next);

  // Check if email and password are provided
  empty(email, "Please enter your email address...", 404, next);
  empty(password, "Please enter your password...", 404, next);

  // Verify the OTP code
  if (!(await verifyOTP(code, req))) {
    return next(new customError('Invalid OTP Code or OTP Code has expired, try again...', 400));
  }

  // Use findOne with {active: false} to find an inactive user
  const user = await User.findOne(
    { email: email, active: false }
  ).setOptions({skipMiddleware: true}).select("+active +password +oauthProvider"); // Include oauthProvider in the select

  // If no user is found or already active, send an error
  empty(user, "User not found or already active...", 404, next);

  if(user.oauthProvider === 'none') {
    // Check if the provided password matches the stored hash
    if (!(await user.comparePassword(password, user.password))) {
      return next(new customError("Incorrect user password...", 404));
    }
  }

// Activate the user
user.set({
  active: true,
  updatedAt: Date.now()
});

// Save the user without running validators for the password field
await user.save({ validateModifiedOnly: true });

  // If password matches, clear any authentication tokens (if necessary)
  res.clearCookie('auth_token');
  res.clearCookie('ptoedocresu'); // Clear OTP token

  // Respond with a success message
  return res.status(200).json({
    status: 'success',
    message: 'User account reactivated successfully, try logging in...'
  });
});
const verifyOTP = async (token, req) => {
  try {
    // Convert input token to string
    let newToken = token.toString();

    // Get the OTP JWT token from the cookies
    const ptoedocresu = req.cookies.ptoedocresu;
    if (!ptoedocresu) {
      throw new Error('OTP token is missing or has expired');
    }

    // Verify the JWT OTP token using the secret
    const otp_token = await utils.promisify(jwt.verify)(ptoedocresu, process.env.OTPSECRET);

    // Compare the OTP from the query and the stored token
    return newToken === otp_token.otp.toString(); 
  } catch (error) {
    // Handle JWT errors (expired token, invalid signature, etc.)
    return false;
  }
};
