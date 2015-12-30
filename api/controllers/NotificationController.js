'use strict';

var _ = require('lodash');
var async = require('async');

/**
 * NotificationController
 *
 * @description :: Server-side logic for managing Notifications
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {
	createNotification: function(req, res) {
		var createNotificationObj = req.body;
		sails.services['notificationservice'].createNotificationService( createNotificationObj, function(err, createResponse){
            if(err)
                return res.json(500, err);
            return res.json(createResponse);
        });
	},
	/*updateNotificationById: function(req, res) {
		var updateNotificationObj = req.body;
		sails.services['notificationservice'].updateNotificationByIdService( updateNotificationObj, req.params['notificationId'], function(err, updateResponse){
            if(err)
                return res.json(500, err);
            return res.json(updateResponse);
        });
	},
	updateNotificationByUsers: function(req, res) {
		var updateNotificationObj = req.body;
		sails.services['notificationservice'].updateNotificationByUsersService( updateNotificationObj, function(err, updateResponse){
            if(err)
                return res.json(500, err);
            return res.json(updateResponse);
        });
	},*/
	deleteNotification: function(req, res) {
		sails.services['notificationservice'].deleteNotificationService( req.params['notificationId'], function(err, deleteResponse){
            if(err)
                return res.json(500, err);
            return res.json(deleteResponse);
        });
	},
    countNotifications: function(req, res) {
        sails.services['notificationservice'].countNotificationService( req.params['userId'], function(err, countResponse){
            if(err)
                return res.json(500, err);
            return res.json(countResponse);
        });
    },
	getNotificationByUserId: function(req, res) {
        var notifcationArray = [];
		sails.services['notificationservice'].getNotificationByUserIdService( req.params['userId'], function(err, getResponse){
            if(err)
                return res.json(500, err);
            async.eachLimit(getResponse, 10, function(notification, cbEach){
                var requesterId = notification.userFrom;
                sails.models['user'].findOne({ where: { id: requesterId } }).exec(function(err, userResult){
                    if(err) {
                        return res.json(500, err);
                    };
                    notification.userFromInfo = userResult;
                    notifcationArray.push(notification);
                    cbEach();
                });
            }, function(err) {
                if(err)
                    return res.json(500, err);
                return res.json(notifcationArray);
            });
        });
	},
	getByNotificationId: function(req, res) {
        var notifcationArray = [];
		sails.services['notificationservice'].getByNotificationIdService( req.params['notificationId'], function(err, getResponse){
            if(err)
                return res.json(500, err);
            var requesterId = notification.userFrom;
            sails.models['user'].findOne({ where: { id: requesterId } }).exec(function(err, userResult){
                if(err) {
                    return res.json(500, err);
                };
                notification.userFromInfo = userResult;
                notifcationArray.push(notification);
                return res.json(notifcationArray);
            });
        });
	},
});