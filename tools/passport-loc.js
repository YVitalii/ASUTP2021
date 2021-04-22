var passport = require('passport');
var Strategy = require('passport-local').Strategy;
const users = require('../db/users.js');

// Configure the local strategy for use by Passport.
//
// The local strategy requires a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(
  function(username, password, cb) {
    //console.log("=========================================");
    //console.log("new Strategy("+username+","+password+"); ");
    users.verifyUser(username, password, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      return cb(null, user);
    });
  }));

  // Configure Passport authenticated session persistence.
  //
  // In order to restore authentication state across HTTP requests, Passport needs
  // to serialize users into and deserialize users out of the session.  The
  // typical implementation of this is as simple as supplying the user ID when
  // serializing, and querying the user record by ID from the database when
  // deserializing.
  passport.serializeUser(function(user, cb) {
    //console.log("==>serializeUser("+user.name+")");
    cb(null, user.username);
  });

  passport.deserializeUser(function(username, cb) {
    //console.log("==>deserializeUser("+username+")");
    users.findByUsername(username, function (err, user) {
      if (err) { return cb(err); }
      cb(null, user);
    });
  });

module.exports=passport;
