const express = require('express');
const passport = require('passport');
const Router=express.Router();
const jwt = require("jsonwebtoken");
const customError = require('../utils/customError');

//@ desc Auth with google
//@route GET /auth/google
Router.route("/google").get(passport.authenticate('google',{scope: ['email', 'profile']}))
//@ desc google auth callback
//@route GET /auth/google/callback
Router.route("/google/callback").get(function(req, res, next) {
    passport.authenticate('google',async function(err, user) {
      if (err) {
        req.flash('error','Authentication failed. Please try again.');
        return res.redirect('/login');
      }
      if (!user) {
         req.flash('error', 'No user found, Either user has been suspended or inactive, try reactivating account.')
         return res.redirect('/login') 
      }

      try {
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        if (!token) {
            return next(new customError("Error occurred while generating session token...", 500));
        }

        const expiresInMs = parseInt(process.env.JWT_EXPIRES_IN.split('h')[0], 10) * 3600 * 1000;

        const cookiesOption = {
            maxAge: expiresInMs,
            httpOnly: true,
            signed: false, // Ensure this is set to false
            secure: process.env.NODE_ENV === 'production' // Use secure cookies in production
        };

        res.cookie('auth_token', token, cookiesOption);

        // Remove sensitive fields before sending the response
        user.password = undefined;
        user.role = undefined;
        user.active = undefined;
        user.passwordChangedAt = undefined;
        user.updatedAt = undefined;
        user.profileImageId = undefined;
        user.coverImageId = undefined;

       return res.redirect("/settings")
      } catch (error) {
        return res.redirect('/login') 
      }
    })(req, res, next);
})

module.exports=Router;