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
                        return cb(500, updateResults);
                    sails.services['listingservice'].countListingService(updateResults[0].user, function(err, countResult){
                        if(err)
                            return cb(500, countResult);
                        if(countResult === 0) {
                            var updateUserObj = {
                                hasListings: false
                            };
                            sails.services['userservice'].updateUserDataService(updateResults[0].user, updateUserObj, function(err, updateUserResult) {
                                if(err)
                                    return cb(500, updateUserResult);
                                return cb(null, updateResults);
                            });
                        } else {
                            return cb(null, updateResults);
                        }
                    });
                });
            }
        ], function(err, results) {
            if(err) {
                sails.log.error('archiveListing');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            return res.json(results);
        });
    },
    deleteListing: function(req, res) {
        var cloudinaryImages = req.body['images'] || false
        sails.services['imageservice'].deleteCloudinaryImageService(cloudinaryImages, function(err, deletedImagesResult) {
            if(err) {
                sails.log.error('deleteListing, delete cloudinary images from listing');
                sails.log.error(new Error(err));
            }
        });
        sails.services['listingservice'].deleteListingService( req.params['id'], function(err, deleteResponse){
            if(err) {
                sails.log.error('deleteListing, delete listings');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            sails.services['listingservice'].countListingService(deleteResponse[0].userId, function(err, countResult){
                if(err){
                    sails.log.error('deleteListing, count listings');
                    sails.log.error(new Error(err));
                    return res.json(500, countResult);
                }
                if(countResult === 0) {
                    var updateObj = {
                        hasListings: false
                    };
                    sails.services['userservice'].updateUserDataService(deleteResponse[0].userId, updateObj, function(err, updateResult) {
                        if(err) {
                            sails.log.error('deleteListing, update user db');
                            sails.log.error(new Error(err));
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
            if(err) {
                sails.log.error('createListing, creating listing');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            sails.services['listingservice'].countListingService(req.body['userId'], function(err, countResult){
                if(err){
                    sails.log.error('createListing, count listing');
                    sails.log.error(new Error(err));
                    return res.json(createResponse);
                }
                if(countResult === 1) {
                    var updateObj = {
                        hasListings: true
                    };
                    sails.services['userservice'].updateUserDataService(req.body['userId'], updateObj, function(err, updateResult) {
                        if(err) {
                            sails.log.error('createListing, update user db');
                            sails.log.error(new Error(err));
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
            if(err) {
                sails.log.error('updateListing, update listing in db');
                sails.log.error(new Error(err));
                return res.json(500, updateResults);
            }
            return res.json(updateResults);
        });
    },
    findOne: function(req, res){
        sails.services['listingservice'].findOneListingService( req.params['id'], function(err, findOneResult) {     
            if(err) {
                sails.log.error('findOne, unable to find one listing');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            return res.json(results);
        });
    },
    getListing: function(req, res){
        sails.services['listingservice'].findOneListingService( req.params['id'], function(err, findOneResult) {
            if(err) {
                sails.log.error('getListing, unable to find one listing by listing Id');
                sails.log.error(new Error(err));
                return res.json(500, err);
            } 
            async.parallel([
                function(cb) {
                    sails.services['invitationservice'].getInvitationByUserIdsService( req.params['userId'], findOneResult.user.id, function(err, inviteResult) {
                        if(err) {
                            sails.log.warn('getListing, get invitation by user');
                            sails.log.warn(new Error(err));
                            return cb(500, err);
                        }
                        findOneResult.invitation = inviteResult;
                        return cb(null, inviteResult);
                    });
                },
                function(cb) {
                    sails.services['userservice'].getUserDataService( findOneResult.user.id, function(err, getUserData) {
                        if(err) {
                            sails.log.warn('getListing, get invitation by user');
                            sails.log.warn(new Error(err));
                            return cb(500, err);
                        }
                        findOneResult.user = getUserData;
                        return cb(null, getUserData);
                    });
                }
            ], function(err, results) {
                if(err) {
                    sails.log.error('getListing, error fetching one listing by ID');
                    sails.log.error(new Error(err));
                    return res.json(500, err);
                }
                return res.json(findOneResult);                
            });
        });
    },
    getUserListings: function(req, res){
        var createdPaginate = req.body['createdAt'] || new Date();
        sails.models['user'].findOne({ where: { id: req.params['userId'] } }).exec(function(err, userResult) {
            var query;
            if(err) {
                sails.log.error('getUserListings, find one user');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            var listingByIdObj = {
                firstName: userResult.firstName,
                lastName: userResult.lastName
            };
            if(req.body['myself']) {
                query = {where: {userId: req.params['userId'], isArchived: false, isSold: req.body['isSold'], createdAt: {'<': createdPaginate }, sort: 'createdAt DESC', limit: 30 } };
            } else if(req.body['friends']) {
                query = {where: {userId: req.params['userId'], isSold: false, isArchived: false, isFraud: false, createdAt: {'<': createdPaginate }, sort: 'createdAt DESC', limit: 30 } };
            } else {
                query = {where: {userId: req.params['userId'], isSold: false, isArchived: false, isFraud: false, isPrivate: false, isPickupOnly: false, createdAt: {'<': createdPaginate }, sort: 'createdAt DESC', limit: 30 } };
            }
            sails.models['listing'].find(query).exec(function(err, results){
                if(err) {
                    sails.log.error('getUserListings, find user listings');
                    sails.log.error(new Error(err));
                    return res.json(500, err);
                }
                listingByIdObj.listings = results;
                return res.json(listingByIdObj);
            });
        });
    },
    getUsernameListings: function(req, res){
        var createdPaginate = req.body['createdAt'] || new Date();
        sails.models['user'].findOne({ where: { username: req.params['username'] } }).exec(function(err, userResult) {
            var query;
            if(err) {
                sails.log.error('getUsernameListings, find one user');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            var listingByUsernameObj = {
                firstName: userResult.firstName,
                lastName: userResult.lastName
            };
            if(req.body['myself']) {
                query = {where: {userId: userResult.id, isArchived: false, isSold: req.body['isSold'], createdAt: {'<': createdPaginate }, sort: 'createdAt DESC', limit: 30 } };
            } else if(req.body['friends']) {
                query = {where: {userId: userResult.id, isSold: false, isArchived: false, isFraud: false, createdAt: {'<': createdPaginate }, sort: 'createdAt DESC', limit: 30 } };
            } else {
                query = {where: {userId: userResult.id, isSold: false, isArchived: false, isFraud: false, isPrivate: false, isPickupOnly: false, createdAt: {'<': createdPaginate }, sort: 'createdAt DESC', limit: 30 } };
            }
            sails.models['listing'].find(query).exec(function(err, results){
                if(err) {
                    sails.log.error('getUsernameListings, find user listings');
                    sails.log.error(new Error(err));
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
            var idx = friendsApproved.indexOf(req.params['userId']);
            friendsApproved.splice(idx, 1);
            var updatedPaginate = req.body['updatedAt'] || new Date();
            var selbiArray = [];
            sails.models['user'].find({where: {id: friendsApproved, hasListings: true, updatedAt: {'<': updatedPaginate }, sort: 'updatedAt DESC', limit: 30 } } ).populate('listings', {where:{isSold: false, isArchived: false, isFraud: false }, sort: 'createdAt DESC', limit:1}).exec(function(err, listingResult){
                if(err) {
                    sails.log.error('getFriendsListings, find user');
                    sails.log.error(new Error(err));
                    return res.json(err);
                }
                async.eachLimit(listingResult, 10, function(userList, cbEach){
                    async.parallel([
                        function(cb){
                            sails.models['listing'].count({ 
                                where: { userId: userList.id, isSold: false, isArchived: false, isFraud: false} 
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
                    if(err) {
                        sails.log.error('getFriendsListings, find friend listings');
                        sails.log.error(new Error(err));
                        return res.json(500, err);
                    }
                    return res.json(_.sortByOrder(selbiArray, ['updatedAt'], ['desc']));
                });
            });
       });
    },
    getSelbiListings: function(req, res) {
       sails.services['invitationservice'].getApprovedInvitesByIdService( req.params['userId'], function(err, invitationResult) {
            if(err) {
                sails.log.error('getSelbiListings, get approved invites for selbi listings');
                sails.log.error(new Error(err));
                return res.json(err);
            }
            //friendsApproved is an array of friend's IDs
            var friendsApproved = invitationResult.idArray;
            var createdPaginate = req.body['createdAt'] || new Date();
            var categories = req.body['categories'] || ['all','Electronics', 'Menswear', 'Womenswear', 'Sports & Outdoors', 'Music', 'Furniture', 'Jewelry', 'Games & Toys', 'Automotive', 'Baby & Kids', 'Appliances', 'Other'];
            var listingSelbiUSAObj = {};
            sails.models['listing'].find({where: {userId: {'!':friendsApproved}, createdAt: {'<': createdPaginate }, isSold: false, searchCategory: categories, isArchived: false, isFraud: false, isPrivate: false, isPickupOnly: false, sort: 'createdAt DESC', limit: 30 } } ).exec(function(err, listingResult){
                if(err) {
                    sails.log.error('getSelbiListings, get selbi listings');
                    sails.log.error(new Error(err));
                    return res.json(err);
                }
                listingSelbiUSAObj.listings = listingResult;
                return res.json(listingSelbiUSAObj);
            });
       });
    }
});