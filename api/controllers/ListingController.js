'use strict';

var _ = require('lodash');
var async = require('async');

/**
 * ListingController
 *
 * @description :: Server-side logic for managing Listing
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {

    findOne: function(req, res){
    	sails.models['listing'].findOne(req.params['id']).populate('user').exec(function(err, results){		
    		if(err) 
    			return res.json(500, err);
    		return res.json(results);
    	});
    },
    getUserListings: function(req, res){
    	sails.models['listing'].find({ where: { userId: req.params['userId'], sort: 'createdAt DESC' } }).exec(function(err, results){
    		if(err) 
    			return res.json(500, err);
    		return res.json(results);
    	});
    },
    getUsernameListings: function(req, res){
        sails.models['user'].find({ where: { username: req.params['username'] } }).exec(function(err, userResult) {
            if(err)
                return res.json(500, err);
            sails.models['listing'].find({ where: { userId: userResult[0].id, sort: 'createdAt DESC' } }).exec(function(err, results){
                if(err) 
                    return res.json(500, err);
                return res.json(results);
            });
        });
    },
    getFriendsListings: function(req, res){
        /*1.) have UserId need to get all friends ids
        2.) Find friends that have at least one listing not sold
            a.) sort by newest
        3.) return*/

        sails.services['friendservice'].getFriendsByUserService( req.params['userId'], function(err, friendsResult) {
            //friendsResult = array of friend objects
            var friendsArray = friendsResult;
            var plop = [];
            if(err)
                return res.json(500,err);
            async.eachLimit(friendsArray, 100, function(friend, cbEach){
                var friendId = friend.id;
                sails.models['listing'].find({ where: { userId: friendId}, sort: 'title DESC' }).exec(function(err, listingResult){
                    if(err) {
                        return res.json(500, err);
                    }
                    friend.listing = listingResult
                    plop.push(friend);
                    cbEach();
                });
            }, function(err) {
                if(err)
                    return res.json(500, err);
                return res.json(plop);
            });
        });
    },
});