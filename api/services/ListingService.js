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

})();