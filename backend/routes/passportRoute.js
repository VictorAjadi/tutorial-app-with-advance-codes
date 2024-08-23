const express = require('express');
const passport = require('passport');
const create_jwt_token = require('../utils/create_jwt_token');
const Router=express.Router();

//@ desc Auth with google
//@route GET /auth/google
Router.route("/google").get(passport.authenticate('google',{scope: ['profile']}))

//@ desc google auth callback
//@route GET /auth/google/callback
Router.route("/google/callback").get(function(req, res, next) {
    passport.authenticate('google', function(err, user, info, status) {
      if (err) { return next(err) }
      if (!user) { return res.redirect('/login') }
      create_jwt_token(res,user,200,next)
    })(req, res, next);
})

module.exports=Router;