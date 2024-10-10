const Course = require("../models/Course");
const { searchTutorials } = require("./searchTutorial");

class Features {
  constructor(queryObject, queryString,docCount) {
    this.queryObject = queryObject;
    this.queryString = queryString;
    this.docCount = docCount || 1;
  }
  //search for text from api
  async search(text) {
    try {
      const tutorials = await searchTutorials(text);
      const tutorialIds = tutorials.map(tutorial => tutorial._id);

      let newObj = this.queryObject.find({
        $or: [
          { title: { $regex: new RegExp(text, 'i') } },
          { description: { $regex: new RegExp(text, 'i') } },
          { tutorial: { $in: tutorialIds } }
        ]
      });

      this.queryObject = newObj;
      return this; // Allow chaining
    } catch (error) {
      //throw error;
      return this; // Allow chaining
    }
  }
  //filter from api
  filter() {
    let newQueryStr = { ...this.queryString };
    const excludedFields = ["sort", "fields", "limit", "skip", "search","page"];
    excludedFields.forEach((element) => delete newQueryStr[element]);

    if (newQueryStr.category) {
      const categories = newQueryStr.category.split("*");
      this.queryObject = this.queryObject.find({ category: { $in: categories } });
    }
    if (newQueryStr.skill_level) {
      const skillLevels = newQueryStr.skill_level.split("*");
      this.queryObject = this.queryObject.find({ skill_level: { $in: skillLevels } });
    }
    if (newQueryStr.type) {
      const types = newQueryStr.type.split("*");
      this.queryObject = this.queryObject.find({ type: { $in: types } });
    }
    const excluded = ["type", "skill_level", "category"];
    excluded.forEach((element) => delete newQueryStr[element]);
    if (newQueryStr.amount) {
      const amount = newQueryStr.amount.split(" ");
      const min=amount[0] ? amount[0].split('*')[1] * 1 : 0;
      const max=amount[1] ? amount[1].split('*')[1] * 1 : '';
      if(!max){
        newQueryStr.amount={ $gte: min }
        this.queryObject = this.queryObject.find(newQueryStr);
      }else{
        newQueryStr.amount={
          $gte: min,
          $lte: max
        }
        this.queryObject = this.queryObject.find(newQueryStr);        
      }
    }
    this.queryObject=this.queryObject.find(newQueryStr)/* .batchSize(100).cursor() */
    return this;
  }
  //sort or arrange accordin to ?sort query
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split("*").join(" ").trim();
      this.queryObject = this.queryObject.sort(sortBy);
    } else {
      this.queryObject = this.queryObject.sort("-createdAt");
    }
    return this;
  }
   // fields to include in data from field query
  fields() {
    if (this.queryString?.fields) {
      let fields = this.queryString.fields.split("*").join(" ");
      this.queryObject = this.queryObject.select(fields);
    } else {
      this.queryObject = this.queryObject.select("-__v");
    }
    return this;
  }
  // page pagination using ?page query
  paginate() {
    let page = this.queryString.page * 1 || 1;
    let limit = this.queryString.limit * 1 || 10;
    let skip = (page - 1) * limit;
    this.queryObject = this.queryObject.skip(skip).limit(limit);
    if (skip > this.docCount) {
      this.queryObject=this.queryObject.skip(1).limit(10);
      //console.log("This page can not be found...!");
      return this;
    }
    return this;
  }
}

module.exports = Features;
