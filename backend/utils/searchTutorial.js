const Tutorial = require("../models/Tutorial");

exports.searchTutorials = async function (searchString) {
    try {
        // Use a regular expression to search for partial matches
        // Create a case-insensitive regular expression for partial matching
        const regex = new RegExp(searchString, 'i');
        const tutorials = await Tutorial.find({
            $or: [
                { title: { $regex: regex } },
                { description: { $regex: regex } }
            ]
        });
        return tutorials;
    } catch (error) {
        throw error;
    }
};
