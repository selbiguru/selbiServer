(function() {
    'use strict';
    /**
     * Notification Service
     *
     * @description :: Provides notification related calls for use throughout Selbi
     */
    var async = require('async');

    /**
     *  This is a public methods to create an notification by userIds
     *  @param      createNotificationObj
     *      @param      userFrom is the userID of the user who makes the request
     *      @param      userTo is the userID of the user
     *      @param      type is the type of notification e.g. 'friendrequest'
     *  @param      cb is a callback
     */
    module.exports.createNotificationService = function(createNotificationObj, cb) {
         sails.models['notification'].create(createNotificationObj).exec(function (err, notification) {
            if(err) {
                return cb(500, err.message);
            }
            return cb(err, notification);
        });
    };


    /**
     *  This is a public methods to update an invitation by invitationId
     *  @param      invitationId is the ID of the invitation to update
     *  @param      invitationBody is the object with the fields from the model that needs to be updated
     *  @param      cb is a callback
     */
    /*module.exports.updateNotificationByIdService = function(invitationId, invitationBody, cb) {
        sails.models['notification'].update({ id: invitationId}, invitationBody).exec(function (err, invitation) {
            if(err) {
                return cb(500, err.message);
            }
            return cb(err, invitation);
        });
    };*/


    /**
     *  This is a public method to create an invitation
     *  @param      createInvite is the object with data of the invitation model to create
     *  @param      cb is a callback
     */
    /*module.exports.updateNotificationByUsersService = function(createInvite, cb) {
        sails.models['notification'].update({ id: invitationId}, invitationBody).exec(function (err, invitation) {
            if(err) {
                return cb(500, err.message);
            }
            return cb(err, invitation);
        });
    };*/


    /**
     *  This is a public methods to delete a notification
     *  @param      notificationId is the ID of the notification to delete
     *  @param      cb is a callback
     */
    module.exports.deleteNotificationService = function(notificationId, cb) {
        sails.models['notification'].destroy({id: notificationId}).exec(function (err, deleteResult) {
            if (err)
                return cb(500, err);
            return cb(err, deleteResult);
        });
    };


    /**
     *  This is a public methods to get all notifications for a given user
     *  @param      userId is the userID of the user to return notifcations for
     *  @param      cb is a callback
     */
    module.exports.getNotificationByUserIdService = function(userId, cb) {
        sails.models['notification'].find({ where: { userTo: userId } }).exec(function(err, results){
            if(err)
                return cb(500, err);
            return cb(err, results);
        });
    };


    /**
     *  This is a public methods to get all approved (friends) invitations
     *  @param      notificationId is the ID of the notification to find
     *  @param      cb is a callback
     */
    module.exports.getByNotificationIdService = function(notificationId, cb) {
        sails.models['notification'].findOne({ where: { id: notificationId } }).exec(function(err, results){
            if(err)
                return cb(500, err);
            return cb(err, results);
        });
    };


     /**
     *  This is a public methods to get a specific notification given two userIds
     *  @param      userFrom is the userID of the requester
     *  @param      userTo is the userID of the user to return notifcations for
     *  @param      cb is a callback
     */
    module.exports.getNotificationByBothIdsService = function(userFrom, userTo, cb) {
        async.parallel([
            function(cb){
                sails.models['notification'].findOne().where({
                    userTo: userTo,
                    userFrom: userFrom,
                    type: 'friendrequest'
                }).exec(cb);
            },
            function(cb){
                sails.models['notification'].findOne().where({
                    userFrom: userTo,
                    userTo: userFrom,
                    type: 'friendrequest'
                }).exec(cb);
            }
        ], function(err, results){
            if(err) {
                return cb(500, err);
            } else {
                var notificationList = [];
                results[0] ? notificationList.push(results[0]) : '';
                results[1] ? notificationList.push(results[1]) : '';
                return cb(err, notificationList);
            }
        });
    };

})();