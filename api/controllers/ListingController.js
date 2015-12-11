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

    archiveListing: function(req, res) {
        var updateObj = {
            isArchived: req.body['isArchived']
        }
        async.parallel([
            function(cb){
                sails.services['imageservice'].deleteCloudinaryImageService(req.body['images'], function(err, deletedImagesResult) {
                    if(err) 
                        return cb(500, 'Could not delete cloudinary images from listing');
                    return cb();
                });
            },
            function(cb){
                sails.services['listingservice'].updateListingService(req.params['id'], updateObj, function(err, updateResults) {
                    if(err) 
                        return cb(500, err);
                    sails.services['listingservice'].countListingService(updateResults[0].user, function(err, countResult){
                        if(err){
                            console.log('Unable to get count of listings for user');
                            return cb(500, countResult);
                        }
                        if(countResult === 0) {
                            var updateUserObj = {
                                hasListings: false
                            };
                            sails.services['userservice'].updateUserDataService(updateResults[0].user, updateUserObj, function(err, updateUserResult) {
                                if(err) {
                                    console.log('User not updated when updating a listing');
                                    return cb(500, updateUserResult);
                                }
                                return cb(null, updateResults);
                            });
                        } else {
                            return cb(null, updateResults);
                        }
                    });
                });
            }
        ], function(err, results) {
            if(err)
                return res.json(500, err);
            return res.json(results);
        });
    },
    deleteListing: function(req, res) {
        sails.services['imageservice'].deleteCloudinaryImageService(req.body['images'], function(err, deletedImagesResult) {
            if(err)
                console.log('Could not delete cloudinary images from listing ', err);
        });
        sails.services['listingservice'].deleteListingService( req.params['id'], function(err, deleteResponse){
            if(err)
                return res.json(500, err);
            sails.services['listingservice'].countListingService(deleteResponse[0].userId, function(err, countResult){
                if(err){
                    console.log('Unable to get count of listings for user');
                    return res.json(500, countResult);
                }
                if(countResult === 0) {
                    var updateObj = {
                        hasListings: false
                    };
                    sails.services['userservice'].updateUserDataService(deleteResponse[0].userId, updateObj, function(err, updateResult) {
                        if(err) {
                            console.log('User not updated when deleting a listing');
                            return res.json(500, updateResult);
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
        sails.services['listingservice'].updateListingService(req.params['id'], req.body, function(err, updateResults) {
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
                query = {where: {userId: req.params['userId'], isArchived: false, sort: 'createdAt DESC' } };
            } else if(req.body['friends']) {
                query = {where: {userId: req.params['userId'], isSold: false, isArchived: false, sort: 'createdAt DESC' } };
            } else {
                query = {where: {userId: req.params['userId'], isSold: false, isArchived: false, isPrivate: false, sort: 'createdAt DESC' } };
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
                query = {where: {userId: userResult.id, isArchived: false, sort: 'createdAt DESC' } };
            } else if(req.body['friends']) {
                query = {where: {userId: userResult.id, isSold: false, isArchived: false, sort: 'createdAt DESC' } };
            } else {
                query = {where: {userId: userResult.id, isSold: false, isArchived: false, isPrivate: false, sort: 'createdAt DESC' } };
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
            //friendsApproved is an array of friend's IDs
            var friendsApproved = invitationResult.idArray;
            var i = friendsApproved.indexOf(req.params['userId']);
            friendsApproved.splice(i, 1);
            var skipUsers = 2;
            var selbiArray = [];
            sails.models['user'].find({where: {id: friendsApproved, hasListings: true, sort: 'updatedAt DESC' } } ).populate('listings', {where:{isSold: false, isArchived: false }, sort: 'createdAt DESC', limit:1}).exec(function(err, listingResult){
                if(err)
                    return res.json(err);
                async.eachLimit(listingResult, 20, function(userList, cbEach){
                    async.parallel([
                        function(cb){
                            sails.models['listing'].count({ 
                                where: { userId: userList.id, isSold: false, isArchived: false} 
                            }).exec(cb);
                        },
                        function(cb){
                            sails.services['invitationservice'].getInvitationByUserIdsService( userList.id, req.params['userId'], function(err, inviteResult) {
                                if(err) {
                                    cb(err);
                                }
                                cb(null, inviteResult);
                            });
                        }
                    ], function(err, results){
                        if(err) {
                            return cbEach(500, err);
                        } else {
                            results[0].length === undefined ? userList.count = results[0] : userList.count = results[1];
                            results[1].length != undefined ? userList.invitation = results[1] : userList.invitation = results[0];
                            selbiArray.push(userList);
                            cbEach();
                        }
                    });
                }, function(err, results) {
                    if(err)
                        return res.json(500, err);
                    return res.json(_.sortByOrder(selbiArray, ['updatedAt'], ['desc']));
                });
            });
       });
    },
    getSelbiListings: function(req, res) {
       sails.services['invitationservice'].getApprovedInvitesByIdService( req.params['userId'], function(err, invitationResult) {
            //friendsApproved is an array of friend's IDs
            var friendsApproved = invitationResult.idArray;
            var skipUsers = 2;
            var selbiArray = [];
            sails.models['user'].find({where: {id: {'!':friendsApproved}, hasListings: true, sort: 'updatedAt DESC' } } ).populate('listings', {where:{isSold: false, isArchived: false, isPrivate: false }, sort: 'createdAt DESC', limit:1}).exec(function(err, listingResult){
                if(err)
                    return res.json(err);
                async.eachLimit(listingResult, 20, function(userList, cbEach){
                    async.parallel([
                        function(cb){
                            sails.models['listing'].count({ 
                                where: { userId: userList.id, isSold: false, isArchived: false, isPrivate: false} 
                            }).exec(cb);
                        },
                        function(cb){
                            sails.services['invitationservice'].getInvitationByUserIdsService( userList.id, req.params['userId'], function(err, inviteResult) {
                                if(err) {
                                    cb(err);
                                }
                                cb(null, inviteResult);
                            });
                        }
                    ], function(err, results){
                        if(err) {
                            return cbEach(500, err);
                        } else {
                            results[0].length === undefined ? userList.count = results[0] : userList.count = results[1];
                            results[1].length != undefined ? userList.invitation = results[1] : userList.invitation = results[0];
                            selbiArray.push(userList);
                            cbEach();
                        }
                    });
                }, function(err, results) {
                    if(err)
                        return res.json(500, err);
                    return res.json(_.sortByOrder(selbiArray, ['updatedAt'], ['desc']));
                });
            });
       });        
    }
});