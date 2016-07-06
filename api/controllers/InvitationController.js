'use strict';

var _ = require('lodash');
var async = require('async');

/**
 * InvitationController
 *
 * @description :: Server-side logic for managing Invitations
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {
	sendFriendInvitation: function(req, res) {
		var notificationObj = {
			userFrom: req.body['userFrom'],
			userTo: req.body['userTo'],
			type: 'friendrequest'
		}
		var responseObj = {
			invitation: '',
			notification: ''
		}
		async.parallel([
            function(cb){
                sails.services['invitationservice'].createFriendInvitationService( req.params.all(), function(err, createResponse){
		            if(err)
		                return cb(500, err);
		            responseObj.invitation = createResponse;
		            cb(err, createResponse);
		        });
            },
            function(cb){
                sails.services['notificationservice'].createNotificationService( notificationObj, function(err, createResponse){
		            if(err)
		                return cb(500, err);
		            responseObj.notification = createResponse;
		            cb(err, createResponse);
		        });
            }
        ], function(err, results){
            if(err) {
            	sails.log.error('sendFriendInvitation');
                sails.log.error(new Error(err));
                return res.json(500, err);
            } else {
                return res.json(responseObj);
            }
        });
	},
	updateFriendInvitation: function(req, res) {
		var responseObj = {
			invitation: '',
			notification: ''
		};
		async.parallel([
			function(cb) {
				sails.services['invitationservice'].updateFriendInvitationService( req.params['invitationId'], req.body, function(err, invitationResponse){
		            if(err)
		                return cb(500, err);
		            responseObj.invitation = invitationResponse;
		            cb(err, invitationResponse);
		        });
			},
			function(cb) {
				sails.services['notificationservice'].getNotificationByBothIdsService(req.body['userTo'], req.body['userFrom'], function(err, notificationResults) {
					if(err)
						return cb(500, err);
					if(notificationResults.length > 0 && (req.body['status'] === 'denied' || req.body['status'] === 'approved' )) {
						sails.services['notificationservice'].deleteNotificationService(notificationResults[0].id, function(err, deleteResults) {
		            		if(err)
		            			return cb(500, err);
		            		responseObj.notification = deleteResults;
		            		cb(err, deleteResults);
		            	});
					} else if(req.body['status'] === 'pending') {
						var notificationObj = {
							userFrom: req.body['userFrom'],
							userTo: req.body['userTo'],
							type: 'friendrequest'
						};
						sails.services['notificationservice'].createNotificationService( notificationObj, function(err, createResponse){
				            if(err)
				                return cb(500, err);
				            responseObj.notification = createResponse;
				            cb(err, createResponse);
				        });
					} else {
						cb();
					}
				});
			}
		], function(err, results){
            if(err) {
            	sails.log.error('updateFriendInvitation');
                sails.log.error(new Error(err));
                return res.json(500, err);
            } else {
                return res.json(responseObj);
            }
        });
	},



	updateFriendInvitationByUserIds: function(req, res) {
		var notificationId = req.body['notificationId'];
		delete req.body.notificationId;
		var responseObj = {
			invitation: '',
			notification: ''
		};
		sails.services['invitationservice'].getInvitationByUserIdsService(req.body['userTo'], req.body['userFrom'], function(err, invitationResponse) {
			if(err) {
				sails.log.error('updateFriendInvitationByUserIds, get invitation by user Ids');
				return res.json(500, err);
			}
			async.parallel([
				function(cb) {
					sails.services['invitationservice'].updateFriendInvitationService(invitationResponse[0].id, req.body, function(err, updateResults) {
						if(err)
			                return cb(500, err);
			            responseObj.invitation = updateResults;
			            cb(err, updateResults);
					});
				},
				function(cb) {
					if(notificationId && (req.body['status'] === 'denied' || req.body['status'] === 'approved') ) {
						sails.services['notificationservice'].deleteNotificationService(notificationId, function(err, deleteResults) {
		            		if(err)
		            			return cb(500, err);
		            		responseObj.notification = deleteResults;
		            		cb(err, deleteResults);
		            	});
					} else if(req.body['status'] === 'pending') {
						var notificationObj = {
							userFrom: req.body['userFrom'],
							userTo: req.body['userTo'],
							type: 'friendrequest'
						};
						sails.services['notificationservice'].createNotificationService( notificationObj, function(err, createResponse){
				            if(err)
				                return cb(500, err);
				            responseObj.notification = createResponse;
				            cb(err, createResponse);
				        });
					} else {
						cb();
					}
				}
			], function(err, results) {
				if(err) {
					sails.log.error('updateFriendInvitationByUserIds');
                	sails.log.error(new Error(err));
	                return res.json(500, err);
	            } else {
	                return res.json(responseObj);
	            }
			});
		});
	},
	getInvitationByUserIds: function(req, res) {
		sails.services['invitationservice'].getInvitationByUserIdsService( req.params['userId'], req.params['friendId'], function(err, invitationsResponse){
            if(err) {
            	sails.log.error('getInvitationByUserIds');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            return res.json(invitationsResponse);
        });
	},
	getInvitationByUsername: function(req, res) {
		sails.services['userservice'].getUserByUsernameService( req.params['username'], function(err, usernameResponse){
            var invitationUser = usernameResponse
            if(err) {
            	sails.log.error('getInvitationByUsername, get user by username ', err);
                return res.json(500, err);
            }
            sails.services['invitationservice'].getInvitationByUserIdsService( req.params['userId'], usernameResponse.id, function(err, invitationResponse){
	           invitationUser.invitation = invitationResponse;
	            if(err) {
	            	sails.log.error('getInvitationByUsername, get invitation by user Ids');
                	sails.log.error(new Error(err));
	                return res.json(500, err);
	            }
	            return res.json(invitationUser);
	        });
        });
	},
});
