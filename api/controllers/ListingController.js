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

    deleteListing: function(req, res) {
        sails.services['listingservice'].deleteListingService( req.params['id'], function(err, deleteResponse){
            if(err)
                return res.json(500, err);
            return res.json(deleteResponse);
        });
    },
    updateListing: function(req, res){
        sails.models['listing'].update({where : { id: req.params['id'] } }, req.body).exec(function(err, updateResults){     
            if(err) 
                return res.json(500, err);
            return res.json(updateResults);
        });
    },
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
    getUserListings: function(req, res){
        sails.models['user'].findOne({ where: { id: req.params['userId'] } }).exec(function(err, userResult) {
            var query;
            if(err) {
                return res.json(500, err);
            }
            var listingByIdObj = {
                firstName: userResult.firstName,
                lastName: userResult.lastName
            };
            if(req.body['myself']) {
                query = {where: {userId: req.params['userId'], sort: 'createdAt DESC' } };
            } else if(req.body['friends']) {
                query = {where: {userId: req.params['userId'], isSold: false, sort: 'createdAt DESC' } };
            } else {
                query = {where: {userId: req.params['userId'], isSold: false, isPrivate: false, sort: 'createdAt DESC' } };
            }
            sails.models['listing'].find(query).exec(function(err, results){
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
            var query;
            if(err) {
                return res.json(500, err);
            }
            var listingByUsernameObj = {
                firstName: userResult.firstName,
                lastName: userResult.lastName
            };
            if(req.body['myself']) {
                query = {where: {userId: req.params['userId'], sort: 'createdAt DESC' } };
            } else if(req.body['friends']) {
                query = {where: {userId: req.params['userId'], isSold: false, sort: 'createdAt DESC' } };
            } else {
                query = {where: {userId: req.params['userId'], isSold: false, isPrivate: false, sort: 'createdAt DESC' } };
            }
            sails.models['listing'].find(query).exec(function(err, results){
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
            //friendsApproved is an array of invitation objects
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
                        sails.models['listing'].find({ where: { userId: friendId, isSold: false, sort: 'createdAt DESC'} }).exec(function(err, listingResult){
                            if(err) {
                                return cb(err);
                            };
                            if(listingResult.length > 0 ) {
                                newResults =  listingResult[0];
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
});