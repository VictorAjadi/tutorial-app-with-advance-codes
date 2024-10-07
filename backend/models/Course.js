const mongoose=require("mongoose");
const { applyCacheToQueries } = require("../config/cache");

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {type: String, required: [true, "What category is this course, e.g business,technology..."]},
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User',required: true },//user embedding
    tutorial: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tutorial',required: true }],//tutorial embedding
    thumbnailUrl: { type: String, required: true },
    thumbnail_public_id: { type: String, required: true, select: false },
    skill_level:  { type: String, required: [true, "please provide course skill level..."] },
    type: { type: String, required: [true, 'Provide a course type, either free or paid...'], enum:["free","paid"] },
    amount: {
      type: Number, 
      required: function() {
        return this.type === 'paid';  // Required only if role is 'instructor'
      },
    },
    currency:{
      type: String,
      enum: ["USD","GBP","EUR"],
      required: function() {
        return this.type === 'paid';  // Required only if role is 'instructor'
      }
    }
  },{timestamps: true});
  courseSchema.pre(/^(save|create)/, function(next) {
    // For save and create operations
    if (this.type === "free") {
      this.amount = undefined;
      this.currency = undefined;
    }
    next();
  });
  
/*   courseSchema.post(/find.*AndUpdate/, function() {
    // For findOneAndUpdate, findByIdAndUpdate, etc.
    console.log(this)
    if (this._update.type === "free") {
      console.log(this._update.type)
      this._update.amount = undefined;
      this._update.currency = undefined;
    }
  }); */
applyCacheToQueries(courseSchema);

  courseSchema.index({ title: 'text', description: 'text'});
  module.exports = mongoose.model('Course', courseSchema);
  