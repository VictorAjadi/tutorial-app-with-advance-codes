const express = require('express');
const { protectRoutes, protectAdmins } = require('../authentication/protect');
const { deleteReport, attendedToReport, addReport } = require('../controller/reportController');
const Router=express.Router();

Router.route("/:courseId/").post(protectRoutes, protectAdmins,addReport)//Add Ratings
Router.route("/:reportId")
                  .put(protectRoutes, protectAdmins,attendedToReport)//Attented to report
                  .delete(protectRoutes, protectAdmins,deleteReport);//Delete report

module.exports=Router;