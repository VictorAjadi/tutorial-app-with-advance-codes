const Tutorial = require("../models/Tutorial");
const { encrypt } = require("./signature");
const jwt = require("jsonwebtoken");

exports.generateSignaturedUrl=async function(req,res,next){
    const id = req.body.id; // Extract URL from query parameter  
    if (!id) {
        return res.status(404).json({
            status: 'error',
            message: "Invalid Course ID for Video Url"
        });
    }
    const tutorial=await Tutorial.findById(id).select("+videoUrl");
    if (!tutorial) {
        return res.status(404).json({
            status: 'error',
            message: "Invalid Course ID for Video Url"
        });
    }
    const signature = encrypt(`${tutorial.videoUrl}`);
    const token = jwt.sign({ url: signature }, process.env.JWT_SECRET, { expiresIn: '5m' });
    return res.send(`${req.protocol}://${req.get("host")}/authenticated/videoUrl?token=${token}`);
}