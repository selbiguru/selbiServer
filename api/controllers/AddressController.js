'use strict';

var _ = require('lodash');
var async = require('async');

/**
 * UserController
 *
 * @description :: Server-side logic for managing Address
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {

	addUserAddress: function(req, res){
        async.waterfall([
            function(cb) {
                sails.services['userservice'].getDataService( req.params['userId'] , function(err, userResult){
                    if(err)
                        return cb(err, null);
                    cb(null, userResult);
                });
            },
            function(userResult, cb) {
                if(userResult.userAddress) {
                    sails.services['addressservice'].updateAddressService(userResult.userAddress, req.body.userAddress, function(err, updateAddressResult) {
                        if(err)
                            return cb(err, null);
                        cb(null, updateAddressResult);
                    });
                } else {
                    sails.services['userservice'].updateUserDataService(req.params['userId'], req.body, function(err, updateUserResult) {
                        if(err)
                            return cb(err, null);
                        cb(null, updateUserResult);
                    });
                }
            },
            function(updatedUser, cb) {
                sails.services['userservice'].getUserDataService(req.params['userId'], function(err, getUserResult) {
                    if(err)
                        return cb(err, null);
                    cb(null, getUserResult);
                });
            }
        ], function(err, results) {
            if(err) {
                sails.log.error('addUserAddress');
                sails.log.error(new Error(err));
                return res.json(err, results)
            }
            res.json(results);
        });
    },


});