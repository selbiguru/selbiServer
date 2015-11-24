(function() {
    'use strict';
    /**
     * User Service
     *
     * @description :: Provides user related calls for use throughout Selbi
     */
    var async = require('async');

    /**
     *  This is a public methods to get a user by username
     *  @param      userName is the username to find
     *  @param      cb is a callback
     */
    module.exports.getUserByUsernameService = function(userName, cb) {
        sails.models['user'].findOne({where : {username: userName }}).populate('userAddress').exec(function(err, results) {
            if(err)
                 return cb(500, err);
            if(results === undefined)
                return cb(404, 'Sorry, this user does not exist!');
            return cb(err, results);
        });
    };

    /**
     *  This is a public methods to get a user by userId
     *  @param      userId is the id of the user to find
     *  @param      cb is a callback
     */
    module.exports.getUserDataService = function(userId, cb) {
        sails.models['user'].findOne({ where: { id: userId } }).populate('userAddress').exec(function(err, results){
            if(err)
                return cb(500, err);
            return cb(err, results);
        });
    };

})();