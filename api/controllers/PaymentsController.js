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

        console.log(req.body['userId'] + ', ' + req.body['firstName'] + ', ' + req.body['lastName'] + ', pn' + req.body['paymentMethodNonce']);
        console.log('fahd is here .......... ');
        
        getgateway().customer.find(req.body['userId'], function(err, customerResult) {
            if(err){
                //TODO check out for customer not found exception
                console.log('customer was NOT found');
                //create new cutomer and payment method
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
                                    merchantAccountId: customerCreateResult.customer.merchantId,
                                    paymentMethodToken: customerCreateResult.customer.paymentMethods[0].token,
                                    lastFour: customerCreateResult.customer.paymentMethods[0].last4,
                                    cardType: customerCreateResult.customer.paymentMethods[0].cardType,
                                    expirationDate: customerCreateResult.customer.paymentMethods[0].expirationDate
                                }   
                            }
                            console.log('1 userid :' + pm.id);
                            console.log('token :' + customerCreateResult.customer.paymentMethods[0].token);
                            //save the paymenttoken user can have multiple payment methods 
                            sails.models['user'].update({id: req.body['userId']}, pm).exec(function(err, updateResult){
                                if(err)
                                    return res.json(500, err);

                                return res.json(customerCreateResult.customer.paymentMethods[0]);
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
                                    merchantAccountId: customerResult.merchantId,
                                    paymentMethodToken: PaymentResult.paymentMethod.token,
                                    lastFour: PaymentResult.paymentMethod.last4,
                                    cardType: PaymentResult.paymentMethod.cardType,
                                    expirationDate: PaymentResult.paymentMethod.expirationDate
                                }   
                            }
                            console.log('1 userid :' + pm.id);
                            console.log('token :' + PaymentResult.paymentMethod.token);
                            
                            //save the paymenttoken user can have multiple payment methods
                            sails.models['user'].update({id: req.body['userId']}, pm).exec(function(err, updateResult){
                                if(err)
                                    return res.json(500, err);

                                return res.json(PaymentResult.paymentMethod);
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
    deletePaymentMethod: function (req, res){
        sails.models['user'].find({ where: { id: req.params['userId'] } }).populate('userPaymentMethod').exec(function(err, results){
            if(err) 
                return res.json(500, err);

            getgateway().paymentMethod.delete(results[0].userPaymentMethod.paymentMethodToken, function (err) {
                if(err) 
                return res.json(500, err);
                //destroy object from db
                sails.models['payments'].destroy({id: results[0].userPaymentMethod.id}).exec(function deleteCB(err, delResult){
                    if(err)
                        console.log('Error deleting record from our db');

                    return res.json(delResult);
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



