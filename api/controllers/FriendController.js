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
		var userId = req.params['userId'];
		async.parallel([
			function(cb){
				sails.models['invitation'].find().where({
					userTo: userId
				}).exec(cb);
			},
			function(cb){
				sails.models['invitation'].find().where({
					userFrom: userId
				}).exec(cb);
			}
		], function(err, results){
			var friendsResult = results[0].concat(results[1]);
			var friendList = [];
			async.eachLimit(friendsResult, 100, function(inv, cbEach){
				var friendId = inv.userFrom !== userId ? inv.userFrom : inv.userTo;
				sails.models['user'].findOne({ where: {id: friendId} }).exec(function(err, userResult){
					if(!err) {
						friendList.push(userResult);
					}
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
