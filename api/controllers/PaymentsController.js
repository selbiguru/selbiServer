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
    createSaleTransaction: function (req, res){
        if(!req.body['amount'] || !req.body['userId'] || !req.body['merchantUserId'])
            return res.json(500, "Amoount or userId or MerchantUserId is missing in the request");

        sails.models['user'].findOne({ where: { id: req.body['userId'] } }).exec(function(err, results){
            if(err)
                return res.json(500, err);

            sails.models['payments'].findOne({ where: { id: results.userPaymentMethod } }).exec(function(err, paymentsResult) {
                if (err)
                    return res.json(500, err);

                sails.models['user'].findOne({where: {id: req.body['merchantUserId']}}).populate('userMerchant').exec(function (err, merchantResult) {
                    if (err)
                        return res.json(500, err);

                    getgateway().transaction.sale({
                        amount: parseFloat(req.body['amount']).toFixed(2),
                        merchantAccountId: merchantResult.userMerchant.merchantId,
                        paymentMethodToken: paymentsResult.paymentMethodToken,
                        serviceFeeAmount: (parseFloat(req.body['amount']) * parseFloat(sails.config.braintree.serviceFeePercent)/100).toFixed(2),
                        options: {
                            submitForSettlement: true
                        }
                    }, function (err, merchantAccount) {
                        if(err)
                            return res.json(500, err);

                        return res.json(merchantAccount);
                    });
                });
            });
        });
    }

});

function getgateway(){
        //All calls to braintree will need this gateway to connect
        return braintree.connect({
            environment: braintree.Environment.Sandbox,
            merchantId: sails.config.braintree.merchantId,
            publicKey: sails.config.braintree.publicKey,
            privateKey: sails.config.braintree.privateKey

    });
}
