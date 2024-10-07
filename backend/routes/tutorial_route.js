const express = require("express");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Tutorial = require("../models/Tutorial");
const Course = require("../models/Course");
const customError = require("../utils/customError");
const { empty } = require("../utils/notFoundInModel");
const { protectRoutes, protectInstructor } = require("../authentication/protect");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const User = require("../models/User");
//const sendEmail = require("../config/email");
const features = require("../utils/apiFeatures");
const { promisify } = require('util');

const Router = express.Router();

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer-Cloudinary storage configuration
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folder = 'default';
        if (file.mimetype.startsWith('image/')) {
            folder = 'devon_images';
        } else if (file.mimetype.startsWith('video/')) {
            folder = 'devon_videos';
        }
        return {
            folder: folder,
            resource_type: 'auto' // Automatically detect file type
        };
    }
});

const upload = multer({ storage });
Router.route("/all").get(
  asyncErrorHandler(async (req, res, next) => {
      const queryString = req.query;
      let featureInstance = new features(Course.find().populate({
        path: "instructor",
        options: {skipMiddleware: true}}).populate('tutorial').select("-videoUrl"), queryString);

      if (req.query.search) {
        featureInstance = await featureInstance.search(req.query.search);
      }

      featureInstance = featureInstance.filter()
                                       .sort()
                                       .fields()
                                       .paginate();

      const courses = await featureInstance.queryObject;
      empty(courses, "Unable to load courses from server, refresh page or try again in an hour time...", 505, next);

      return res.status(200).json({
        status: "success",
        data: {
          courses,
          count: await Course.countDocuments()
        }
      });
  })
);

Router.route("/single/:courseId").get(
 asyncErrorHandler(async(req,res,next)=>{
    const {courseId}=req.params;
    empty(courseId,"Can't locate course ID, refresh the page again...",404,next);
    const course=await Course.findById(courseId).populate({
                                                path: "instructor",
                                                options: {skipMiddleware: true}})
                                              .populate("tutorial")
                                              .exec();
    empty(course,"Failed to load courses from server...",505,next);
    res.status(200).json({
      status: "success",
      data:{
        course
      }
    })
  })
)
/* Router.route("/accept/:courseId/request/:userId").patch(
  protectRoutes,
  protectInstructor,
  asyncErrorHandler(async(req,res,next)=>{
    empty(req.user,"Instructor not logged in, try logging in...",404,next);
    const {userId,courseId}=req.params;
    empty(userId,"Can't locate student ID, try clicking accept button again...",404,next);
    empty(courseId,"Can't locate course ID, try clicking enroll again...",404,next);
    const user=await User.findById(userId);
    empty(user,"This student doesn't exist, might be an hacker...",404,next);
    const course=await Course.findById(courseId).populate("instructor")
                                                .populate("tutorial")
                                                .populate("requests")
                                                .populate("acceptedrequests").exec();
    empty(course,"This course doesn't exist, might have been deleted...",404,next);
    if(course.requests.some((filter)=> filter?.student._id.equals(userId) && filter?.course._id.equals(courseId))){
      course.acceptedrequests=[...course.acceptedrequests, user._id];
      const savedCourse=await course.save({new: true, runValidator: true});
      user.enroll=[...user.enroll,course._id]
      const savedUser=await user.save({new: true, runValidator: true});
      empty(savedUser,"An error occured while accepting enrolled student, try logging in again...",500,next);
      empty(savedCourse,"An error occured while accepting this student, try logging in again...",500,next);
      //send acceptance mail
      await sendEmail({
        email: user.email,
        instructorEmail: course?.instructor.email,
        studentName: user.name,
        courseTitle: course.title,
        link: `${req.protocol}://${req.get("host")}`,
        subject: "Course request acceptance"
      },"accept")
      return res.status(200).json({
        status: "success",
        message: "You have successfully given this user access to this course..."
      })
    }
  })
) */

Router.route("/enroll/:courseId").patch(
  protectRoutes,
asyncErrorHandler(async(req,res,next)=>{
    empty(req.user,"User not logged in, try logging in...",404,next);
    const {courseId}=req.params;
    empty(courseId,"Can't locate course ID, try clicking enroll again...",404,next);
    const course=await Course.findById(courseId).populate("instructor")
                                                  .populate("tutorial")
                                                  .exec();
    empty(course,"Invalid course ID...",404,next);
    let updateUser;
    if(course.type==="free"){
      updateUser= await User.findById(req.user._id);
      if((await checkIfCourseExistInUser(updateUser,courseId))) return next(new customError("You have recently enrolled for the course, check enroll page...",400)); 
      updateUser.enroll=[...updateUser.enroll,courseId];
      const newUser=await updateUser.save({new: true,runValidators: true});
      empty(newUser,"An Error Occured, failed to enroll this user...",500,next);
      return res.status(200).json({
        status: "success",
        message: "User has been enrolled for this free course, refresh page..."
      })
    }else{
      return res.redirect(`/courses/details/:${courseId}`)
    }
}))

// Define the route for uploading tutorials and thumbnails
Router.route('/upload').post(upload.fields([
  { name: 'thumbnailUrl', maxCount: 1 },
  { name: 'videos', maxCount: Infinity }
]), protectRoutes, protectInstructor, asyncErrorHandler(async (req, res, next) => {
  try {
    const { category, description, type, amount, currency, title, skill_level } = req.body;
    const tutorial = JSON.parse(req.body.tutorial);

    if (!req.files.videos || !req.files.thumbnailUrl) {
      return next(new customError("Thumbnail & video files not uploaded, upload and try again...", 400));
    }

    const videoFiles = req.files.videos;
    const uploadVideo = promisify(cloudinary.uploader.upload);

    // Upload videos to Cloudinary and create tutorials
    const tutorialData = await Promise.all(videoFiles.map(async (file, index) => {
      try {
        const videoResult = await uploadVideo(file.path, {
          resource_type: 'video',
          format: 'mp4', // Ensure the video is converted to mp4 format
          type: 'authenticated'
        });

        const newData = {
          title: tutorial[index].title,
          description: tutorial[index].description,
          part: tutorial[index].part,
          videoUrl: cloudinary.url(videoResult.public_id, {
            resource_type: 'video',
            type: 'authenticated',
            sign_url: true,
            expires_at: Math.floor(Date.now() / 1000) + 3600 // URL expires in 1 hour
          }),
          public_id: videoResult.public_id, // Store the public_id
          duration: tutorial[index].duration,
          assignment: {
            question: tutorial[index].question || "",
            answer: tutorial[index].answer || "",
          } || {}
        };

        const createdTutorial = await Tutorial.create(newData);
        return createdTutorial._id; // Collect IDs of created tutorials
      } catch (err) {
        return next(new customError('Error uploading video to Cloudinary', 500));
      }
    }));

    // Upload thumbnail to Cloudinary
    let thumbnailResult;
    try {
      thumbnailResult = await uploadVideo(req.files.thumbnailUrl[0].path, {
        resource_type: 'image'
      });
    } catch (err) {
      return next(new customError('Error uploading thumbnail to Cloudinary', 500));
    }

    // Create new course
    const newCourse = {
      category: category,
      description: description,
      type: type,
      title: title,
      instructor: req.user._id,
      skill_level: skill_level,
      thumbnailUrl: cloudinary.url(thumbnailResult.public_id, {
        resource_type: 'image'
      }),
      thumbnail_public_id: thumbnailResult.public_id, // Store the public_id for the thumbnail
      tutorial: tutorialData
    };
    if(type==='paid'){
      newCourse.currency=currency;
      newCourse.amount=amount;
    }

    const course = await Course.create(newCourse);
    empty(course, 'Error uploading files...', 501, next);
    return res.status(200).json({ status: 'success', message: 'Upload was successful...' });
  } catch (error) {
    console.log(error)
    next(new customError('Error uploading files', 500));
  }
}));

Router.route('/:id').delete(
  protectRoutes,
  protectInstructor,
  async (req, res, next) => {
    const { id } = req.params;
    empty(id,"Can't find this course ID...",404,next);
    const course=await Course.findOne({_id: id}).populate("instructor")
                                                    .populate("tutorial")
                                                    .populate("requests")
                                                    .populate("acceptedrequests").exec();
    const {thumbnail_public_id,tutorial,instructor}=course;
    empty(thumbnail_public_id,"Server Error, Course thumbnail ID not found...", 505,next);
    empty(tutorial,"Server Error, Course videos not found...", 505,next);
    if(!(await checkCourseOwnership(instructor,req)))  return next(new customError("Due to ownership policy, this action is not permitted...",400));  

    try {
      //delete cover image in cloudinary
        const result = await cloudinary.uploader.destroy(thumbnail_public_id,{ resource_type: 'image' , invalidate: true, type: 'authenticated'});
        if (result.result === 'not found') {}
        else if(result.result !== 'ok'){
          return next(new customError('Failed to delete the thumbnail resource', 500));
        }
      //delete video files in cloudinary
        tutorial.forEach(async(video) => {
            if (!video || !video._id || video.public_id) {
              return next(new customError("Invalid tutorial data provided...", 400));
            }
            const videoResult=await cloudinary.uploader.destroy(video.public_id,{ resource_type: 'video' , invalidate: true, type: 'authenticated'})
            if (videoResult.result === 'not found') {}
            else if(videoResult.result !== 'ok'){
                return next(new customError('Failed to delete old video from Cloudinary, check your network connection', 500));
            }
            const deletedTutorial=await Tutorial.findByIdAndDelete(video._id);
            if(!deletedTutorial){
              return next(new customError("Delete action failed to complete on tutorial...", 400));
            }
          }
        );
        //now delete the full course
        const deletedCourse=await Course.findByIdAndDelete(id);
        if(!deletedCourse){
          return next(new customError("Delete action failed to complete on course...", 400));
        }
        return res.status(204).json({ status: 'success', message: 'Course deleted successfully...' });
    } catch (error) {
        return next(new customError('Error deleting resource', 500));
    }
});
Router.route('/content/:id').patch(upload.single('thumbnailUrl'), protectRoutes, protectInstructor, asyncErrorHandler(async (req, res, next) => {
  try {
      empty(req.user, "User not logged in, try logging in...", 404, next);
      const { id } = req.params;
      empty(id, "Course ID not provided...", 404, next);

      let course = await Course.findById(id).select("+thumbnail_public_id");
      empty(course, "Course not found or recently deleted...", 404, next);

      if (!(await checkCourseOwnership(course.instructor, req))) {
          return next(new customError("Due to ownership policy, this action is not permitted...", 400));
      }

      if (req.body.tutorial) {
          return next(new customError("This route cannot be used to update tutorial video content...", 400));
      }

      let thumbnailUrl = course.thumbnailUrl;
      let thumbnail_public_id = course.thumbnail_public_id;

      if (req.file) {
          // Delete old thumbnail from Cloudinary
          try {
              const result1 = await cloudinary.uploader.destroy(thumbnail_public_id, { resource_type: 'image', invalidate: true });
              if (result1.result === 'not found') {}
              else if(result1.result !== 'ok'){
                  return next(new customError('Failed to delete old video from Cloudinary, check your network connection', 500));
              }
          } catch (err) {
              return next(new customError('Error deleting old thumbnail from Cloudinary', 500));
          }

          // Upload new thumbnail to Cloudinary
          try {
              const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' });
              thumbnailUrl = cloudinary.url(result.public_id, { resource_type: 'image' });
              thumbnail_public_id = result.public_id;
          } catch (err) {
              //console.error("Error uploading new thumbnail to Cloudinary:", err);
              return next(new customError('Error uploading new thumbnail to Cloudinary', 500));
          }
      }

      course.title = req.body.title || course.title;
      course.description = req.body.description || course.description;
      course.category = req.body.category || course.category;
      course.skill_level = req.body.skill_level || course.skill_level;
      course.type = req.body.type || course.type;
      if(req.body.type==='free'){
        course.currency = undefined;
        course.amount = undefined;
      }else{
        course.currency = req.body.currency || course.currency;
        course.amount = req.body.amount || course.amount;
      }
      course.thumbnailUrl = thumbnailUrl;
      course.thumbnail_public_id = thumbnail_public_id;

      const updatedCourse = await Course.findByIdAndUpdate(course._id, { ...course }, { new: true, runValidators: true }).select("-password");
      empty(updatedCourse, "Invalid course ID, failed to update course...", 404, next);

      return res.status(200).json({
          status: "success",
          message: "Course update was successful, refresh page to view update..."
      });
  } catch (error) {
      return next(new customError('Error updating course', 500));
  }
}));
// Define the patch route for updating a tutorial video
Router.route('/content/:courseId/video/:videoId').patch(upload.single('video'), protectRoutes, protectInstructor, asyncErrorHandler(async (req, res, next) => {
  try {
    empty(req.user, "User not logged in, try logging in...", 404, next);
    const { courseId, videoId } = req.params;
    empty(courseId, "Course ID not provided...", 404, next);
    empty(videoId, "Course Video ID not provided...", 404, next);

    let course = await Course.findById(courseId);
    empty(course, "Course not found or recently deleted...", 404, next);

    if (!(await checkCourseOwnership(course.instructor, req))) {
      return next(new customError("Due to ownership policy, this action is not permitted...", 400));
    }

    if (req.body.thumbnailUrl) {
      return next(new customError("This route cannot be used to update course cover image...", 400));
    }

    let tutorial = await Tutorial.findById(videoId).select("+videoUrl +public_id");
    if (!(await checkIfTutorialExistInCourse(course, tutorial))) {
      return next(new customError("Due to ownership policy, this action is not permitted...", 400));
    }

    let videoUrl = tutorial.videoUrl;
    let public_id = tutorial.public_id;

    if (req.file) {
      try {
        const result1 = await cloudinary.uploader.destroy(public_id, { resource_type: 'video' , invalidate: true, type: 'authenticated'});
        if (result1.result === 'not found') {}
        else if(result1.result !== 'ok'){
            return next(new customError('Failed to delete old video from Cloudinary, check your network connection', 500));
        }
      } catch (err) {
        return next(new customError('Error deleting old video from Cloudinary, check your network connection', 500));
      }

      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          resource_type: 'video',
          type: 'authenticated',
          format: 'mp4'
        });
        videoUrl = cloudinary.url(result.public_id, { 
          resource_type: 'video' ,
          type: 'authenticated',
          sign_url: true,
          expires_at: Math.floor(Date.now() / 1000) + 3600 // URL expires in 1 hour
        });
        public_id = result.public_id;
      } catch (err) {
        //console.error('Error uploading new video to Cloudinary:', err);
        return next(new customError('Error uploading new video to Cloudinary', 500));
      }
    }

    tutorial.title = req.body.title || tutorial.title;
    tutorial.description = req.body.description || tutorial.description;
    tutorial.part = req.body.part || tutorial.part;
    tutorial.videoUrl = videoUrl;
    tutorial.public_id = public_id;
    tutorial.duration = req.body.duration || tutorial.duration;
    tutorial.assignment.answer = req.body.answer || tutorial.assignment.answer;
    tutorial.assignment.question = req.body.question || tutorial.assignment.question;

    const updatedTutorial = await Tutorial.findByIdAndUpdate(tutorial._id, { ...tutorial }, { new: true, runValidators: true });

    empty(updatedTutorial, "Invalid video ID, failed to update tutorial video...", 404, next);
    return res.status(200).json({
      status: "success",
      message: "Tutorial video update was successful, refresh page to view update..."
    });
  } catch (error) {
    return next(new customError('Error updating tutorial video', 500));
  }
}));

// Helper function to check course ownership
async function checkCourseOwnership(instructor, req) {
  return instructor._id.equals(req.user._id);
}

// Helper function to check if the tutorial exists in the course
async function checkIfTutorialExistInCourse(course, tutorial) {
  return course?.tutorial.some(tut => tut._id.equals(tutorial._id));
}

async function checkIfCourseExistInUser(user, courseId) {
  return user?.enroll.some(enrolledCourseId => enrolledCourseId.equals(courseId));
}

/* async function checkIfUserExistInInstructorRequests(course, userId) {
  return course?.requests.some(request => request.student._id.equals(userId));
} */

module.exports = Router;
