const jwt = require("jsonwebtoken");
const utils=require("util");
const User = require("../models/User");
const { decrypt } = require("./signature");
const axios = require('axios');

exports.videoStreamSignaturedUrl=async function(req,res,next){
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
          return res.redirect("/video-url-not-found")
        }
        const decoded_token= await utils.promisify(jwt.verify)(auth_token, process.env.JWT_SECRET);
        if(!decoded_token){
          return res.redirect("/video-url-not-found")
        }
        const user=await User.findOne({_id: decoded_token.id});
        if(!user){
          return res.redirect("/video-url-not-found")
        }
        //check if user has changed password after session token has been issued
        if((await user.isPasswordChanged(decoded_token.iat))) return res.redirect("/video-url-not-found");
        const token = req.query.token;

        if (!token) {
            return res.status(400).json({
                status: 'error',
                message: 'Token is required'
            });
        }
        const decoded = await utils.promisify(jwt.verify)(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(403).json({
                status: 'error',
                message: "Token has expired"
            });
        }
        const decryptedUrl = decrypt(decoded.url);  
      // Stream video from Cloudinary
      const response = await axios({
        url: decryptedUrl,
        method: 'GET',
        responseType: 'stream'
      });
      
      res.setHeader('Content-Type', 'video/mp4');
      response.data.pipe(res);
    } catch (err) {
        return res.status(401).json({
            status: 'error',
            message: "Invalid signature or error streaming video"
        });
    }
}