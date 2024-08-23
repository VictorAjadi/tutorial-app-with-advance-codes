const Report = require("../models/Report");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const customError = require("../utils/customError");
const { empty } = require("../utils/notFoundInModel");

exports.addReport=asyncErrorHandler(async(req,res,next)=>{
    empty(req.user,"You have to login before you can rate this course...",404,next);
    const {courseId}=req.params;
    empty(courseId,"Provide valid ID to the course you want to rate...",404,next);
    const student=req.user;
    //if student already send a report on this course do not send again
    const checkReport=await Report.findOne({to: courseId})
    if(checkReport) return next(new customError("Report sent recently, The workers are currently working on it."))
    const report=await Report.create({text: req.body.text, from: student._id,to: courseId});
    empty(report,"Server error unable to send report, Pls try again later...",500,next);
    return res.status(200).json({
        status: "success",
        message: "Your report has been sent..."
    })
})
exports.attendedToReport=asyncErrorHandler(async(req,res,next)=>{
    empty(req.user,"Only Admins or Sub Admin can access this route...",404,next);
    const {reportId}=req.params;
    empty(reportId,"Invalid report ID...",404,next);
    const newDate=Date.now();
    const updatedReport=await Report.findByIdAndUpdate(reportId,{attendToAt: newDate, active: false},{new: true, runValidators: true});
    empty(updatedReport,"Action not completed, Server error...",500,next);
    return res.status(200).json({
        status: "success",
        message: "You have attended to this report..."
    })
})
exports.deleteReport=asyncErrorHandler(async(req,res,next)=>{
    empty(req.user,"Only Admins or Sub Admin can access this route...",404,next);
    const {reportId}=req.params;
    empty(reportId,"Invalid report ID...",404,next);
    await Report.findByIdAndDelete(reportId);
    return res.status(200).json({
        status: "success",
        message: "Report has successfully been deleted..."
    })
})
