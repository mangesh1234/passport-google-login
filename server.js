var express = require('express');
var app = express();
var mongojs = require('mongojs');
var MongoClient = require("mongodb").MongoClient;
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User=require('./modules/user');
var session = require('express-session');
var expressValidator = require('express-validator');
var router = express.Router();
var routes = require('./routes/index');
var path    = require("path");


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

app.set('views', path.join(__dirname,'views'));
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');

app.use('/',routes);
passport.deserializeUser(function (id, done) {
    User.getUserById(id, function (err, user) {
        done(err, user);
    });
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
app.use(session({
secret:'secret',
saveUinitialized:true,
resave:true
}
));

app.use(passport.initialize());
app.use(passport.session());

app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.')
      , root = namespace.shift()
      , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));

app.get('/', function (req, res) {
   //console.log("Got a GET request for the homepage");
   console.log("Got a GET request for the homepage");
  // res.render(__dirname + "/" +"index.html");

   res.sendFile( __dirname + "/" + "index.html" );
});

app.post('/CreateUser', function (req, res) {
MongoClient.connect("mongodb://localhost:27017/authentication", function (err, db) {
 var Users = db.collection("Users");
  var document = req.query;
     Users.insert({"username":"sony","password":"abc","email":"sonalib@gmail.com"}, function(err, records){
   console.log(records);
   res.json(records);
   db.close();
});
});
});

app.get('/updateUser', function (req, res) {
	console.log(req.query);
	MongoClient.connect("mongodb://localhost:27017/authentication", function (err, db) {
    var Users = db.collection("Users");

     Users.update({"_id":mongojs.ObjectId(req.query._id)},{$set:{"Email":req.query.Email,"Password":req.query.Password,"Address":req.query.Address,"Birthday":req.query.Birthday,"PhoneNumber":req.query.PhoneNumber,"UserImage":req.query.UserImage}},function(err, records){
		console.log(records);
		res.json(records);
		db.close();
});
});
})


app.get('/GetUser', function (req, res) {
MongoClient.connect("mongodb://localhost:27017/authentication", function (err, db) {
 var Users = db.collection("Users");
     Users.find().toArray(function(err, records){
 console.log(records);
 res.json(records);
   db.close();
});
});
})

app.get('/deleteUser', function (req, res) {
	MongoClient.connect("mongodb://entongostagingmongo:DXb6rzp3bDCAMgkBocjtXxTQNaxAAtcVA3W9fSrFx95DHti2F7tqNUY1LsSlhGi5rpDcp6KmC921K5rd45f21g==@entongostagingmongo.documents.azure.com:10250/EntongoStagingdb?ssl=true", function (err, db) {
 var Users = db.collection("Users");
     Users.remove({"_id":mongojs.ObjectId(req.query._id)},function(err, records){
   res.json(records);
   db.close();
});
});

})
router.get('/login', function (req, res) {
    res.render('login');
});

module.exports = router;
var server = app.listen(8081, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

})