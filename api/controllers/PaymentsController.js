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
        getgateway().customer.find(req.body['userId'], function(err, customerResult) {
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
                    console.log('customer was found');
                getgateway().paymentMethod.create({
                    customerId: req.body['userId'],
                    paymentMethodNonce: req.body['paymentMethodNonce']
                }, function (err, PaymentResult) {
                    if(err)
                        res.json(500, err);

                        var pm = {
                            id: req.body['userId'],
                            userPaymentMethod:{
                                paymentMethodToken: PaymentResult.paymentMethod.token,
                                lastFour: PaymentResult.paymentMethod.last4,
                                cardType: PaymentResult.paymentMethod.cardType,
                                expirationDate: PaymentResult.paymentMethod.expirationDate
                            }
                        }

                        //save the paymenttoken user can have multiple payment methods
                        sails.models['user'].update({id: req.body['userId']}, pm).exec(function(err, updateResult){
                            if(err)
                                return res.json(500, err);

                            return res.json(200, { success: true })
                        });
                }); //create payment method
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

            sails.models['payments'].findOne({ where: { id: results.userPaymentMethod } }).exec(function(err, result){
                    if(err)
                        return res.json(500, err);

                    return res.json(result);
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
                descriptor: "Selbi Sale",
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

        getgateway().merchantAccount.create(merchantAccountParams, function (err, result) {
            if(err)
                return res.json(500, err);

            return res.json(result);
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
