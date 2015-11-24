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
		sails.services['invitationservice'].getApprovedInvitesByIdService( req.params['userId'], function(err, approvedInvites){
            var friendsApproved = approvedInvites;
            var friendList = [];
            if(err)
                return res.json(500, err);
			async.eachLimit(friendsApproved, 100, function(inv, cbEach){
				var friendId = inv.userFrom !== req.params['userId'] ? inv.userFrom : inv.userTo;
				 sails.services['userservice'].getUserDataService( friendId , function(err, userResult){
		            if(err)
		                return res.json(500, err);
					userResult.invitation = [inv];
					friendList.push(userResult);
					cbEach();
		        });
			}, function(err) {
				if(err)
					return res.json(500, err);
				return res.json(friendList);
			});
        });
	}
});
