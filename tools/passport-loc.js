var passport = require('passport');
var Strategy = require('passport-local').Strategy;
const users = require('../db/users.js');
// ------------ логгер  --------------------
const log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //=1 глобальная трассировка (трассируется все)

// Configure the local strategy for use by Passport.
//
// The local strategy requires a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(
  function(username, password, cb) {
    //console.log("=========================================");
    //console.log("new` Strategy("+username+","+password+"); ");
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

  passport.testLogin=function(req,res,next) {
    //console.dir(req);
    //console.dir(res);
    if (! req.user) {
      //console.log("User not logged.");
      res.redirect('/login');
      return
    }
    //console.log("===> User logged. req.user=",req.user);
    next();
  }

module.exports=passport;
