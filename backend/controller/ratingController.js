const Course = require("../models/Course");
const Rating = require("../models/Rating");
const User = require("../models/User");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const customError = require("../utils/customError");
const { empty } = require("../utils/notFoundInModel");

exports.addRating=asyncErrorHandler(async(req,res,next)=>{
    empty(req.user,"You have to login before you can rate this course...",404,next);
    const {courseId}=req.params;
    empty(courseId,"Provide valid ID to the course you want to rate...",404,next);
    const getCourse=await Course.findById(courseId);
    empty(getCourse,"Provide valid ID to the course you want to rate...",404,next);
    const student=req.user;
    //check if this student has rated this course before
    const checkRating=await Rating.findOne({student: student._id,course: courseId});
    if(checkRating) return next(new customError("You have recently rated this course..."))
    const rating=await Rating.create({...req.body, student: student._id,course: getCourse._id});
    empty(rating,"Server Error, Unable to send rating...",500,next);
    return res.status(200).json({
        status: "success",
        message: "Your rating has been sent..."
    })
})
exports.editRating=asyncErrorHandler(async(req,res,next)=>{
    empty(req.user,"You have to login before you can rate this course...",404,next);
    const {ratingId}=req.params;
    //empty(courseId,"Provide valid ID to the course you want to rate...",404,next);
    empty(ratingId,"Invalid rating ID...",404,next);
    let rating=await Rating.findById(ratingId).populate("student").exec();
    empty(rating,"Rating's not found...",404,next);
    //now check if the student was the one who created the rating
    if(!checkOwnerOfRating(rating,req.user)) return next(new customError("This student does not have access to modify this rating...", 400));
    rating.star=req.body.star;
    rating.comment=req.body.comment;
    const updatedRating = await rating.save();
    empty(updatedRating,"Server Error, Unable to update your rating's...",500,next);
    return res.status(200).json({
        status: "success",
        message: "Your rating has been updated..."
    })
})
exports.deleteRating=asyncErrorHandler(async(req,res,next)=>{
    empty(req.user,"You have to login before you can delete this rate...",404,next);
    const {ratingId}=req.params;
    empty(ratingId,"Invalid rating ID...",404,next);
    //now check if the student was the one who created the rating
    const rating=await Rating.findById(ratingId).populate("student").exec();
    empty(rating,"Rating's not found...",404,next);
    if(!checkOwnerOfRating(rating,req.user)) return next(new customError("This student does not have access to modify this rating...", 400))
    await Rating.findByIdAndDelete(ratingId);
    return res.status(200).json({
        status: "success",
        message: "Your rating has been deleted..."
    })
})

exports.ratingPerCourse=asyncErrorHandler(async(req,res,next)=>{
    const {courseId}=req.params;
    empty(courseId,"Provide valid ID to the course you want to rate...",404,next);
    const getCourse=await Course.findById(courseId);
    empty(getCourse,"Provide valid ID to the course you want to rate...",404,next);
    const grouping=await Rating.aggregate([
        {$match: {course: getCourse._id}},
        {$group: {
            _id: "$course",
            totalRating: {$sum: "$star"},
            avgRating: {$avg: "$star"},
            maxRating: {$max: "$star"},
            minRating: {$min: "$star"},
            ratingsCount: {$sum: 1}
        }
       }
    ]) 
    return res.status(200).json({
        status: "success",
        data: {
            grouping,
            ratings: await Rating.find({course: getCourse._id}).populate({
                path: "student", 
                options:{skipMiddleware: true}
            }).populate("course").exec()
        }
    })
})

exports.ratingAllCourse=asyncErrorHandler(async(req,res,next)=>{
    const grouping=await Rating.aggregate([
        {$match: {}},
        {$group: {
            _id: "$course",
            totalRating: {$sum: "$star"},
            avgRating: {$avg: "$star"},
            maxRating: {$max: "$star"},
            minRating: {$min: "$star"},
            ratingsCount: {$sum: 1}
        }
       }
    ]) 
    return res.status(200).json({
        status: "success",
        data: {
            grouping
        }
    })
})

exports.ratingPerStudent=asyncErrorHandler(async(req,res,next)=>{
    empty(req.user,"You have to login before you can rate this course...",404,next);
    const student=await User.findById(req.user._id);
    empty(student,"Invalid student ID...",404,next);
    const grouping=await Rating.aggregate([
        {$match: {student: student._id}},
        {$group: {
            _id: "$student",
            totalRating: {$sum: "$star"},
            avgRating: {$avg: "$star"},
            maxRating: {$max: "$star"},
            minRating: {$min: "$star"},
            ratingsCount: {$sum: 1}
        }
       }
    ]) 
    return res.status(200).json({
        status: "success",
        data: {
            grouping,
            ratings: await Rating.find({student: student._id}).populate({
                path:"student",
                options:{skipMiddleware: true}
            }).populate("course").exec()
        }
    })
})

function checkOwnerOfRating(rating,user){
    return rating.student._id.equals(user._id);
}