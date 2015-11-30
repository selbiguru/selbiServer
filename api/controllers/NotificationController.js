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
		var createNotificationObj = req.params.body;
		sails.services['notificationservice'].createNotificationService( createNotificationObj, function(err, createResponse){
            if(err)
                return res.json(500, err);
            return res.json(createResponse);
        });
	},
	updateNotificationById: function(req, res) {
		var updateNotificationObj = req.params.body;
		sails.services['notificationservice'].updateNotificationByIdService( updateNotificationObj, req.params['notificationId'], function(err, updateResponse){
            if(err)
                return res.json(500, err);
            return res.json(updateResponse);
        });
	},
	updateNotificationByUsers: function(req, res) {
		var updateNotificationObj = req.params.body;
		sails.services['notificationservice'].updateNotificationByUsersService( updateNotificationObj, function(err, updateResponse){
            if(err)
                return res.json(500, err);
            return res.json(updateResponse);
        });
	},
	deleteNotification: function(req, res) {
		sails.services['notificationservice'].deleteNotificationService( req.params['notificationId'], function(err, deleteResponse){
            if(err)
                return res.json(500, err);
            return res.json(deleteResponse);
        });
	},
	getNotificationByUserId: function(req, res) {
		sails.services['notificationservice'].getNotificationByUserIdService( req.params['userId'], function(err, getResponse){
            if(err)
                return res.json(500, err);
            return res.json(getResponse);
        });
	},
	getByNotificationId: function(req, res) {
		sails.services['notificationservice'].getByNotificationIdService( req.params['notificationId'], function(err, getResponse){
            if(err)
                return res.json(500, err);
            return res.json(getResponse);
        });
	},
});