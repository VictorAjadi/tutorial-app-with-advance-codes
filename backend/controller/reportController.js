const path = require("path");
const Course = require("../models/Course");
const Report = require("../models/Report");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const customError = require("../utils/customError");
const { empty } = require("../utils/notFoundInModel");
const sendEmail = require("../config/email");
const { default: mongoose } = require("mongoose");

exports.allReport=asyncErrorHandler(async(req,res,next)=>{
    //empty(req.user,"Only Admins or Sub Admin can access this route...",404,next);
    const report = await Report.find({}).setOptions({skipMiddleware: true}).populate({
      path: 'from',
      options:{skipMiddleware: true}
    }).populate({
        path: 'to',
        populate:{
            path: 'instructor',
            options:{skipMiddleware: true}
        }
    }).exec()
    empty(report,'Server error: unable to fetch report...',500,next);
    return res.status(200).json({
        status: "success",
        data: {
            attendedTo: report.filter(each=> each.active===false),
            notAttendedTo: report.filter(each=> each.active===true)
        }
    })
})
exports.addReport=asyncErrorHandler(async(req,res,next)=>{
    empty(req.user,"You have to login before you can rate this course...",404,next);
    const {courseId}=req.params;
    empty(courseId,"Provide valid ID to the course you want to rate...",404,next);
    const verifiedCourse=await Course.findById(courseId);
    //verify existence of course
    if(!verifiedCourse) return next(new customError("This course is not Valid, Report can't be made...",400))
    const student=req.user;
    //if student already send a report on this course do not send again
    const checkReport=await Report.findOne({to: courseId})
    if(checkReport) return next(new customError("Report sent recently, The workers are currently working on it.",400))
    const report=await Report.create({text: req.body.text, from: student._id,to: courseId});
    empty(report,"Server error unable to send report, Pls try again later...",500,next);
    return res.status(200).json({
        status: "success",
        message: "Your report has been sent..."
    })
})
exports.attendedToReport = asyncErrorHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    let isReplicaSet = false;
  
    // Check if the MongoDB instance supports transactions (replica set)
    try {
      await mongoose.connection.db.admin().command({ replSetGetStatus: 1 });
      isReplicaSet = true;
    } catch (err) {
      console.warn("MongoDB is not running as a replica set, skipping transaction.");
    }
  
    const transactionOptions = {
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' },
    };
  
    try {
      if (isReplicaSet) {
        await session.withTransaction(async () => {
          await processReportUpdate(req, res, next, session); // Pass session in case of replica set
        }, transactionOptions);
      } else {
        // Directly process report update without transaction in standalone mode
        await processReportUpdate(req, res, next);
      }
    } catch (error) {
      return next(error);
    } finally {
      await session.endSession();
    }
  });
  
  // Process report update logic (with or without session)
  async function processReportUpdate(req, res, next, session = null) {
    try {
      empty(req.user, "Only Admins or Sub Admin can access this route...", 404, next);
      const { reportId } = req.params;
      empty(reportId, "Invalid report ID...", 404, next);
      empty(req.body.text, "Invalid report text...", 404, next);
      const newDate = Date.now();
  
      // Update the report (conditionally use session)
      const updatedReport = await Report.findByIdAndUpdate(
        reportId,
        { attendToAt: newDate, active: false },
        { new: true, runValidators: true, session }
      ).populate({ path: 'from' }).populate('to');
  
      empty(updatedReport, "Action not completed, Server error...", 500, next);
  
      // Send email
      await sendEmailWithRetry({
        email: updatedReport.from.email,
        name: updatedReport.from.name,
        title: updatedReport.to.title,
        message: req.body.text,
        subject: "Attended Report On Course",
      });
  
      return res.status(200).json({
        status: "success",
        message: "You have attended to this report...",
      });
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      return next(error);
    }
  }
  // Email retry logic
  const sendEmailWithRetry = async (options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        await sendEmail(options, "report");
      } catch (error) {
        if (i === retries - 1) {
          return res.status(400).json({
            status: 'error',
            message: "Failed to send email due to bad network connection...",
          });
        }
      }
    }
  };
  
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
