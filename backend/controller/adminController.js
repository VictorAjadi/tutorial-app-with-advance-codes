const User = require("../models/User");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const customError = require("../utils/customError");
const { empty } = require("../utils/notFoundInModel");
const Features = require("../utils/apiFeatures");
const sendEmail = require("../config/email");
const create_jwt_token_admin = require("../utils/create_jwt_token_admin");
const otpGenerator = require('otp-generator')
const jwt = require("jsonwebtoken");
const utils=require("util");

//const PaymentError = require("../models/PaymentError");
// @post desc
exports.loginAdmins = asyncErrorHandler(async (req, res, next) => {
    res.clearCookie('auth_token');
    
    // Check if email and password are provided
    empty(req.body.email, "Please enter your email address...", 400, next);
    empty(req.body.password, "Please enter your password...", 400, next);
    
    // Confirm email and password existence
    const login_user = await User.findOne({
      email: req.body.email,
      $or: [
        { role: "admin" },
        { role: "sub-admin" }
      ]
    }).setOptions({ skipMiddleware: true }).select("+password");
  
    // Check if the user exists and the password matches
    if (!login_user || !(await login_user.comparePassword(req.body.password, login_user.password))) {
      return next(new customError("Email or Password does not exist...", 404));
    }
    // Create JWT token
    create_jwt_token_admin(res, login_user, next);
});
// @patch desc
exports.addSubAdmin=asyncErrorHandler(async(req,res,next)=>{
    const {id}=req.params;
    empty(id,"New sub-admin ID not found...",404,next);
    //find user and check if he was authenticated by google api and if he is a student
    const newAdmin = await User.findById(id).select("+role -password");
    if(newAdmin.oauthProvider!=="none"){
       return next(new customError("Can not add because user was authenticated using google api...",400));
    }
    if(newAdmin.role!=="student"){
        return next(new customError("Only a student account can be converted to sub-admin...",400))
    }
    const upgradedToAdmin=await User.updateOne({_id: newAdmin._id},{$set: {role: "sub-admin"}},{new: true, runValidators: true});
    empty(upgradedToAdmin,"An unknown error occured, unable to add this account as a sub-admin...",500,next);
    return res.status(200).json({
        status: "success",
        message: "You have successfully added this person as an admin..."
    })
})
exports.allUsers=asyncErrorHandler(async (req,res)=>{
    const query=req.query;
    //get all active users
    let feature1=new Features(User.find({role: {$ne: 'admin'}}).setOptions({skipMiddleware: true}).select("+role +suspended -password -confirm_password"),query,await User.countDocuments());
    feature1 = feature1.filter().sort().fields()/* .paginate(); */
    const users = await feature1.queryObject;
    const aggregate=await User.aggregate([
      {
        $group: {
          _id: {$dateToString: {format: '%B', date: '$createdAt'}},
          total: {$sum: 1}
        },
      },
      {
        $sort: { "_id": 1 } // Sort by month
      },
    // Calculate overall average of the total counts
      {
        $group: {
          _id: null, // No grouping by month here, just to calculate the average
          averageTotal: { $avg: "$total" }, // Calculate average of total
          allTotals: { $push: { _id: "$_id", total: "$total" } } // Preserve the original month totals
        }
      },
      // Add the averageTotal back to each month's document
      {
        $unwind: "$allTotals" // Flatten the array of allTotals
      },
      {
        $addFields: {
          month: "$allTotals._id", // Re-add the month (_id)
          total: "$allTotals.total", // Re-add the total for each month
          averageTotal: "$averageTotal" // Include the averageTotal
        }
      },
        // Optionally remove unnecessary fields
      {
        $project: {
          _id: 0, // Hide _id
          month: 1,
          total: 1,
          averageTotal: 1
        }
      }
    ])
    return res.status(200).json({
      status: "success",
      data: {
        activeUsers: users.filter(each=> each.active===true && each.suspended==false),
        inactiveUsers: users.filter(each=> each.active===false && each.suspended==false),
        suspendedUsers: users.filter(each=> each.suspended==true),
        aggregate
      }
    })
})
exports.suspendAccount = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    empty(req.user, "Admin needs to be logged in, try logging in...", 404, next);
    empty(id, "The ID provided is Invalid...", 400, next);
    const checkuser = await User.findById(id).select('+role');
    if(checkuser.role==='admin') return next(new customError('Request not granted...',401));
    if(checkuser.role==='sub-admin' && req.user.role==='sub-admin') return next(new customError('Request not granted...',401));
    // Suspend user
    const user = await User.updateOne({ _id: id }, { $set: { suspended: true } }).select('+role');
    empty(user, "The ID provided is Invalid...", 404, next);
    // Send mail for suspension
    const sendEmailWithRetry = async (options, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          await sendEmail(options, "suspend");
          break;
        } catch (error) {
          if (i === retries - 1) {
            return next(new customError("Failed to send suspend mail, due to bad network connection...", 400)); // Throw error if it's the last attempt
          }
        }
      }
    };
    await sendEmailWithRetry({
      email: user.email,
      name: user.name,
      subject: "User Account Suspended"
    });
    return res.status(200).json({
      status: "success",
      message: "This User account has been suspended..."
    });
});
exports.unSuspendAccount = asyncErrorHandler(async (req, res, next) => {
  empty(req.user, "Admin needs to be logged in, try logging in...", 404, next);
  const { id } = req.params;
  empty(id, "The ID provided is Invalid...", 400, next);
  const checkuser = await User.findById(id).select('+role');
  if(checkuser.role==='sub-admin' && req.user.role==='sub-admin') return next(new customError('Request not granted...',401));
    // Unsuspend user
    const user = await User.updateOne(
      { _id: id },
      { $set: { suspended: false } }
    ).setOptions({ skipMiddleware: true });
    empty(user, "The ID provided is Invalid...", 404, next);
    // Send mail for suspension
    const sendEmailWithRetry = async (options, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          await sendEmail(options, "unsuspend");
          break;
        } catch (error) {
          if (i === retries - 1) {
            return next(new customError("Failed to send unsuspend mail, due to bad network connection...", 400)); // Throw error if it's the last attempt
          }
        }
      }
    };
    await sendEmailWithRetry({
      email: user.email,
      name: user.name,
      subject: "User Account Removed From Suspension"
    });
    return res.status(200).json({
      status: "success",
      message: "This User account has been removed from suspended account..."
    });
});
exports.getAdmin=asyncErrorHandler(async(req,res,next)=>{
  const {id}=req.params
  empty(id,'User ID not found...',404,next)
  const user=await User.findOne({
    _id: id,
    $or: [
      { role: "admin" },
      { role: "sub-admin" }
    ]
  }).setOptions({ skipMiddleware: true }).select("+role -password");
  empty(user,'Invalid Admin or Sub-admin ID...',404,next)
  return res.status(200).json({
      status: 'success',
      data:{
          user
      }
  })
})
exports.getOTPToken=asyncErrorHandler(async(req,res,next)=>{
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
    email: req.user.email,
    name: req.user.name,
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
  res.cookie('ptoedoc', token, cookiesOption);
  return res.status(200).json({
    status: 'success',
    message: 'OTP Code has been sent to your email...'
  })
})
exports.updateAdminDetails=asyncErrorHandler(async(req,res,next)=>{
  const exclude = ["password", "coverImageId", "profileImageId","confirm_password", "role", "inactiveAt", "active", "suspended", "passwordChangedAt", "hashedResetToken", "resetTokenExpiresIn"];
  exclude.forEach(el => {
    delete req.body[el];
  });
  req.user.name = req.body.name || req.user.name;
  req.user.email = req.body.email || req.user.email;
  req.user.mobile_number = req.body.mobile_number || req.user.mobile_number;
  //req.user.profile_image = profileImage || req.user.profile_image;
  //req.user.cover_image = coverImage || req.user.cover_image;
  //req.user.profileImageId = profileImageId || req.user.profileImageId;
  //req.user.coverImageId = coverImageId || req.user.coverImageId;
  req.user.address=req.body.address || req.user.address;
  req.user.website= req.body.website || req.user.website; 
  req.user.github=req.body.github || req.user.github;
  req.user.twitter = req.body.twitter || req.user.twitter;
  req.user.facebook= req.body.facebook || req.user.facebook;
  req.user.skills= (req.body.skills && req.body.skills.trim().split(',')) || req.user.skills;
  req.user.profession= req.body.profession || req.user.profession;
  //req.user.paypal_id= req.body.paypal_id || req.user.paypal_id;
  const user = await req.user.save();
  if (!user) {
    console.log(user)
    console.log(req.user)
    return next(new customError("Invalid user ID, login and try again...", 404));
  }
  return res.status(200).json({
    status: "success",
    message: "User details update was successful, refresh page..."
  });
})
// Controller to handle admin password update after OTP verification
exports.updateAdminPassword = asyncErrorHandler(async (req, res, next) => {
  const { code } = req.query;

  // Check if the OTP code is present
  empty(code, 'OTP Code not found...', 400, next);

  // Check if all password fields are provided
  empty(req.body.password, "Please enter the new password...", 404, next);
  empty(req.body.confirm_password, "Please enter the confirm password...", 404, next);
  empty(req.body.current_password, "Please enter your current password...", 404, next);

  // Verify the OTP code
  if (!(await verifyOTP(code, req))) {
    return next(new customError('Invalid OTP Code or OTP Code has expired, try again...', 400));
  }

  // Check if password and confirm password match
  if (req.body.password !== req.body.confirm_password) {
    return next(new customError('Password and Confirm Password do not match...', 400));
  }

  // Verify current password
  const isCurrentPasswordValid = await req.user.comparePassword(req.body.current_password, req.user.password);
  if (!isCurrentPasswordValid) {
    return next(new customError("Incorrect current password, try again...", 400));
  }

  // Update the user's password and relevant fields
  req.user.password = req.body.password;
  req.user.passwordChangedAt = Date.now();
  req.user.updatedAt = Date.now();

  // Save the user data
  const user = await req.user.save();
  empty(user, "Invalid user, please login and try again...", 404, next);

  // Clear relevant cookies after the operation
  res.clearCookie('auth_token'); // Clear session authentication token
  res.clearCookie('ptoedoc'); // Clear OTP token

  // Respond with success
  return res.status(200).json({
    status: "success",
    message: "Password update was successful. Please log in with your new password.",
  });
});
// Function to verify OTP from the JWT stored in cookies
const verifyOTP = async (token, req) => {
  try {
    // Convert input token to string
    let newToken = token.toString();

    // Get the OTP JWT token from the cookies
    const ptoedoc = req.cookies.ptoedoc;
    if (!ptoedoc) {
      throw new Error('OTP token is missing or has expired');
    }

    // Verify the JWT OTP token using the secret
    const otp_token = await utils.promisify(jwt.verify)(ptoedoc, process.env.OTPSECRET);

    // Compare the OTP from the query and the stored token
    return newToken === otp_token.otp.toString(); 
  } catch (error) {
    // Handle JWT errors (expired token, invalid signature, etc.)
    return false;
  }
};
/* exports.automatedPaymentError=async()=>{
  const query=req.query;
  //get all payment error
  const paymentError=await PaymentError.find({});
  return res.status(200).json({
    status: "success",
    data: {
      paymentError
    }
  })
} */
/* exports.deleteUsers=asyncErrorHandler(async(req,res,next)=>{
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
}) */