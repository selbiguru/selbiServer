(function() {
    'use strict';
    /**
     * Friend Service
     *
     * @description :: Provides friend related calls for use throughout Selbi
     */
    var async = require('async');


    /**
     *  This is a public methods to get all friends of user by userId
     *  @param      userId is the id of the user to find friends for
     *  @param      cb is a callback
     */
    module.exports.getFriendsByUserService = function(userId, cb) {
        sails.services['invitationservice'].getApprovedInvitesByIdService( userId, function(err, approvedInvites){
            var friendsApproved = approvedInvites.invitationArray;
            var friendList = [];
            if(err)
                return cb(500, err);
            async.eachLimit(friendsApproved, 100, function(inv, cbEach){
                var friendId = inv.userFrom !== userId ? inv.userFrom : inv.userTo;
                 sails.services['userservice'].getUserDataService( friendId , function(err, userResult){
                    if(err)
                        return cb(500, err);
                    userResult.invitation = [inv];
                    friendList.push(userResult);
                    cbEach();
                });
            }, function(err) {
                if(err)
                    return cb(500, err);
                return cb(err, friendList);
            });
        });
    };






    /**
     *  This is a public methods to get all invitations of user by userId
     *  @param      userId is the id of the user to find friends for
     *  @param      cb is a callback
     */
    module.exports.getAllInvitationByUserService = function(userId, cb) {
        sails.services['invitationservice'].getAllInvitesByIdService( userId, function(err, allInvites){
            var friendsApproved = allInvites.invitationArray;
            var friendList = [];
            if(err)
                return cb(500, err);
            async.eachLimit(friendsApproved, 100, function(inv, cbEach){
                var friendId = inv.userFrom !== userId ? inv.userFrom : inv.userTo;
                 sails.services['userservice'].getUserDataService( friendId , function(err, userResult){
                    if(err)
                        return cb(500, err);
                    userResult.invitation = [inv];
                    friendList.push(userResult);
                    cbEach();
                });
            }, function(err) {
                if(err)
                    return cb(500, err);
                return cb(err, friendList);
            });
        });
    };

})();