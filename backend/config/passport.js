const passport = require('passport');
const User = require('../models/User');
const { encryptRole } = require('../utils/hashRole');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
//sign up and login strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
      prompt: 'consent',  // Add this line to force consent screen
    },
    async (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value; // This will give you the user's email address
      let user = await User.findOne({ email: email.toString() }).setOptions({skipMiddleware: true})
      try {
        if (!user) {
          const hashRole=await encryptRole('instructor');
          if(!hashRole){
            return done({error:'An error occured while creating this user, pls try again few momment later...'})
          }
          user =  new User({
            name: profile.displayName,
            email: email,
            hashRole,
            oauthProvider: 'google', // Set the OAuth provider
          });
          await user.save({validateBeforeSave: false });
        }
        //localStorage.setItem('isLoggedIn', 'true');
        if(user.active===false || user.suspended===true){
          return done({error:'This user has either been suspended or inactive, try reactivating account.'})
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
