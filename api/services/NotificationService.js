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
     *      @param      fromId is the userID of the user who makes the request
     *      @param      userTo is the userID of the user
     *      @param      type is the type of notification e.g. 'friend'
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
    module.exports.updateNotificationByIdService = function(invitationId, invitationBody, cb) {
        sails.models['notification'].update({ id: invitationId}, invitationBody).exec(function (err, invitation) {
            if(err) {
                return cb(500, err.message);
            }
            return cb(err, invitation);
        });
    };


    /**
     *  This is a public method to create an invitation
     *  @param      createInvite is the object with data of the invitation model to create
     *  @param      cb is a callback
     */
    module.exports.updateNotificationByUsersService = function(createInvite, cb) {
        sails.models['notification'].update({ id: invitationId}, invitationBody).exec(function (err, invitation) {
            if(err) {
                return cb(500, err.message);
            }
            return cb(err, invitation);
        });
    };


    /**
     *  This is a public methods to get all approved (friends) invitations
     *  @param      userId is the userID of the user
     *  @param      cb is a callback
     */
    module.exports.deleteNotificationService = function(userId, cb) {
        sails.models['notification'].destroy({id: results.userPaymentMethod.id}).exec(function deleteCB(err) {
            if (err)
                console.log('Error deleting record from our db');
        });
    };


    /**
     *  This is a public methods to get all approved (friends) invitations
     *  @param      userId is the userID of the user
     *  @param      cb is a callback
     */
    module.exports.getNotificationByUserIdService = function(userId, cb) {
        sails.models['notification'].findOne({ where: { id: userId } }).populate('userAddress').exec(function(err, results){
            if(err)
                return cb(500, err);
            return cb(err, results);
        });
    };


    /**
     *  This is a public methods to get all approved (friends) invitations
     *  @param      userId is the userID of the user
     *  @param      cb is a callback
     */
    module.exports.getByNotificationIdService = function(userId, cb) {
        sails.models['notification'].findOne({ where: { id: userId } }).populate('userAddress').exec(function(err, results){
            if(err)
                return cb(500, err);
            return cb(err, results);
        });
    };

})();