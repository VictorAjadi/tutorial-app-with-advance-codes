const mongoose=require("mongoose");
const { applyCacheToQueries } = require("../config/cache");

const tutorialSchema = new mongoose.Schema({
    title: { type: String,required: [true, "Please provide this video title..."]},
    description: { type: String,required: [true, "Please provide this video description..."]},
    part: {type:String, required: [true, "Please enter the part of this video..."]},
    videoUrl: { type: String, required: true,select: false },
    public_id: {type: String, required: true, select: false},
    duration: Number, // Duration in seconds
    assignment:{
        question: {
            type: String
        },
        answer:{
            type: String,
            validate:{
                validator: function(value){
                  return this.question && !value
                },
                message: "Please enter the assignment answer..."
            }
        }
     }
  },{timestamps: true});  

tutorialSchema.index({ title: 'text', description: 'text' });

// Apply cache middleware to the schema
applyCacheToQueries(tutorialSchema);

const Tutorial=mongoose.model("Tutorial",tutorialSchema);

module.exports=Tutorial;