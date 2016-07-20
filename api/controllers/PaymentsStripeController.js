'use strict';

var _ = require('lodash');
var stripe = require('stripe')(sails.config.stripe.privateKey);
var async = require('async');
/**
 * Stripe payments controller
 *
 * @description :: Server-side logic for managing payments through Stripe
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {

    createCustomerAndPaymentMethod: function(req, res){
        //check for required params
        if(!req.body['userId'] || !req.body['paymentStripeCardResponse']){
                return res.json(500, 'userId or paymentStripeCardResponse is missing.');
        }
        //make a service paymentstripeservice call
        sails.services['paymentstripeservice'].createCustomerAndPaymentMethod(req.body['userId'], req.body['firstName'], req.body['lastName'], req.body['email'], req.body['paymentStripeCardResponse'], function(err, result){
            if(err) {
                sails.log.error('createCustomerAndPaymentMethod');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            return res.json(200, result);
        });
    },
    getCustomer: function (req, res){
        //check for required params
        if(!req.params['userId']){
            return res.json(500, 'userId is missing.');
        }
        //make a service paymentstripeservice call
        sails.services['paymentstripeservice'].getCustomerOnStripe(req.params['userId'], function(err, result){
            if(err) {
                sails.log.error('getCustomer');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            return res.json(200, result);
        });
    },
    getPayments: function (req, res) {
        //check for required params
        if (!req.params['userId']) {
            return res.json(500, 'userId is missing.');
        }
        //make a service paymentstripeservice call
        sails.services['paymentstripeservice'].getPayments(req.params['userId'], function (err, result) {
            if (err) {
                sails.log.error('getPayments');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            delete result.userMerchant.stripeBankId;
            delete result.userMerchant.routingNumber;
            delete result.userMerchant.stripeManagedAccountId;
            delete result.userPaymentMethod.stripeCustomerId;
            return res.json(200, result);
        });
    },
    deleteCustomer: function (req, res){
        //check for required params
        if(!req.params['userId']){
            return res.json(500, 'userId is missing.');
        }
        //make a service paymentstripeservice call
        sails.services['paymentstripeservice'].deleteCustomer(req.params['userId'], function(err, result){
            if(err) {
                sails.log.error('deleteCustomer');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            return res.json(200, result);
        });
    },
    deletePaymentMethod: function (req, res){
        //check for required params
        if(!req.params['userId']){
            return res.json(500, 'userId is missing.');
        }
        //make a service paymentstripeservice call
        sails.services['paymentstripeservice'].deletePaymentMethod(req.params['userId'], function(err, result){
            if(err) {
                sails.log.error('deletePaymentMethod');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            return res.json(200, result);
        });
    },
    deleteManagedAccount: function (req, res){
        if(!req.params['userId']){
            return res.json(500, 'userId is missing.');
        }
        //make a service paymentstripeservice call
        sails.services['paymentstripeservice'].deleteManagedAccount(req.params['userId'], function(err, result){
            if(err) {
                sails.log.error('deleteManagedAccount');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            return res.json(200, result);
        });
    },
    deleteExternalAccount: function (req, res){
        //check for required params
        if(!req.params['userId']){
            return res.json(500, 'userId is missing.');
        }
        //make a service paymentstripeservice call
        sails.services['paymentstripeservice'].deleteExternalAccount(req.params['userId'], function(err, result){
            if(err) {
                sails.log.error('deleteExternalAccount');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            return res.json(200, result);
        });
    },
    createManagedAccount: function (req, res){
        //create merchant object
        var managedAccountParams = {
            managed: true,
            country: 'US',
            email: req.body['individual'].email,
            external_account: req.body['funding'].id,
            default_currency: 'usd',
            legal_entity: {
                first_name: req.body['individual'].firstName,
                last_name: req.body['individual'].lastName,
                dob: {
                    day: new Date(req.body['individual'].dateOfBirth).getDate(),
                    month: new Date(req.body['individual'].dateOfBirth).getMonth() + 1,
                    year: new Date(req.body['individual'].dateOfBirth).getFullYear()
                },
                address: {
                    line1: req.body['individual'].address.line1,
                    line2: req.body['individual'].address.line2,
                    city: req.body['individual'].address.city,
                    state: req.body['individual'].address.state,
                    postal_code: req.body['individual'].address.postal_code,
                    country: 'US'
                },
                ssn_last_4: req.body['individual'].ssn_last_4,
                type: 'individual'
            },
            transfer_schedule: {
                interval: "daily"
            },
            tos_acceptance: {
                date: '',
                ip: req.body['individual'].ip
            },
            metadata: {
                selbiManagedId: req.body['id']
            },
            product_description: 'Selbi managed account for user '+req.body['individual'].firstName+' '+req.body['individual'].lastName,
            id:  req.body['id']
        };
        sails.services['paymentstripeservice'].createManagedAccount(managedAccountParams, req.body['id'], function(err, result){
            if(err) {
                sails.log.error('createManagedAccount');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            return res.json(200, result);
        });
    },
    getManagedAccount: function (req, res){
        sails.services['paymentstripeservice'].getManagedAccount(req.params['userId'], function(err, managedAccount){
            if(err) {
                sails.log.error('getManagedAccount');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            return res.json(200, managedAccount);
        });
    },
    createOrder: function (req, res){
        //check for required params
        if (!req.body['buyerId'], !req.body['sellerId'], !req.body['listingId']) {
            return res.json(500, 'buyerId or sellerId or listingId is missing.');
        }
        sails.services['paymentstripeservice'].createOrder(req.body['listingId'], req.body['buyerId'], req.body['sellerId'], function(err, result){
            if(err) {
                sails.log.error('createOrder, creating order');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            sails.services['listingservice'].countListingService(req.body['sellerId'], function(err, countResult){
                if(err){
                    sails.log.error('createOrder, unable to get count of listings');
                    sails.log.error(new Error(err));
                    return res.json(200, result);
                }
                if(countResult === 0) {
                    var updateObj = {
                        hasListings: false
                    };
                    sails.services['userservice'].updateUserDataService(req.body['sellerId'], updateObj, function(err, updateResult) {
                        if(err) {
                            sails.log.error('createOrder, user not updated when buying an item in db');
                            sails.log.error(new Error(err));
                        }
                        return res.json(200, result);
                    });
                } else {
                    return res.json(200, result);
                }
            });
        });
    },
    getManagedBalance: function(req, res){
        async.waterfall([
            function(cb) {
                sails.services['userservice'].getUserMerchantService(req.params['userId'], function(err, userResult) {
                    if(err) {
                        sails.log.warn('getManagedBalance, user not found when searching by id');
                        return cb(err, null)
                    }
                    cb(null, userResult);
                });
            },
            function(user, cb) {
                if(user === undefined) {
                    sails.log.warn("getManagedBalance, no user found");
                    return cb('No user found', null);
                }
                if(!user.userMerchant) {
                    sails.log.warn("getManagedBalance, no user found");
                    return cb('No user found', null);
                }
                sails.services['paymentstripeservice'].getManagedBalanceService(user.userMerchant.secretKey, function(err, balanceResult){
                    if(err) {
                        sails.log.warn('getManagedBalance, balance not returned');
                        return cb(err, null)
                    }
                    cb(null, balanceResult);
                });
                
            }
        ], function(err, result) {
            if(err) {
                sails.log.warn('getManagedBalance, unable to get stripe balance ');
                return res.json(500, err);
            }
            return res.json(result);
        });
    }
});