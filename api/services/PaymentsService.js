(function() {
    'use strict';
    /**
     * Payments Service
     *
     * @description :: Provides payment related calls to talk to Braintree
     */
    var async = require('async'),
    self = this,
    braintree = require('braintree');

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
        if(!paymentMethodNonce || !userId)
            return cb('paymentMethodNonce or userId is missing!', null);
        sails.models['user'].findOne({ where: { id: userId } }).exec(function(err, customerResults){
            if(err)
                return cb(err, null);
            if(customerResults === undefined)
                return cb('No user found', null);
            if(!customerResults.userPaymentMethod){
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
                    sails.models['user'].update({ where: {id: userId } }, pm).exec(function(err, updateResult){
                        if(err)
                             return cb(err, null);

                        cb(null, cardMethodStatus);
                    });
                });//create brackets
            }
            else{
                async.waterfall([
                    function(cb) {
                        sails.services['paymentsservice'].deletePaymentMethod(userId, function(err, deleteResult) {
                            if (err)
                                return cb(err, null);
                            cb(null, deleteResult);
                        });
                    },
                    function(deleteResult, cb) {
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
                                cardMethodStatus.message = PaymentResult.message;
                                cardMethodStatus.cardStatus = PaymentResult.success;
                                return cb(null, cardMethodStatus);
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
                            sails.models['user'].update({ where: {id: userId } }, pm).exec(function (err) {
                                if (err)
                                    return cb(err, null);
                                cb(null, cardMethodStatus);
                            });
                        }); //create payment method
                    }
                ], function(err, waterResult) {
                    if(err)
                        return cb(err, null);
                    cb(null, waterResult);
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
            var result = {
                userId: userId
            };
            if(err)
                return cb(err, null);
            if(results === undefined) {
                //no user found
                return cb('No User found!', null);
            }
            async.parallel([
                function(cb) {
                    sails.models['payments'].findOne({ where: { id: results.userPaymentMethod || {} } }).exec(function(err, paymentsResult) {
                        if (err)
                            return cb(err, null);
                        var userPaymentMethod = {};
                        if(paymentsResult) {
                            userPaymentMethod = {
                                lastFour: paymentsResult.lastFour,
                                cardType: paymentsResult.cardType,
                                expirationDate: paymentsResult.expirationDate,
                                paymentMethodToken: paymentsResult.paymentMethodToken
                            }
                        }
                        result.userPaymentMethod = userPaymentMethod,
                        cb(null, paymentsResult);
                    });
                },
                function(cb) {
                    sails.models['merchant'].findOne({where: {id: results.userMerchant || {} }}).exec(function (err, merchantResult) {
                        if (err)
                            return cb(err, null);
                        var userMerchant = {};
                        if(merchantResult) {
                            userMerchant = {
                                accountNumberLast4: merchantResult.accountNumberLast4,
                                routingNumber: merchantResult.routingNumber,
                                fundingDestination: merchantResult.fundingDestination,
                                mobilePhone: merchantResult.mobilePhone,
                                merchantId: merchantResult.merchantId
                            }
                        }
                        result.userMerchant = userMerchant;
                        cb(null, merchantResult);
                    });
                }
            ], function(err, paraResults) {
                if(err)
                    cb(err, null);
                cb(null, result);
            })
        });
    }

    module.exports.deletePaymentMethod = function (userId, cb){
        if(!userId)
            return cb('userId is missing!', null);

        sails.models['user'].findOne({ where: { id: userId } }).populate('userPaymentMethod').exec(function(err, results){
            if(err)
                return cb(err, null);
            if(results && results.userPaymentMethod) {
                getgateway().paymentMethod.delete(results.userPaymentMethod.paymentMethodToken, function (err) {
                    if(err)
                        return cb(err, null);
                    //destroy object from db
                    sails.models['payments'].destroy({where: {id: results.userPaymentMethod.id } }).exec(function deleteCB(err, delResult){
                        if(err)
                            console.log('Error deleting record from our db');

                        return cb(null, delResult);
                    });
                });
            } else {
                return cb(null, 'No Payment Method Found to Delete');
            }
        });
    }

    module.exports.deleteMerchant = function (userId, cb){
        if(!userId)
            return cb('userId is missing!', null);

        sails.models['user'].findOne({ where: { id: userId } }).populate('userMerchant').exec(function(err, results){
            if(err)
                return cb(err, null);

                sails.models['merchant'].destroy({where: {id: results.userMerchant.id } }).exec(function deleteCB(err, delResult){
                    if(err)
                        console.log('Error deleting record from our db');

                    return cb(null, delResult);
                });
        });
    }

    module.exports.createSubMerchantAccount = function (merchantAccountParams, userId, cb){
        //TODO need to add more checks here for required fields
        if(!merchantAccountParams.id || !userId)
            return cb('userId is missing!', null);
        //1) check if this user has a merchant
        sails.models['user'].findOne({ where: { id: merchantAccountParams.id } }).exec(function(err, merchResults){
            if(err)
                return cb(err, null);
            if(merchResults === undefined)
                return cb('No user found', null);
            if(merchResults.userMerchant) {
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
                    sails.models['user'].update({ where: {id: userId } }, merchantUpdateObj).exec(function(err, updateResults){
                        if(err)
                            return cb(err, null);

                       cb(null, updateResults);
                    });
                });
            }
            //No merchant was found on selbi so create a new merchant on braintree
            else {
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
                        sails.models['user'].update({ where: {id: userId } }, merchantCreateObj).exec(function(err){
                            if(err)
                                return cb(err, null);
                            cb(null,{ success: true });
                        });
                    });
                });
            }
        });
    }

    module.exports.createOrder = function (listingId, buyerId, sellerId, cb){
        var listingData;
        async.waterfall([
            function(cb) {
                //Get listing data
                sails.models['listing'].findOne({ where: { id: listingId } }).populate('user').exec(function(err, listingResult){
                    if(err)
                        return cb(err, null);
                    if(listingResult.isSold === true) {
                        return cb(500, 'Item has been sold');
                    }
                    listingData = listingResult;
                    cb(null, listingResult);
                });
            },
            function(listingResult, cb) {
                //get payments data for the buyer
                sails.services['paymentsservice'].getPayments(buyerId, function (err, buyerPaymentResult) {
                    if(err)
                        return cb(err, null);

                    cb(null, listingResult, buyerPaymentResult);
                });
            },
            function(listingResult, buyerPaymentResult, cb) {
                //get payments data for the seller
                sails.services['paymentsservice'].getPayments(sellerId, function (err, sellerPaymentResult) {
                    if(err)
                        return cb(err, null);

                    cb(null, listingResult, buyerPaymentResult, sellerPaymentResult);
                });
            },
            function(listingResult, buyerPaymentResult, sellerPaymentResult, cb) {
                //create sale transaction with Braintree
                sails.services['paymentsservice'].createSaleTransaction(listingResult.price, sellerPaymentResult.userMerchant.merchantId,
                    buyerPaymentResult.userPaymentMethod.paymentMethodToken, function (err, sellerPaymentResult) {
                    if(err)
                        return cb(err, null);

                    cb(null, sellerPaymentResult, listingResult.id);
                });
            },
            function(sellerPaymentResult, listingId, cb) {
                var transactionData = {
                    isSold: true,
                    transactionId: sellerPaymentResult.transaction.id,
                    transactionAmount: sellerPaymentResult.transaction.amount,
                    serviceFee: sellerPaymentResult.transaction.serviceFeeAmount,
                    transactionDate: sellerPaymentResult.transaction.createdAt,
                    buyerId: buyerId
                }
                //get payments data for the seller
                sails.models['listing'].update({ where: {id: listingId } }, transactionData).exec(function(err, updateResult){
                    if(err)
                        return cb(err, null);

                    cb(null, updateResult);
                });
            },
            function(updateResult, cb) {
                var notificationObj = {
                    userFrom: buyerId,
                    userTo: sellerId,
                    type: 'sold'
                }
                async.parallel([
                    function(cbPar) {
                        sails.services['notificationservice'].createNotificationService( notificationObj, function(err, createResponse){
                            if(err)
                                return cbPar(500, err);
                            cbPar(null, updateResult);
                        }); 
                    },
                    function(cbPar) {
                        sails.services['userservice'].getUserDataService(buyerId, function(err, buyerData){
                            if(err)
                                return cbPar(500, err);
                            sails.services['emailservice'].sendSoldEmail(listingData, buyerData);
                            sails.services['emailservice'].sendPurchaseEmail(buyerData, listingData);
                            cbPar(null, buyerData);
                        })
                    }
                ], function(err, results) {
                    if(err)
                        return cb(500, err);
                    return cb(null, updateResult);
                });
            }
        ], function (err, result) {
            // result now equals 'done'
            if(err)
                return cb(err, null);

            cb(null, result);
        });
        //on success create an order record locally and update the listing to being sold
        //send an email or something to notify user
        //rate the merchant (from buyer)
    }

    module.exports.createSaleTransaction = function (amount, merchantId, buyerPaymentMethodToken, cb){
        if(!amount || !merchantId || !buyerPaymentMethodToken)
            return cb(500, "Amount or userId or MerchantUserId is missing!");

            getgateway().transaction.sale({
                amount: parseFloat(amount).toFixed(2),
                merchantAccountId: merchantId,
                paymentMethodToken: buyerPaymentMethodToken,
                serviceFeeAmount: (parseFloat(amount) * parseFloat(sails.config.braintree.serviceFeePercent)/100).toFixed(2),
                options: {
                    submitForSettlement: true
                }
            }, function (err, saleResult) {
                if(err)
                    return cb(err, saleResult);

                cb(null, saleResult);
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