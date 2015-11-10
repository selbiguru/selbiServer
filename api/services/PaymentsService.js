(function() {
    'use strict';
    /**
     * Payments Service
     *
     * @description :: Provides payment related calls to talk to Braintree
     */

    var braintree = require('braintree');

    /**
     *  This is a public methods to get a braintree client token to make calls to Braintree
     *  @param      cb is a callback
     *  @return     Returns Braintree Client Token
     */
    module.exports.getBraintreeClientToken = function(cb) {
        getgateway().clientToken.generate({}, function (err, response) {
            if(err)
                return cb(err, null);
            else
                cb(null, response.clientToken);
        });
    };

    module.exports.createCustomerAndPaymentMethod = function(userId, firstName, lastName, paymentMethodNonce, cb){
        getgateway().customer.find(userId, function(err) {
            if(!paymentMethodNonce || !userId)
                 return cb('paymentMethodNonce or userId is missing!', null);

            if(err){
                //customer not found so create new customer and payment method
                getgateway().customer.create({
                    id: userId,
                    firstName: firstName,
                    lastName: lastName,
                    creditCard: {
                        paymentMethodNonce: paymentMethodNonce,
                        options: {
                            verifyCard: true
                        }
                    }
                }, function (err, customerCreateResult) {
                    var cardMethodStatus = {};
                    if(err)
                         return cb(err, null);
                    if (!customerCreateResult.success) {
                        cardMethodStatus.verificationStatus = customerCreateResult.verification.status;
                        cardMethodStatus.message = customerCreateResult.message;
                        cardMethodStatus.cardStatus = customerCreateResult.success;
                        cb(null, cardMethodStatus);
                    } else {
                        cardMethodStatus.verificationStatus = customerCreateResult.customer.creditCards[0].verifications[0].status;
                        cardMethodStatus.cardStatus = customerCreateResult.success;
                    }
                    var pm = {
                        id: userId,
                        userPaymentMethod:{
                            paymentMethodToken: customerCreateResult.customer.paymentMethods[0].token,
                            lastFour: customerCreateResult.customer.paymentMethods[0].last4,
                            cardType: customerCreateResult.customer.paymentMethods[0].cardType,
                            expirationDate: customerCreateResult.customer.paymentMethods[0].expirationDate
                        }
                    }
                    //save the payment token user can have multiple payment methods
                    sails.models['user'].update({id: userId}, pm).exec(function(err, updateResult){
                        if(err)
                             return cb(err, null);

                        cb(null, cardMethodStatus);
                    });
                });//create brackets
            }
            else{
                sails.models['user'].findOne({ where: { id: userId } }).populate('userPaymentMethod').exec(function(err, results) {
                    if (err)
                         return cb(err, null);

                    //delete payment method if any exist
                    if(results && results.userPaymentMethod) {
                        getgateway().paymentMethod.delete(results.userPaymentMethod.paymentMethodToken, function (err) {
                            if (err)
                                return cb(err, null);
                            //destroy object from db
                            sails.models['payments'].destroy({id: results.userPaymentMethod.id}).exec(function deleteCB(err) {
                                if (err)
                                    console.log('Error deleting record from our db');
                            });
                        });
                    }
                    //create new payment method
                    getgateway().paymentMethod.create({
                        customerId: userId,
                        paymentMethodNonce: paymentMethodNonce,
                        options: {
                            verifyCard: true,
                            verificationMerchantAccountId: sails.config.braintree.masterMerchantAccountId
                        }
                    }, function (err, PaymentResult) {
                        var cardMethodStatus = {};
                        if (err)
                            return cb(err, null);
                        if (!PaymentResult.success) {
                            cardMethodStatus.verificationStatus = PaymentResult.verification.status;
                            cardMethodStatus.message = PaymentResult.message;
                            cardMethodStatus.cardStatus = PaymentResult.success;
                            cb(null, cardMethodStatus);
                        } else {
                            cardMethodStatus.verificationStatus = PaymentResult.creditCard.verification.status;
                            cardMethodStatus.cardStatus = PaymentResult.success;
                        }
                        var pm = {
                            id: userId,
                            userPaymentMethod: {
                                paymentMethodToken: PaymentResult.paymentMethod.token,
                                lastFour: PaymentResult.paymentMethod.last4,
                                cardType: PaymentResult.paymentMethod.cardType,
                                expirationDate: PaymentResult.paymentMethod.expirationDate
                            }
                        };

                        //save the payment token user can have multiple payment methods
                        sails.models['user'].update({id: userId}, pm).exec(function (err) {
                            if (err)
                                return cb(err, null);

                            cb(null, cardMethodStatus);
                        });
                    }); //create payment method
                });
            } //else
        }); // customer find end brackets
    }

    module.exports.findCustomerOnBraintree = function (userId, cb){
        if(!userId)
            return cb('userId is missing!', null);
        getgateway().customer.find(userId, function(err, customer) {
            if(err)
                return cb(err, null);
            cb(err, customer);
        });
    }

    module.exports.getPayments = function (userId, cb){
        if(!userId)
            return cb('userId is missing!', null);

        sails.models['user'].findOne({ where: { id: userId } }).exec(function(err, results){
            if(err)
                return cb(err, null);
            if(results)
            {
                sails.models['payments'].findOne({ where: { id: results.userPaymentMethod || {} } }).exec(function(err, paymentsResult) {
                    if (err)
                        return cb(err, null);

                    sails.models['merchant'].findOne({where: {id: results.userMerchant || {} }}).exec(function (err, merchantResult) {
                        if (err)
                            return cb(err, null);

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
                            userId: userId ,
                            userPaymentMethod: userPaymentMethod,
                            userMerchant: userMerchant
                        }

                        cb (null, result);
                    });
                });
            }
            else
            //no user found
            cb('No User found!', null);
        });
    }

    module.exports.deletePaymentMethod = function (userId, cb){
        if(!userId)
            return cb('userId is missing!', null);

        sails.models['user'].findOne({ where: { id: userId } }).populate('userPaymentMethod').exec(function(err, results){
            if(err)
                return cb(err, null);

            getgateway().paymentMethod.delete(results.userPaymentMethod.paymentMethodToken, function (err) {
                if(err)
                    return cb(err, null);
                //destroy object from db
                sails.models['payments'].destroy({id: results.userPaymentMethod.id}).exec(function deleteCB(err, delResult){
                    if(err)
                        console.log('Error deleting record from our db');

                    return cb(null, delResult);
                });
            });
        });
    }

    module.exports.createSubMerchantAccount = function (merchantAccountParams, userId, cb){
        //TODO need to add more checks here for required fields
        if(!merchantAccountParams.id || !userId)
            return cb('userId is missing!', null);
        //1) check if this user has a merchant
        sails.models['user'].findOne({ where: { id: merchantAccountParams.id } }).populate('userMerchant').exec(function(err, merchResults){
            if(err)
                return cb(err, null);

            if(merchResults.userMerchant)
            {
                //Merchant Account cannot be updated
                delete merchantAccountParams['id'];
                //update merchant on braintree
                //userId is the merchantId on braintree
                getgateway().merchantAccount.update(userId, merchantAccountParams, function (err, merchantUpdateResult) {
                    if(err)
                        return cb(err, null);
                    if(!merchantUpdateResult.success)
                        return cb(merchantUpdateResult.message, null);
                    var merchantUpdateObj = {
                        id: userId,
                        userMerchant:{
                            accountNumberLast4: merchantUpdateResult.merchantAccount.funding.accountNumberLast4,
                            routingNumber:  merchantUpdateResult.merchantAccount.funding.routingNumber,
                            mobilePhone:  merchantUpdateResult.merchantAccount.funding.mobilePhone,
                            fundingDestination:  merchantUpdateResult.merchantAccount.funding.destination,
                            merchantId : userId
                        }
                    }
                    //create the merchant info in selbi db
                    sails.models['user'].update({id: userId}, merchantUpdateObj).exec(function(err, updateResults){
                        if(err)
                            return cb(err, null);

                       cb(null, updateResults);
                    });
                });
            }
            //No merchant was found on selbi so create a new merchant on braintree
            else
            {
                getgateway().merchantAccount.create(merchantAccountParams, function (err, merchCreateResult) {
                    if(!merchCreateResult.success)
                        return cb(merchCreateResult.message, null);

                    //merchCreateResult.merchantAccount.id is the userId
                    getgateway().merchantAccount.find(merchCreateResult.merchantAccount.id, function (err, merchFindResult) {
                        if(err)
                            return cb(err, null);

                        var merchantCreateObj = {
                            id: userId,
                            userMerchant:{
                                merchantId: merchFindResult.id,
                                accountNumberLast4: merchFindResult.funding.accountNumberLast4,
                                routingNumber: merchFindResult.funding.routingNumber,
                                mobilePhone: merchFindResult.funding.mobilePhone,
                                fundingDestination:  merchFindResult.funding.destination
                            }
                        }
                        //create the merchant info in selbi db
                        sails.models['user'].update({id: userId}, merchantCreateObj).exec(function(err){
                            if(err)
                                return cb(err, null);

                            cb(null,{ success: true });
                        });
                    });
                });
            }
        });
    }


    //** helper functions **//
    /**
     *  This is a private method to get connected to braintree for making api calls
     */
    function getgateway(){
        //All calls to braintree will need this gateway to connect
        return braintree.connect({
            environment: braintree.Environment.Sandbox,
            merchantId: sails.config.braintree.merchantId,
            publicKey: sails.config.braintree.publicKey,
            privateKey: sails.config.braintree.privateKey
        });
    }
})();