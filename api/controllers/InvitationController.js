'use strict';

var _ = require('lodash');
var async = require('async');
var self = this;

/**
 * InvitationController
 *
 * @description :: Server-side logic for managing Invitations
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {
	sendFriendInvitation: function(req, res) {
		sails.models['invitation'].create(req.params.all()).exec(function (err, invitation) {
			if(err) {
				return res.send(500, err.message);
			}
			//todo: send email
			res.json(invitation);
		});
	},
	updateFriendInvitation: function(req, res) {
		sails.models['invitation'].update({ id: req.params['invitationId']}, { status: req.params['status']}).exec(function (err, invitation) {
			if(err) {
				return res.send(500, err.message);
			}
			//todo: send email
			res.json(invitation);
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
