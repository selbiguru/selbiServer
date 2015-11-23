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
		var userId = req.params['userId'];
		var friendId = req.params['friendId'];
		async.parallel([
			function(cb){
				sails.models['invitation'].findOne().where({
					userTo: userId,
					userFrom: friendId
				}).exec(cb);
			},
			function(cb){
				sails.models['invitation'].findOne().where({
					userFrom: userId,
					userTo: friendId
				}).exec(cb);
			}
		], function(err, results){
			if(err) {
				return res.json(500, err);
			} else {
				var invitationList = [];
				results[0] ? invitationList.push(results[0]) : '';
				results[1] ? invitationList.push(results[1]) : '';
				return res.json(invitationList);
			}
		});
	}
});
