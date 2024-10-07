const Course = require("../models/Course");
const Tutorial = require("../models/Tutorial");
const customError = require("./customError");
const { empty } = require("./notFoundInModel");
const cloudinary = require('cloudinary').v2;

exports.deleteCourseToDepth=async(deleteId,next)=>{
  //find all courses user appeared in
  const allCourses=await Course.find({instructor: deleteId}).populate("instructor")
                                                            .populate("tutorial").exec();//will give me an array
  //iterate allCourses array only if this returns one
  if(allCourses.length>0){
    allCourses.forEach(async(each)=>{
        const {thumbnail_public_id,tutorial}=each;
        empty(thumbnail_public_id,"Server Error, Course thumbnail ID not found...", 505,next);
        empty(tutorial,"Server Error, Course videos not found...", 505,next);
        try {
          //delete cover image in cloudinary
            const result = await cloudinary.uploader.destroy(thumbnail_public_id);
            if (result.result === 'not found') {}
            else if(result.result !== 'ok'){
              return next(new customError('Failed to delete this resource', 500));
            }
          //delete video files in cloudinary
            tutorial.forEach(async(video) => {
                if (!video || !video._id || video.public_id) {
                    return next(new customError("Invalid tutorial data provided...", 400));
                }
                const videoResult=await cloudinary.uploader.destroy(video.public_id)
                if (videoResult.result === 'not found') {}
                else if(videoResult.result !== 'ok'){
                  return next(new customError('Failed to delete the video resource', 500));
                }
                const deletedTutorial=await Tutorial.findByIdAndDelete(video._id);
                if(!deletedTutorial){
                return next(new customError("Delete action failed to complete on tutorial...", 400));
                }
            }
            );
            const deletedCourse=await Course.findByIdAndDelete(id);
            if(!deletedCourse){
            return next(new customError("Delete action failed to complete on course...", 400));
            }
         //continue other process
        } catch (error) {
           return next(new customError('Error deleting this resource', 500));
        }
    })
  }
}