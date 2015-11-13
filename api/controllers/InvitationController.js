'use strict';

var _ = require('lodash');

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
	}
});
