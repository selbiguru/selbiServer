(function() {
    'use strict';
    /**
     * Listing Service
     *
     * @description :: Provides Address related calls for use throughout Selbi
     */
    var async = require('async');

    /**
     *  This is a public methods to updates a listing
     *  @param      addressId is the ID of the address to update
     *  @param      updateObj is the Obj containg the data of the listing to update
     *  @param      cb is a callback
     */
    module.exports.updateAddressService = function(addressId, updateObj, cb) {
        sails.models['address'].update({where : { id: addressId } }, updateObj).exec(function(err, updateResults){     
            if(err) {
                sails.log.error("updateAddressService");
                return cb(500, err);
            }
            return cb(null, updateResults);
        });
    };


})();