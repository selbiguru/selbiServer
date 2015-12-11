(function() {
    'use strict';
    /**
     * Listing Service
     *
     * @description :: Provides Listing related calls for use throughout Selbi
     */
    var async = require('async');


    /**
     *  This is a public methods to delete a listing
     *  @param      listingId is the ID of the listing to delete
     *  @param      cb is a callback
     */
    module.exports.deleteListingService = function(listingId, cb) {
        sails.models['listing'].destroy({where: {id: listingId } }).exec(function (err, deleteResult) {
            if (err)
                return cb(500, err);
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
            if(err) 
                return cb(500, err);
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
            if (err)
                return cb(500, err);
            return cb(err, listing);
        });
    };



     /**
     *  This is a public methods to count number of listings a user has
     *  @param      userId is the ID of the listing to delete
     *  @param      cb is a callback
     */
    module.exports.countListingService = function(userId, cb) {
        sails.models['listing'].count({where: {userId: userId, isSold: false, isArchived: false, isPrivate: false } }).exec(function (err, countResult) {
            if (err)
                return cb(500, err);
            return cb(err, countResult);
        });
    };

})();