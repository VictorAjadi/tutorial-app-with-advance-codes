const customError = require("./customError")

exports.empty=(value,message,statusCode,next)=>{
    if(!value){
        return next(new customError(message,statusCode || 404));
    }
}