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
		sails.services['invitationservice'].createFriendInvitationService( req.params.all(), function(err, createResponse){
            if(err)
                return res.json(500, err);
            return res.json(createResponse);
        });
	},
	updateFriendInvitation: function(req, res) {
		sails.services['invitationservice'].updateFriendInvitationService( req.params['invitationId'], req.body, function(err, invitationResponse){
            if(err)
                return res.json(500, err);
            return res.json(invitationResponse);
        });
	},
	getInvitationByUserIds: function(req, res) {
		sails.services['invitationservice'].getInvitationByUserIdsService( req.params['userId'], req.params['friendId'], function(err, invitationsResponse){
            if(err)
                return res.json(500, err);
            return res.json(invitationsResponse);
        });
	},
	getInvitationByUsername: function(req, res) {
		sails.services['userservice'].getUserByUsernameService( req.params['username'], function(err, usernameResponse){
            var invitationUser = usernameResponse
            if(err)
                return res.json(500, err);
            sails.services['invitationservice'].getInvitationByUserIdsService( req.params['userId'], usernameResponse.id, function(err, invitationResponse){
	           invitationUser.invitation = invitationResponse;
	            if(err)
	                return res.json(500, err);
	            return res.json(invitationUser);
	        });
        });
	},
});
