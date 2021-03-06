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
                sails.log.error("getInvitationByUserIdsService");
                return cb(500, err);
            } else {
                var invitationList = [];
                results[0] ? invitationList.push(results[0]) : '';
                results[1] ? invitationList.push(results[1]) : '';
                return cb(err, invitationList);
            }
        });
    };


    /**
     *  This is a public methods to update an invitation by invitationId
     *  @param      invitationId is the ID of the invitation to update
     *  @param      invitationBody is the object with the fields from the model that needs to be updated
     *  @param      cb is a callback
     */
    module.exports.updateFriendInvitationService = function(invitationId, invitationBody, cb) {
        sails.models['invitation'].update({where : { id: invitationId } }, invitationBody).exec(function (err, invitation) {
            if(err) {
                sails.log.error("updateFriendInvitationService");
                return cb(500, err.message);
            }
            //todo: send email
            return cb(err, invitation);
        });
    };


    /**
     *  This is a public method to create an invitation
     *  @param      createInvite is the object with data of the invitation model to create
     *  @param      cb is a callback
     */
    module.exports.createFriendInvitationService = function(createInvite, cb) {
        sails.models['invitation'].create(createInvite).exec(function (err, invitation) {
            if(err) {
                sails.log.error("createFriendInvitationService");
                return cb(500, err.message);
            }
            //todo: send email
            return cb(err, invitation);
        });
    };


    /**
     *  This is a public methods to get all approved (friends) invitations
     *  @param      userId is the userID of the user
     *  @param      cb is a callback
     */
    module.exports.getApprovedInvitesByIdService = function(userId, cb) {
        var friendsObj = {
            invitationArray: [],
            idArray: []
        }
        sails.models['invitation'].find().where({or: [{ userTo: userId },{userFrom: userId}], status: 'approved'}).exec(function(err, friendsResult) {
            if(err) {
                sails.log.error("getApprovedInvitesByIdService");
                return cb(500, err);
            }
            friendsObj.invitationArray = friendsResult;
            friendsObj.idArray.push(userId);
            for(var i in friendsResult) {
                if(friendsResult[i].userTo != userId) {
                    friendsObj.idArray.push(friendsResult[i].userTo);
                } else {
                    friendsObj.idArray.push(friendsResult[i].userFrom);
                }
            }
            return cb(err, friendsObj);
        });
    };


    /**
     *  This is a public methods to get all friends invitations
     *  @param      userId is the userID of the user
     *  @param      cb is a callback
     */
    module.exports.getAllInvitesByIdService = function(userId, cb) {
        var friendsObj = {
            invitationArray: [],
            idArray: []
        }
        sails.models['invitation'].find().where({or: [{ userTo: userId },{userFrom: userId}], status: {'!': "denied"} }).exec(function(err, allFriendsResult) {
            if(err) {
                sails.log.error("getAllInvitesByIdService");
                return cb(500, err);
            }
            friendsObj.invitationArray = allFriendsResult;
            friendsObj.idArray.push(userId);
            for(var i in allFriendsResult) {
                if(allFriendsResult[i].userTo != userId) {
                    friendsObj.idArray.push(allFriendsResult[i].userTo);
                } else {
                    friendsObj.idArray.push(allFriendsResult[i].userFrom);
                }
            }
            return cb(err, friendsObj);
        });
    };
})();