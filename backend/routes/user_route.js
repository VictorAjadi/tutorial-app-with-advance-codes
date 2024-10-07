const express = require("express");
const { createUser, loginUser, forgot_password_reset_token, reset_password, deactivateUser, deleteUser, reactivateUser, updatePassword, getUserWithId, createInstructor, getReactivateOTPToken } = require("../controller/userController");
const { protectRoutes } = require("../authentication/protect");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const User = require("../models/User");
const customError = require("../utils/customError");

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

const upload = multer({ 
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024 * 1024 // 2 GB file size limit
    }
 });

const Router=express.Router();
Router.route("/token").get(getReactivateOTPToken);
Router.route("/").patch(protectRoutes,deactivateUser)
                .delete(protectRoutes,deleteUser)

Router.route("/:id").get(protectRoutes,getUserWithId)
Router.route("/signup").post(createUser)
Router.route("/signup/instructor").post(createInstructor)

Router.route("/login").post(loginUser)

Router.route("/forgotPassword").post(forgot_password_reset_token)

Router.route("/resetPassword/:token").patch(reset_password);

Router.route('/details').patch(
  upload.fields([
    { name: 'cover_image', maxCount: 1 },
    { name: 'profile_image', maxCount: 1 }
  ]),
  protectRoutes,
  async (req, res, next) => {
    try {
      const id = req.user._id;
      if (!id) {
        return next(new customError("User not logged in, login and try again...", 404));
      }
      const exclude = ["password", "coverImageId", "profileImageId","confirm_password", "role", "inactiveAt", "active", "passwordChangedAt", "hashedResetToken", "resetTokenExpiresIn"];
      exclude.forEach(el => {
        delete req.body[el];
      });
      let coverImage = "";
      let profileImage = "";
      let coverImageId = "";
      let profileImageId = "";

      if (req.files.cover_image) {
        if (req.user.coverImageId) {
          try {
            const result = await cloudinary.uploader.destroy(req.user.coverImageId,{ resource_type: 'image' , invalidate: true});
            if (result.result !== 'ok') {
              return next(new customError('Failed to update the resource due to server error or bad network connection', 500));
            }
          } catch (err) {
            return next(new customError('Network error while deleting previous cover image from Cloudinary', 500));
          }
        }
        const coverImageResult = await cloudinary.uploader.upload(req.files.cover_image[0].path, { resource_type: 'image' });
        coverImage = coverImageResult.secure_url;
        coverImageId = coverImageResult.public_id;
      }

      if (req.files.profile_image) {
        if (req.user.profileImageId) {
          try {
            const result = await cloudinary.uploader.destroy(req.user.profileImageId,{ resource_type: 'image' , invalidate: true});
            if (result.result !== 'ok') {
              return next(new customError('Failed to update the resource due to server error or bad network connection', 500));
            }
          } catch (err) {
            return next(new customError('Network error while deleting previous profile image from Cloudinary', 500));
          }
        }
        const profileImageResult = await cloudinary.uploader.upload(req.files.profile_image[0].path, { resource_type: 'image' });
        profileImage = profileImageResult.secure_url;
        profileImageId = profileImageResult.public_id;
      }

      req.user.name = req.body.name || req.user.name;
      req.user.email = req.body.email || req.user.email;
      req.user.mobile_number = req.body.mobile_number || req.user.mobile_number;
      req.user.profile_image = profileImage || req.user.profile_image;
      req.user.cover_image = coverImage || req.user.cover_image;
      req.user.profileImageId = profileImageId || req.user.profileImageId;
      req.user.coverImageId = coverImageId || req.user.coverImageId;
      req.user.address=req.body.address || req.user.address;
      req.user.website= req.body.website || req.user.website; 
      req.user.github=req.body.github || req.user.github;
      req.user.twitter = req.body.twitter || req.user.twitter;
      req.user.facebook= req.body.facebook || req.user.facebook;
      req.user.skills= (req.body.skills && req.body.skills.trim().split(',')) || req.user.skills;
      req.user.profession= req.body.profession || req.user.profession;
      req.user.paypal_id= req.body.paypal_id || req.user.paypal_id;
      req.user.paymentProvider= req.body.paymentProvider || req.user.paymentProvider;

      const user = await User.findByIdAndUpdate(req.user.id, req.user, { new: true, runValidators: true });
      if (!user) {
        return next(new customError("Invalid user ID, login and try again...", 404));
      }

      return res.status(200).json({
        status: "success",
        message: "User details update was successful, refresh page..."
      });

    } catch (error) {
      return next(new customError('Error updating user details...', 500));
    }
  }
);

Router.route("/password").patch(protectRoutes,updatePassword)
Router.route("/reactivate").patch(reactivateUser);//use a ?code=sbhern query type


module.exports = Router;