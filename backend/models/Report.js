const mongoose=require("mongoose");
const { applyCacheToQueries } = require("../config/cache");

const reportSchema = new mongoose.Schema({
    from:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, "You have to login before you can report an instructor..."] },
    text: {type: String, required: [true, "Please enter your report text..."]},
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    active: {type: Boolean, default: true},
    attendToAt: {type: Date}
  },{timestamps: true});  

reportSchema.pre(/^find/, function(next){
  if (!this.getOptions().skipMiddleware) {
    this.find({active: {$ne: false}})
  }
  next();
})
applyCacheToQueries(reportSchema);

const Report=mongoose.model("Report",reportSchema);

module.exports=Report;