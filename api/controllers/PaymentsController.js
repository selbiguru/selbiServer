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
        getgateway().clientToken.generate({}, function (err, response) {
            if(err)
                return res.json(500, err);
            return res.json(response.clientToken);
        });
    },
    createCustomerAndPaymentMethod: function(req, res){
        getgateway().customer.find(req.body['userId'], function(err) {
            if(err){
                    //customer not found so create new customer and payment method
                getgateway().customer.create({
                        id: req.body['userId'],
                        firstName: req.body['firstName'],
                        lastName: req.body['lastName'],
                        paymentMethodNonce: req.body['paymentMethodNonce']
                }, function (err, customerCreateResult) {
                    if(err)
                        return res.json(500, err);

                    var pm = {
                            id: req.body['userId'],
                            userPaymentMethod:{
                                paymentMethodToken: customerCreateResult.customer.paymentMethods[0].token,
                                lastFour: customerCreateResult.customer.paymentMethods[0].last4,
                                cardType: customerCreateResult.customer.paymentMethods[0].cardType,
                                expirationDate: customerCreateResult.customer.paymentMethods[0].expirationDate
                            }
                        }
                        //save the payment token user can have multiple payment methods
                        sails.models['user'].update({id: req.body['userId']}, pm).exec(function(err, updateResult){
                            if(err)
                                return res.json(500, err);

                            return res.json(200, { success: true })
                        });
                    });//create brackets
                }
            else{

                sails.models['user'].findOne({ where: { id: req.params['userId'] } }).populate('userPaymentMethod').exec(function(err, results) {
                    if (err)
                        return res.json(500, err);

                    //delete payment method if any exist
                    if(results && results.userPaymentMethod) {
                        getgateway().paymentMethod.delete(results.userPaymentMethod.paymentMethodToken, function (err) {
                            if (err)
                                return res.json(500, err);
                            //destroy object from db
                            sails.models['payments'].destroy({id: results.userPaymentMethod.id}).exec(function deleteCB(err) {
                                if (err)
                                    console.log('Error deleting record from our db');
                            });
                        });
                    }
                    //create new payment method
                    getgateway().paymentMethod.create({
                        customerId: req.body['userId'],
                        paymentMethodNonce: req.body['paymentMethodNonce']
                    }, function (err, PaymentResult) {
                        if (err)
                            res.json(500, err);

                        var pm = {
                            id: req.body['userId'],
                            userPaymentMethod: {
                                paymentMethodToken: PaymentResult.paymentMethod.token,
                                lastFour: PaymentResult.paymentMethod.last4,
                                cardType: PaymentResult.paymentMethod.cardType,
                                expirationDate: PaymentResult.paymentMethod.expirationDate
                            }
                        };

                        //save the payment token user can have multiple payment methods
                        sails.models['user'].update({id: req.body['userId']}, pm).exec(function (err) {
                            if (err)
                                return res.json(500, err);

                            return res.json(200, {success: true});
                        });
                    }); //create payment method
                });
            } //else
        }); // customer find end brackets
    },
    findCustomer: function (req, res){
        getgateway().customer.find(req.params['userId'], function(err, customer) {
            if(err)
                return res.json(500, err);
            return res.json(customer);
        });
    },
    getPayments: function (req, res){
        sails.models['user'].findOne({ where: { id: req.params['userId'] } }).exec(function(err, results){
            if(err)
                return res.json(500, err);

            sails.models['payments'].findOne({ where: { id: results.userPaymentMethod } }).exec(function(err, paymentsResult) {
                if (err)
                    return res.json(500, err);

                sails.models['merchant'].findOne({where: {id: results.userMerchant}}).exec(function (err, merchantResult) {
                    if (err)
                        return res.json(500, err);

                    var userPaymentMethod = {};
                    var userMerchant = {};
                    if(paymentsResult) {
                        userPaymentMethod = {
                            lastFour: paymentsResult.lastFour,
                            cardType: paymentsResult.cardType,
                            expirationDate: paymentsResult.expirationDate
                        }
                    }

                    if(userMerchant)
                    {
                        userMerchant = {
                            accountNumberLast4: merchantResult.accountNumberLast4,
                            routingNumber: merchantResult.routingNumber,
                            fundingDestination: merchantResult.fundingDestination,
                            mobilePhone: merchantResult.mobilePhone
                        }
                    }
                    var result = {
                        userId:  req.params['userId'] ,
                        userPaymentMethod: userPaymentMethod,
                        userMerchant: userMerchant
                    }

                    return res.json(result);
                });
            });
        });
    },
    deletePaymentMethod: function (req, res){
        sails.models['user'].findOne({ where: { id: req.params['userId'] } }).populate('userPaymentMethod').exec(function(err, results){
            if(err)
                return res.json(500, err);

            getgateway().paymentMethod.delete(results.userPaymentMethod.paymentMethodToken, function (err) {
                if(err)
                    return res.json(500, err);
                //destroy object from db
                sails.models['payments'].destroy({id: results.userPaymentMethod.id}).exec(function deleteCB(err, delResult){
                    if(err)
                        console.log('Error deleting record from our db');

                    return res.json(delResult);
                });
            });
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

        if(req.body['venmo']) {
            merchantAccountParams.funding.destination = braintree.MerchantAccount.FundingDestination.Mobile;
            merchantAccountParams.funding.mobilePhone = req.body['funding'].mobilePhone;
        } else {
            merchantAccountParams.funding.destination = braintree.MerchantAccount.FundingDestination.Bank;
            merchantAccountParams.funding.accountNumber = req.body['funding'].accountNumber;
            merchantAccountParams.funding.routingNumber = req.body['funding'].routingNumber;
        }

        //1) check if this user has a merchant
        sails.models['user'].findOne({ where: { id: req.body['id'] } }).populate('userMerchant').exec(function(err, merchResults){
            if(err)
                return res.json(500, err);

            if(merchResults.userMerchant)
            {
                //Merchant Account cannot be updated
                delete merchantAccountParams['id'];
                //update merchant on braintree
                getgateway().merchantAccount.update(merchResults.userMerchant.merchantId, merchantAccountParams, function (err, merchantUpdateResult) {
                    if(!merchantUpdateResult.success)
                        return res.json(500, merchantUpdateResult.message);
                    var merchantUpdateObj = {
                        id: req.body['userId'],
                        userMerchant:{
                            accountNumberLast4: merchantUpdateResult.merchantAccount.funding.accountNumberLast4,
                            routingNumber:  merchantUpdateResult.merchantAccount.funding.routingNumber,
                            mobilePhone:  merchantUpdateResult.merchantAccount.funding.mobilePhone,
                            fundingDestination:  merchantUpdateResult.merchantAccount.funding.destination
                        }
                    }
                    //create the merchant info in selbi db
                    sails.models['user'].update({id: req.body['id']}, merchantUpdateObj).exec(function(err){
                        if(err)
                            return res.json(500, err);

                        return res.json(200, { success: true })
                    });
                });
            }
            //No merchant was found on selbi so create a new merchant on braintree
            else
            {
                getgateway().merchantAccount.create(merchantAccountParams, function (err, merchCreateResult) {
                if(!merchCreateResult.success)
                    return res.json(500, merchCreateResult.message);

                    getgateway().merchantAccount.find(merchCreateResult.merchantAccount.id, function (err, merchFindResult) {
                        if(err)
                            return res.json(500, err);

                            var merchantCreateObj = {
                                id: req.body['userId'],
                                userMerchant:{
                                    merchantId: merchFindResult.id,
                                    accountNumberLast4: merchFindResult.funding.accountNumberLast4,
                                    routingNumber: merchFindResult.funding.routingNumber,
                                    mobilePhone: merchFindResult.funding.mobilePhone,
                                    fundingDestination:  merchFindResult.funding.destination
                                }
                            }
                        //create the merchant info in selbi db
                        sails.models['user'].update({id: req.body['id']}, merchantCreateObj).exec(function(err){
                            if(err)
                                return res.json(500, err);

                            return res.json(200, { success: true })
                        });
                    });
                });
            }
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
