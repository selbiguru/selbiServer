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
        sails.services['invitationservice'].getApprovedInvitesByIdService( req.params['userId'], function(err, invitationResult) {
            //friendsApproved = array of invitation objects
            var friendsApproved = invitationResult;
            var friendListings = [];
            if(err)
                return res.json(500, err);
            async.eachLimit(friendsApproved, 100, function(inv, cbEach){
                var friendId = inv.userFrom !== req.params['userId'] ? inv.userFrom : inv.userTo;
                async.parallel([
                    function(cb){
                        sails.services['userservice'].getUserDataService( friendId , function(err, userResult){
                            if(err)
                                return cb(err);
                            userResult.ext = 'user';
                            cb(err, userResult);
                        });
                    },
                    function(cb){
                        var newResults;
                        sails.models['listing'].find({ where: { userId: friendId, isSold: false} }).exec(function(err, listingResult){
                            if(err) {
                                return cb(err);
                            };
                            if(listingResult.length > 0 ) {
                                listingResult.ext = 'listing';
                               newResults =  _.sortByOrder(listingResult, ['createdAt'], ['desc'])[0];
                            };
                            cb(err, newResults);
                        });
                    }
                ], function(err, results){
                    if(err)
                        return cbEach(err);
                    if(results[0] && results[1]) {
                        if(results[0].ext === 'listing') {
                            results[0].friend = results[1];
                            results[0].invitation = [inv];
                            friendListings.push(results[0]);
                        } else {
                            results[1].friend = results[0];
                            results[1].invitation = [inv];
                            friendListings.push(results[1]);
                        }
                    }
                    return cbEach();
                });
            }, function(err, results) {
                if(err)
                    return res.json(500, err);
                return res.json(_.sortByOrder(friendListings, ['createdAt'], ['desc']));
            });
        });
    },

        /*sails.services['friendservice'].getFriendsByUserService( req.params['userId'], function(err, friendsResult) {
            //friendsResult = array of friend objects
            var friendsArray = friendsResult;
            var plop = [];
            if(err)
                return res.json(500,err);
            async.eachLimit(friendsArray, 100, function(friend, cbEach){
                var friendId = friend.id;
                sails.models['listing'].find({ where: { userId: friendId } }).exec(function(err, listingResult){
                    if(err) {
                        return res.json(500, err);
                    };
                    if(listingResult.length > 0 ) {
                        friend.listing = _.sortByOrder(listingResult, ['createdAt'], ['desc'])[0];
                        friend.listingDate = friend.listing.createdAt;
                        plop.push(friend);
                    };
                    cbEach();
                });
            }, function(err) {
                if(err)
                    return res.json(500, err);
                return res.json(_.sortByOrder(plop, ['listingDate'], ['desc']));
            });
        });*/




});