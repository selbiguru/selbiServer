(function() {
    'use strict';
    /**
     * Listing Service
     *
     * @description :: Provides Listing related calls for use throughout Selbi
     */
    var async = require('async');


    /**
     *  This is a public methods to find a listing
     *  @param      listingId is the ID of the listing to find
     *  @param      cb is a callback
     */
    module.exports.findOneListingService = function(listingId, cb) {
        sails.models['listing'].findOne({ where: { id: listingId } }).populate('user').exec(function(err, findOneResult){    
            if(err) {
                sails.log.warn("findOneListingService, unable to findOne listing");
                return cb(500, err);
            }
            return cb(null, findOneResult);
        });
    };


    /**
     *  This is a public methods to delete a listing
     *  @param      listingId is the ID of the listing to delete
     *  @param      cb is a callback
     */
    module.exports.deleteListingService = function(listingId, cb) {
        sails.models['listing'].destroy({where: {id: listingId } }).exec(function (err, deleteResult) {
            if (err) {
                sails.log.error("deleteListingService");
                return cb(500, err);
            }
            if(deleteResult.length  <= 0) {
                sails.log.warn("deleteListingService listing not found");
                return cb(404, 'Listing not found!')
            }
            return cb(err, deleteResult);
        });
    };


    /**
     *  This is a public methods to updates a listing
     *  @param      listingId is the ID of the listing to update
     *  @param      updateObj is the Obj containg the data of the listing to update
     *  @param      cb is a callback
     */
    module.exports.updateListingService = function(listingId, updateObj, cb) {
        sails.models['listing'].update({where : { id: listingId } }, updateObj).exec(function(err, updateResults){     
            if(err) {
                sails.log.error("updateListingService");
                return cb(500, err);
            }
            return cb(null, updateResults);
        });
    };


    /**
     *  This is a public methods to create a listing
     *  @param      createListingObj
     *      @param      title is the title of the listing
     *      @param      description is the description of the listing
     *      @param      price is the price of the listing
     *      @param      isPrivate is whether or not the listing is viewable by friends only
     *      @param      isPreview is whether the listing is in preview mode (not viewable by anyone except lister)
     *      @param      isPublished is whether the listing is viewable by everyone (opposite of Preview)
     *      @param      isSold if the listing has been sold
     *      @param      userId is id of the user who listed this listing
     *  @param      cb is a callback
     */
    module.exports.createListingService = function(createListingObj, cb) {
        sails.models['listing'].create(createListingObj).exec(function (err, listing) {
            if (err) {
                sails.log.error("createListingService");
                return cb(500, err);
            }
            return cb(err, listing);
        });
    };



     /**
     *  This is a public methods to count number of listings a user has
     *  @param      userId is the ID of the listing to delete
     *  @param      cb is a callback
     */
    module.exports.countListingService = function(userId, cb) {
        sails.models['listing'].count({where: {userId: userId, isSold: false, isArchived: false, isFraud: false } }).exec(function (err, countResult) {
            if (err) {
                sails.log.error("countListingService");
                return cb(500, err);
            }
            return cb(err, countResult);
        });
    };

})();