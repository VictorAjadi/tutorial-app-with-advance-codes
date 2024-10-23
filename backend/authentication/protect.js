const jwt = require("jsonwebtoken");
const customError = require("../utils/customError");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const utils=require("util");
const User = require("../models/User");
const { empty } = require("../utils/notFoundInModel");
const { decryptRole } = require("../utils/hashRole");

exports.protectRoutes=asyncErrorHandler(async (req,res,next)=>{
  const auth_token=req.headers.authorization
  if(!auth_token || !auth_token.startsWith("Bearer")) return next(new customError("You don't seem to have a session token, either login or sign up..."), 404);
  let token = auth_token.split(" ")[1];
  const decoded_token= await utils.promisify(jwt.verify)(token, process.env.JWT_SECRET);
  empty(decoded_token, "Invalid or expired session token, go back to login...",401,next);
  const user=await User.findOne({_id: decoded_token.id, active: true})
                        .setOptions({skipMiddleware: true})
                        .select("+password +role +coverImageId +profileImageId");
  
  if(!user){
    return next(new customError("The user does nor exist, invalid user ID...",401))
  }
  //check if user has changed password after session token has been issued
  if((await user.isPasswordChanged(decoded_token.iat))) return next(new customError("Password as been changed recently, try logging in again...",401));
  req.user=user;
  next()
})
exports.protectInstructor=asyncErrorHandler(async(req,res,next)=>{
  const {role}=req.user;
  if(role !== "instructor"){
    return next(new customError("This route is only available to instructors...",401))
  }
  next()
})
exports.protectAdmins=asyncErrorHandler(async(req,res,next)=>{
  const {role,hashRole}=req.user;
  const decryptedRole=await decryptedRole(hashRole)
  if(decryptedRole === "admin" || decryptedRole==="sub-admin"){
    if(role === "admin" || role==="sub-admin"){
      return next()
    }
  }
  return next(new customError("This route is only available to admins and sub-admins...",401))
})
exports.protectOnlyAdmin=asyncErrorHandler(async(req,res,next)=>{
  const {role,hashRole}=req.user;
  const decryptedRole=await decryptRole(hashRole)
  if(decryptedRole === "admin"){
    if(role === "admin"){
      return next()
    }
  }
  return next(new customError("This route is only available to admin...",401))
})