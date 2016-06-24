'use strict';

var _ = require('lodash');
var async = require('async');

/**
 * FriendController
 *
 * @description :: Server-side logic for managing Friend
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {
	getFriendsByUser: function(req, res) {
		sails.services['friendservice'].getFriendsByUserService( req.params['userId'], function(err, friendsResult){
			if(err) {
				sails.log.error('getFriendsByUser');
                sails.log.error(new Error(err));
                return res.json(500, err);
			}
            return res.json(friendsResult);
		});
	},
	//Includes pending friends
	getAllFriendsByUser: function(req, res) {
		sails.services['friendservice'].getAllInvitationByUserService( req.params['userId'], function(err, allFriendsResult){
			if(err) {
				sails.log.error('getAllFriendsByUser');
                sails.log.error(new Error(err));
                return res.json(500, err);
			}
            return res.json(allFriendsResult);
		});
	},
	addFriendsByPhone: function(req, res) {
		var phoneList = req.body;
		var responseList = [];

		async.eachLimit(phoneList, 10, function(newPhone, cbEach){
			sails.models['user'].findOne({ where: {phoneNumber: newPhone }}).exec(function(err, result){
				if(err)
					return cbEach(err, null);
				if(result && result.id) {
					var createInvitationObject = {
						userFrom: req.params['userId'],
						userTo: result.id,
						status: 'approved',
					};
					sails.services['invitationservice'].createFriendInvitationService( createInvitationObject, function(err, createResult) {
						if(err) {
							return cbEach(err, null);
						}
						responseList.push(createResult);
						cbEach();
					});
				} else {
					cbEach();
				}
			});
		}, function(err){
			if(err) {
				sails.log.error('addFriendsByPhone');
                sails.log.error(new Error(err));
				return res.json(500, err);
			}
			return res.json(responseList);
		});
	},
});
