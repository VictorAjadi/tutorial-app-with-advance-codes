const express = require('express');
const { protectRoutes, protectOnlyAdmin, protectAdmins } = require('../authentication/protect');
const { loginAdmins, addSubAdmin, suspendAccount, unSuspendAccount, allUsers, getAdmin, getOTPToken, updateAdminPassword, updateAdminDetails } = require('../controller/adminController');
const Router=express.Router();

Router.route("/login").post(loginAdmins);
Router.route("/add/:id").patch(protectRoutes,protectOnlyAdmin,addSubAdmin);
Router.route("/suspend/:id").patch(protectRoutes,protectAdmins,suspendAccount);
Router.route("/unsuspend/:id").patch(protectRoutes,protectAdmins,unSuspendAccount);
Router.route("/all/users").get(protectRoutes,protectAdmins,allUsers);
Router.route("/:id").get(protectRoutes,protectAdmins,getAdmin);
Router.route("/").get(protectRoutes,protectAdmins,getOTPToken);
Router.route("/").patch(protectRoutes,protectAdmins,updateAdminPassword);
Router.route("/details").patch(protectRoutes,protectAdmins,updateAdminDetails);

module.exports=Router;