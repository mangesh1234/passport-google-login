var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy
var User = require('../models/user');
var tblBlogEditor=require('../models/tblBlogEditor');
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var session = require('express-session');
var CurrentUser;
router.get('/register', function (req, res) {
    res.render('register');
});
router.get('/login', function (req, res) {
    res.render('login');
});

router.get('/login/facebook',
  passport.authenticate('facebook', { scope: ['email'] }
));

router.get('/login/google', passport.authenticate('google', { scope : ['profile', 'email'] }));
router.get('/login/twitter',
   passport.authenticate('twitter')
 );
 
router.get('/forgotPassword',function(req,res)
{
    res.render('forgotPassword');
});

router.post('/forgotPassword', function (req, res) {
    var email = req.body.name;
    console.log('email ID here' + email);
    if (email) {
        User.forgotPassword(email, res, req, function (err, user) {
            if (err) throw err;
            debugger;
            if (user) {
                req.flash('success_msg', 'You send mail');
                res.redirect('/users/login');
            }
            else {

                req.flash('error_msg', 'Email Address is not register');
                res.redirect('/users/login');
            }

        });
    }
});

router.post('/register', function (req, res) {
    var name = req.body.name;
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var passsword2 = req.body.password2;
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('username', 'username is required').notEmpty();
    req.checkBody('email', 'email is required').notEmpty();
    req.checkBody('email', 'email is required').isEmail();
    req.checkBody('password', 'password is required').notEmpty();
    req.checkBody('password2', 'password do not match').equals(req.body.password);
    var error = req.validationErrors();
    if (error) {
        res.render('register', {
            error: error
        });
    }
    else {
        var newUser = new User({
            name: name,
            email: email,
            username: username,
            password: password
        });
        console.log(newUser);
        User.createUser(newUser, function (err, user) {
            if (err) throw err;
            console.log('roters/users/'+user);
        });
        req.flash('success_msg','You are sccessfully register and can now login');
        res.redirect('/users/login');
    }

});

passport.use(new LocalStrategy(
  function (username, password, done) {
      User.getUserByUsername(username, function (err, user) {
          console.log('user name' + username);
          console.log('find user' + user);
          if (err) throw err;
          if (!user) {
              return done(null, false, { message: 'Unknow user' });
          }
          User.comparePassword(password, user.password, function (err, isMatch) {
              if (err) throw err;
              if (isMatch) {
                  CurrentUser = user;
                  return done(null, user);
              }
              else {
                  return done(null, false, { message: 'Invalid password' });
              }
          });

      });


  }
));

  passport.use('facebook', new FacebookStrategy({
      clientID: '1796697257212559',
      clientSecret: '4403e4960862dc0b5536723ca932ab93',
      callbackURL: 'http://localhost:8000/users/login/facebook/callback',
      profileFields: ['id', 'emails', 'gender', 'name']
  },

  // facebook will send back the tokens and profile
  function (access_token, refresh_token, profile, done) {
      // asynchronous
      process.nextTick(function () {
          console.log('passport authetication');
          // find the user in the database based on their facebook id
          User.findOne({ 'facebook.id': profile.id }, function (err, user) {
              debugger;
              // if there is an error, stop everything and return that
              // ie an error connecting to the database
              if (err)
                  return done(err);

              // if the user is found, then log them in
              if (user) {
                  return done(null, user); // user found, return that user
              } else {
                  console.log('profile' + profile);
                  // if there is no user found with that facebook id, create them
                  var newUser = new User();
                  // set all of the facebook information in our user model
                  newUser.facebook.id = profile.id; // set the users facebook id                 
                  newUser.facebook.token = access_token; // we will save the token that facebook provides to the user                    
                  newUser.facebook.name = profile.name.givenName + '' + profile.name.familyName;
                  newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
                  

                  // save our user to the database
                  newUser.save(function (err) {
                      if (err)
                          throw err;

                      // if successful, return the new user
                      return done(null, newUser);
                  });
              }
          });
      });
  }));

  passport.use(new GoogleStrategy({

        clientID        : '935788807691-40r74nb2dutpagt99s4fmv4lhh9vv7ur.apps.googleusercontent.com',
        clientSecret    : 'U9wauvQgsPzlHZg8XaL8uYiM',
        callbackURL     : 'http://localhost:8000/users/login/google/callback',

    },
    function(token, refreshToken, profile, done) {

        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Google
        process.nextTick(function() {

            // try to find the user based on their google id
            User.findOne({ 'google.id' : profile.id }, function(err, user) {
                if (err)
                    return done(err);

                if (user) {

                    // if a user is found, log them in
                    return done(null, user);
                } else {
                    // if the user isnt in our database, create a new user
                    var newUser          = new User();

                    // set all of the relevant information
                    newUser.google.id    = profile.id;
                    newUser.google.token = token;
                    newUser.google.name  = profile.displayName;
                    newUser.google.email = profile.emails[0].value; // pull the first email

                    // save the user
                    newUser.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }
            });
        });

    }));

  passport.use(new TwitterStrategy({

      consumerKey: 'ipKXnDh6walVuP0cKen1N98I1',
      consumerSecret: 'B2goHPQwH8TB5wggP6CrxNf2lVjb26nvWpZLhRWaqH7rSUCi0c',
        callbackURL     : 'http://localhost:8000/users/login/twitter/callback'

    },
    function(token, tokenSecret, profile, done) {

        // make the code asynchronous
    // User.findOne won't fire until we have all our data back from Twitter
        process.nextTick(function() {

            User.findOne({ 'twitter.id' : profile.id }, function(err, user) {

                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);

                // if the user is found then log them in
                if (user) {
                    return done(null, user); // user found, return that user
                } else {
                    // if there is no user, create them
                    var newUser                 = new User();

                    // set all of the user data that we need
                    newUser.twitter.id          = profile.id;
                    newUser.twitter.token       = token;
                    newUser.twitter.username    = profile.username;
                    newUser.twitter.displayName = profile.displayName;

                    // save our user into the database
                    newUser.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }
            });

    });

    }));


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.getUserById(id, function (err, user) {
        done(err, user);
    });
});

router.post('/login',
  passport.authenticate('local', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true }),
  function (req, res) {
      console.log('user heree'+res.user);
      res.redirect('/');
  });

  router.get('/login/facebook/callback',
  passport.authenticate('facebook', {
      successRedirect: '/',
      failureRedirect: '/users/login',
      failureFlash: true
  })
  );
  
  router.get('/login/google/callback',
            passport.authenticate('google', {
                    successRedirect : '/',
                    failureRedirect : '/users/login'
            }));
  router.get('/login/twitter/callback',
  passport.authenticate('twitter', {
      successRedirect: '/',
      failureRedirect: '/users/login',
      failureFlash: true
  })
  );
  router.get('/logout', function (req, res) {
      req.logout();
      req.flash('success_msg', 'You are logout');
      res.redirect('/users/login');
  });
  
module.exports = router;