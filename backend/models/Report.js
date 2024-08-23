const mongoose=require("mongoose")

const reportSchema = new mongoose.Schema({
    from:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, "You have to login before you can report an instructor..."] },
    text: {type: String, required: [true, "Please enter your report text..."]},
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    active: {type: Boolean, default: true},
    attendToAt: {type: Date, default: Date.now}
  },{timestamps: true});  

reportSchema.pre(/^find/, function(next){
    this.find({active: {$ne: false}})
    next();
})
const Report=mongoose.model("Report",reportSchema);

module.exports=Report;