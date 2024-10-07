const express = require('express');
const { protectRoutes } = require('../authentication/protect');
const { addRating, editRating, deleteRating, ratingPerCourse, ratingPerStudent, ratingAllCourse } = require('../controller/ratingController');
const Router=express.Router();

Router.route("/:courseId").post(protectRoutes, addRating)//Add Ratings
Router.route("/:ratingId")
                  .patch(protectRoutes, editRating)//Edit Ratings
                  .delete(protectRoutes, deleteRating);//delete Ratings
Router.route("/per/course/:courseId").get(ratingPerCourse)
Router.route("/per/student").get(protectRoutes, ratingPerStudent)
Router.route("/per/all/course").get(protectRoutes, ratingAllCourse)

module.exports=Router;