const mongoose=require("mongoose");
const { applyCacheToQueries } = require("../config/cache");

const ratingSchema = new mongoose.Schema({
    student:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, "You have to login before you can rate this course..."] },
    comment: {type: String, required: [true, "Add a comment for this rating..."]},
    star: {type: Number, required: true},
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }
  },{timestamps: true});  

applyCacheToQueries(ratingSchema);

const Rating=mongoose.model("Rating",ratingSchema);

module.exports=Rating;