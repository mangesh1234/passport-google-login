var bcrypt = require('bcryptjs');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/authentication');
var UserSchema = mongoose.Schema({
    username:{
    type:String,
    index:true
    },
    password:{
    type:String
    }, email:{
    type:String
    },
    name:{
    type:String
    }
});

var User = module.exports = mongoose.model('User', UserSchema);
module.exports.createUser = function (newUser, callback) {
    console.log('here is create function' + newUser);
    bcrypt.genSalt(10, function (err, salt) {
        if (err) throw next(err); 
        console.log('here genSalt' + salt);
        bcrypt.hash(newUser.password, salt, function (err, hash) {
            if (err) throw next(err); 
            newUser.password = hash;
            console.log('password side' + newUser);
            newUser.save(callback);
        });
    });

}



module.exports.getUserById = function (id, callback) {
        User.findById(id, callback);
}
module.exports.getUserByUsername = function (userName, callback) {
    var query = { username: userName };
    User.findOne(query, callback);
}

module.exports.comparePassword = function (candidatePassword, hash, callback) {
    bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
        if (err) throw err;
        callback(null, isMatch);
    });
}