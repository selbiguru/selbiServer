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
        sails.models['user'].findOne({where : {username: userName }}).exec(function(err, results) {
            if(err)
                 return cb(500, err);
            if(results === undefined)
                return cb(404, 'Sorry, this user does not exist!');
            return cb(err, results);
        });
    };

})();