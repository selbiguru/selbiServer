'use strict';

var _ = require('lodash');
var braintree = require('braintree');
/**
 * Braintree payments controller
 *
 * @description :: Server-side logic for managing payments through Braintree
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {

    getClientToken: function(req, res){
        sails.services['paymentsservice'].getBraintreeClientToken(function(err, clientToken){
            if(err)
                return res.json(500, err);
            return res.json(200, clientToken);
        });
    },
    createCustomerAndPaymentMethod: function(req, res){
        //check for required params
        if(!req.body['userId'] || !req.body['paymentMethodNonce']){
                return res.json(500, 'userId or paymentMethodNonce is missing.');
        }
        //make a service paymentsservice call
        sails.services['paymentsservice'].createCustomerAndPaymentMethod(req.body['userId'], req.body['firstName'], req.body['lastName'], req.body['paymentMethodNonce'], function(err, result){
            if(err)
                return res.json(500, err);
            return res.json(200, result);
        });
    },
    findCustomer: function (req, res){
        //check for required params
        if(!req.params['userId']){
            return res.json(500, 'userId is missing.');
        }
        //make a service paymentsservice call
        sails.services['paymentsservice'].findCustomerOnBraintree(req.params['userId'], function(err, result){
            if(err)
                return res.json(500, err);
            return res.json(200, result);
        });
    },
    getPayments: function (req, res) {
        //check for required params
        if (!req.params['userId']) {
            return res.json(500, 'userId is missing.');
        }
        //make a service paymentsservice call
        sails.services['paymentsservice'].getPayments(req.params['userId'], function (err, result) {
            if (err)
                return res.json(500, err);
            return res.json(200, result);
        });
    },
    deletePaymentMethod: function (req, res){
        //check for required params
        if(!req.params['userId']){
            return res.json(500, 'userId is missing.');
        }
        //make a service paymentsservice call
        sails.services['paymentsservice'].deletePaymentMethod(req.params['userId'], function(err, result){
            if(err)
                return res.json(500, err);
            return res.json(200, result);
        });
    },
    deleteMerchant: function (req, res){
        //check for required params
        if(!req.params['userId']){
            return res.json(500, 'userId is missing.');
        }
        //make a service paymentsservice call
        sails.services['paymentsservice'].deleteMerchant(req.params['userId'], function(err, result){
            if(err)
                return res.json(500, err);
            return res.json(200, result);
        });
    },
    createSubMerchantAccount: function (req, res){
        //create merchant object
        var merchantAccountParams = {
            individual: {
                firstName: req.body['individual'].firstName,
                lastName: req.body['individual'].lastName,
                email: req.body['individual'].email,
                phone: req.body['individual'].phone,
                dateOfBirth: req.body['individual'].dateOfBirth,
                address: {
                    streetAddress: req.body['individual'].address.streetAddress,
                    locality: req.body['individual'].address.locality,
                    region: req.body['individual'].address.region,
                    postalCode: req.body['individual'].address.postalCode
                }
            },
            //business object is optional
            /*business: {
             legalName: req.body['firstName'],
             dbaName: req.body['firstName'],
             taxId: req.body['firstName'],
             address: {
             streetAddress: req.body['firstName'],
             locality: req.body['firstName'],
             region: req.body['firstName'],
             postalCode: req.body['firstName']
             }
             },*/
            funding: {
                descriptor: sails.config.braintree.fundingDescriptor
            },
            tosAccepted: true,
            masterMerchantAccountId: sails.config.braintree.masterMerchantAccountId,
            id:  req.body['id']
        };
        //If there is no venmo then merchant is using a bank account
        if(req.body['venmo']) {
            merchantAccountParams.funding.destination = braintree.MerchantAccount.FundingDestination.Mobile;
            merchantAccountParams.funding.mobilePhone = req.body['funding'].mobilePhone;
        } else {
            merchantAccountParams.funding.destination = braintree.MerchantAccount.FundingDestination.Bank;
            merchantAccountParams.funding.accountNumber = req.body['funding'].accountNumber;
            merchantAccountParams.funding.routingNumber = req.body['funding'].routingNumber;
        }

        sails.services['paymentsservice'].createSubMerchantAccount(merchantAccountParams, req.body['id'], function(err, result){
            if(err)
                return res.json(500, err);
            return res.json(200, result);
        });
    },
    getMerchantAccount: function (req, res){
        getgateway().merchantAccount.find(req.params['merchantAccountId'], function (err, merchantAccount) {
            if(err)
                return res.json(500, err);
            console.log(req.params['merchantAccountId']);
            return res.json(merchantAccount);
        });
    },
    createOrder: function (req, res){
        //check for required params
        if (!req.body['buyerId'], !req.body['sellerId'], !req.body['listingId']) {
            return res.json(500, 'buyerId or sellerId or listingId is missing.');
        }
        sails.services['paymentsservice'].createOrder(req.body['listingId'], req.body['buyerId'], req.body['sellerId'], function(err, result){
            if(err)
                return res.json(500, err);
            sails.services['listingservice'].countListingService(req.body['sellerId'], function(err, countResult){
                if(err){
                    console.log('Unable to get count of listings for user');
                    return res.json(200, result);
                }
                if(countResult === 0) {
                    var updateObj = {
                        hasListings: false
                    };
                    sails.services['userservice'].updateUserDataService(req.body['sellerId'], updateObj, function(err, updateResult) {
                        if(err) {
                            console.log('User not updated when buying an item');
                        }
                        return res.json(200, result);
                    });
                } else {
                    return res.json(200, result);
                }
            });
        });
    }
});
