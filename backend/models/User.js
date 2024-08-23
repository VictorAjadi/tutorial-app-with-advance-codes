const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const validator = require("validator");

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
    profile_image: {
        type: String,
        trim: true
    },
    profileImageId:{
        type: String,
        select: false
    },
    cover_image: {
        type: String,
        trim: true
    },
    coverImageId:{
        type: String,
        select: false
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    inactiveAt: {
        type: Date,
        select: false
    },
    role: {
        type: String,
        default: "student",
        enum: ["student", "instructor", "admin"],
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
    }
}, { timestamps: true });

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

userSchema.pre(/^find/, function(next) {
    this.find({ active: { $ne: false } });
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

const User = mongoose.model("User", userSchema);

module.exports = User;
