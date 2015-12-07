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
        sails.models['listing'].findOne({where: {id: req.params['id']}}).populate('user').exec(function(err, results){     
            if(err) 
                return res.json(500, err);
            return res.json(results);
        });
    },
    getListing: function(req, res){
        sails.models['listing'].findOne({ where: { id: req.params['id'] } }).populate('user').exec(function(err, results){
            if(err) 
                return res.json(500, err);
            return res.json(results);
        });
    },
    updateUserListing: function(req, res){
        sails.models['listing'].update({where : { id: req.params['userId'] } }, req.body).exec(function(err, updateResults){     
            if(err) 
                return res.json(500, err);
            return res.json(updateResults);
        });
    },
    getUserListings: function(req, res){
        sails.models['user'].findOne({ where: { id: req.params['userId'] } }).exec(function(err, userResult) {
            if(err) {
                return res.json(500, err);
            }
            var listingByIdObj = {
                firstName: userResult.firstName,
                lastName: userResult.lastName
            };
            sails.models['listing'].find({ where: { userId: req.params['userId'], sort: 'createdAt DESC' } }).exec(function(err, results){
                if(err) {
                    return res.json(500, err);
                }
                listingByIdObj.listings = results;
                return res.json(listingByIdObj);
            });
        });
    },
    getUsernameListings: function(req, res){
        sails.models['user'].findOne({ where: { username: req.params['username'] } }).exec(function(err, userResult) {
            if(err) {
                return res.json(500, err);
            }
            var listingByUsernameObj = {
                firstName: userResult.firstName,
                lastName: userResult.lastName
            };
            sails.models['listing'].find({ where: { userId: userResult.id, sort: 'createdAt DESC' } }).exec(function(err, results){
                if(err) {
                    return res.json(500, err);
                }
                listingByUsernameObj.listings = results;
                return res.json(listingByUsernameObj);
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
                                newResults =  _.sortByOrder(listingResult, ['createdAt'], ['desc'])[0];
                                newResults.ext = 'listing';
                            };
                            cb(err, newResults);
                        });
                    },
                    function(cb){
                        var counter = {};
                        sails.models['listing'].count({where: {userId: friendId, isSold: false}}).exec(function(err, countResult){
                            if(err)
                                return cb(err);
                            if(countResult) {
                                counter.count = countResult;
                                counter.ext =  'count';
                            };
                            cb(err, counter);
                        });
                    },
                ], function(err, results){
                    if(err)
                        return cbEach(err);
                    if(results[0] && results[1] && results[2]) {

                        var listing = results[0].ext === 'listing' ? results[0] : results[1].ext === 'listing' ? results[1] : results[2];
                        var user = results[0].ext === 'user' ? results[0] : results[1].ext === 'user' ? results[1] : results[2];
                        var counter = results[0].ext === 'count' ? results[0] : results[1].ext === 'count' ? results[1] : results[2];
                        listing.friend = user;
                        listing.invitation = [inv];
                        listing.counter = counter;
                        friendListings.push(listing);

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
                        sails.models['listing'].count({where: {userId: friendId, isSold: false}}).exec(function(err, countResult){
                            console.log("9090909090909090", countResult);
                        });
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
        });
    }*/

});