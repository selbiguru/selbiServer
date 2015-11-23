(function() {
    'use strict';
    /**
     * Invitation Service
     *
     * @description :: Provides invitation related calls for use throughout Selbi
     */
    var async = require('async');

    /**
     *  This is a public methods to get an invitation by userIds
     *  @param      fromId is the userID of the user
     *  @param      toId is the userID of the second user you are trying to find
     *  @param      cb is a callback
     */
    module.exports.getInvitationByUserIdsService = function(fromId, toId, cb) {
        async.parallel([
            function(cb){
                sails.models['invitation'].findOne().where({
                    userTo: fromId,
                    userFrom: toId
                }).exec(cb);
            },
            function(cb){
                sails.models['invitation'].findOne().where({
                    userFrom: fromId,
                    userTo: toId
                }).exec(cb);
            }
        ], function(err, results){
            if(err) {
                return cb(500, err);
            } else {
                var invitationList = [];
                results[0] ? invitationList.push(results[0]) : '';
                results[1] ? invitationList.push(results[1]) : '';
                return cb(err, invitationList);
            }
        });
    };

})();