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
			if(err)
                return res.json(500, err);
            return res.json(friendsResult);
		});
	}
});
