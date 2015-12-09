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
            sails.services['listingservice'].countListingService(deleteResponse[0].userId, function(err, countResult){
                if(err){
                    console.log('Unable to get count of listings for user');
                    return res.json(deleteResponse);
                }
                if(countResult === 0) {
                    var updateObj = {
                        hasListings: false
                    };
                    sails.services['userservice'].updateUserDataService(deleteResponse[0].userId, updateObj, function(err, updateResult) {
                        if(err) {
                            console.log('User not updated when creating a listing');
                        }
                        return res.json(deleteResponse);
                    });
                } else {
                    return res.json(deleteResponse);
                }
            });
        });
    },
    createListing: function(req, res) {
        var createListingObj = req.body;
        sails.services['listingservice'].createListingService( createListingObj, function(err, createResponse){
            if(err)
                return res.json(500, err);
            sails.services['listingservice'].countListingService(req.body['userId'], function(err, countResult){
                if(err){
                    console.log('Unable to get count of listings for user');
                    return res.json(createResponse);
                }
                if(countResult === 1) {
                    var updateObj = {
                        hasListings: true
                    };
                    sails.services['userservice'].updateUserDataService(req.body['userId'], updateObj, function(err, updateResult) {
                        if(err) {
                            console.log('User not updated when creating a listing');
                        }
                        return res.json(createResponse);
                    });
                } else {
                    return res.json(createResponse);
                }
            });
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
                query = {where: {userId: userResult.id, sort: 'createdAt DESC' } };
            } else if(req.body['friends']) {
                query = {where: {userId: userResult.id, isSold: false, sort: 'createdAt DESC' } };
            } else {
                query = {where: {userId: userResult.id, isSold: false, isPrivate: false, sort: 'createdAt DESC' } };
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
                var newResults;
                sails.models['listing'].find({ where: { userId: friendId, isSold: false, sort: 'createdAt DESC'} }).populate('user').exec(function(err, listingResult){
                    if(err) {
                        return cb(err);
                    };
                    if(listingResult.length > 0 ) {
                        newResults =  listingResult[0];
                        newResults.invitation = [inv];
                        newResults.count = listingResult.length;
                        friendListings.push(newResults);
                    };
                    cbEach();
                });
            }, function(err, results) {
                if(err)
                    return res.json(500, err);
                return res.json(_.sortByOrder(friendListings, ['createdAt'], ['desc']));
            });
        });
    },




    getSelbiListings: function(req, res) {
       sails.services['invitationservice'].poopservice( req.params['userId'], function(err, invitationResult) {
            //friendsApproved is an array of invitation objects
            var friendsApproved = invitationResult;
            var skipUsers = 2;
            /*sails.models['listing'].native(function(err, collection) {
                collection.find({$group:{ id: 'userId', total : { $sum : 1 }  } }).toArray(function (err, results) {
                    console.log('~~~~~~~~~ ', results);
                    if (err) return res.json(err);
                    return res.json(results);
                  });
            });*/
           sails.models['user'].find({where: {id: {'!':friendsApproved} } } ).populate('listings', {where:{title: 'Shoe'}},{sort: 'createdAt DESC', limit:1}).exec(function(err, listingResult){
                if(err)
                    return res.json(err);
                return res.json(listingResult);
            });
            /*sails.models['listing'].find({ where: { userId: {'!': friendsApproved}, isSold: false, sort: 'createdAt DESC'} }).exec(function(err, listingResult){
                if(err) {
                    return res.json(err);
                };
                /*if(listingResult.length > 0 ) {
                    newResults =  listingResult[0];
                    newResults.invitation = [inv];
                    newResults.count = listingResult.length;
                    friendListings.push(newResults);
                };
                return res.json(listingResult);
            });*/
       });


        
    }


});