const mongoose=require("mongoose")

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {type: String, required: [true, "What category is this course, e.g business,technology..."]},
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User',required: true },//user embedding
    tutorial: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tutorial',required: true }],//tutorial embedding
    thumbnailUrl: { type: String, required: true },
    requests:[
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        course: {type: mongoose.Schema.Types.ObjectId, ref: 'Course'}
      }
    ],
    acceptedrequests:[
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],
    thumbnail_public_id: { type: String, required: true, select: false },
    skill_level:  { type: String, required: [true, "please provide course skill level..."] },
    price: { type: String, required: true, enum:["free","paid"] }
  },{timestamps: true});

  courseSchema.index({ title: 'text', description: 'text'});

  module.exports = mongoose.model('Course', courseSchema);
  