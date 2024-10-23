const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const { applyCacheToQueries } = require("../config/cache");


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, "Please enter your name"],
        maxlength: [100, "User name must not be more than 100 characters"],
        minlength: [4, "User name must not be less than 4 characters"]
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        required: [true, "Please enter your email address"],
        lowercase: true,
        validate: {
            validator: function(value) {
                return validator.isEmail(value);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    mobile_number: {
        type: String,
        unique: true,
        validate: {
            validator: function(value) {
                return validator.isMobilePhone(value);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    enroll: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        }
    ],
    password: {
        type: String,
        required: [true, "Please enter your password"],
        trim: true,
        minlength: [8, "Password must be more than 8 characters..."],
        select: false
    },
    confirm_password: {
        type: String,
        trim: true,
        minlength: [8, "Password must be more than 8 characters..."],
        validate: {
            validator: function(value) {
                return value === this.password;
            },
            message: props => `${props.value} does not match the password.`
        }
    },
    oauthProvider: {
        type: String,
        enum: ['google', 'facebook', 'twitter', 'github', 'none'], // Add more providers if needed
        default: 'none'
    },
    profile_image: {
        type: String,
        trim: true
    },
    profileImageId: {
        type: String,
        select: false
    },
    cover_image: {
        type: String,
        trim: true
    },
    coverImageId: {
        type: String,
        select: false
    },
    profession: String,
    address: String,
    website: String,
    github: String,
    twitter: String,
    facebook: String,
    skills: Array,
    active: {
        type: Boolean,
        default: true
    },
    inactiveAt: {
        type: Date,
        select: false
    },
    suspended: {
        type: Boolean,
        default: false,
        select: false
    },
    role: {
        type: String,
        default: "student",
        enum: ["student", "instructor", "admin", "sub-admin"],
        select: false
    },
    hashRole:{
        type: String,
        required: true,
        select: false
    },
    passwordChangedAt: {
        type: Date
    },
    hashedResetToken: {
        type: String
    },
    resetTokenExpiresIn: {
        type: Date
    },
    // New fields for user account details
    paypal_id: {
        type: String,
        trim: true,
        select: false,
        unique: true,  // Ensures each PayPal ID is unique in the database
      },
    paymentProvider: {
        type: String,
        select: false
    }
}, { timestamps: true });

userSchema.pre(/^(update|updateMany|updateOne|find.*AndUpdate)$/, function (next) {
    const update = this.getUpdate();

    if (update.role === "student") {
      // Set fields to undefined to remove them for students
      update.website = undefined;
      update.github = undefined;
      update.twitter = undefined;
      update.facebook = undefined;
      update.skills = undefined;
      update.profession = undefined;
      update.paypal_id = undefined;
      update.paymentProvider = undefined;
    } else {
      // Set enroll to undefined for non-students
      update.enroll = undefined;
    }

    next();
});

userSchema.pre("save", async function(next) {
    if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
    this.confirm_password = undefined;
    this.passwordChangedAt = Date.now();
    next();
  }else{
    return next()
  }
});

userSchema.pre(/^find/, function (next) {
    // Ensure skipMiddleware is checked correctly and combined query is set
    if (!this.getOptions().skipMiddleware) {
      // Combine both conditions in a single .find() call
      this.find({
        active: { $ne: false },
        suspended: false,
        $or: [
          { role: "student" },
          { role: "instructor" }
        ]
      });
    }
    next();
});


userSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.isPasswordChanged = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

userSchema.methods.createResetToken = async function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetTokenExpiresIn = Date.now() + process.env.RESET_TOKEN_EXPIRES_IN * 60 * 1000;
    return resetToken;
};

userSchema.methods.isResetTokenExpired = function() {
    return Date.now() > this.resetTokenExpiresIn;
};
// Apply cache middleware to the schema
applyCacheToQueries(userSchema);
const User = mongoose.model("User", userSchema);

module.exports = User;
