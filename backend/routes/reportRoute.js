const express = require('express');
const { protectRoutes, protectAdmins } = require('../authentication/protect');
const { deleteReport, attendedToReport, addReport, allReport } = require('../controller/reportController');
const Router=express.Router();

Router.route("/").get(protectRoutes,protectAdmins,allReport)//get report
Router.route("/:courseId").post(protectRoutes,addReport)//Add report
Router.route("/:reportId")
                  .patch(protectRoutes, protectAdmins,attendedToReport)//Attented to report
                  .delete(protectRoutes, protectAdmins,deleteReport);//Delete report

module.exports=Router;