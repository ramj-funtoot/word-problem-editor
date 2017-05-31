var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

exports.setup = function (User, config) {
  passport.use(new GoogleStrategy({
    clientID: config.google.clientID,
    clientSecret: config.google.clientSecret,
    callbackURL: config.google.callbackURL
  },
    function (accessToken, refreshToken, profile, done) {
      User.findOne({
        'email': profile.emails[0].value
      }, function (err, user) {
        if (user) {
          //merge with existing user
          user.name = profile.displayName;
          user.email = profile.emails[0].value;
          user.username = profile.username;
          user.provider = 'google';
          user.google = profile._json;
          user.save(function (err) {
            if (err) return done(err);
            done(err, user);
          });
        }
        else {
          return done('You are not authorized to use this application. Please contact the administrator.')
        }
      });
    }
  ));
};
