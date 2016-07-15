(function() {
    'use strict';
    /**
     * Payments Service
     *
     * @description :: Provides payment related calls to talk to Stripe
     */
    var async = require('async'),
    self = this,
    stripe = require('stripe')(sails.config.stripe.privateKey);


    module.exports.createCustomerAndPaymentMethod = function(userId, firstName, lastName, email, paymentStripeCardResponse, cb){
        if(!paymentStripeCardResponse || !userId) {
            return cb('paymentStripeCardResponse or userId is missing!', null);
        }

        var customerCreateParams = {
            description: 'Customer '+firstName+' '+lastName+'. Email: '+email+'.',
            source: paymentStripeCardResponse.id, // obtained with Stripe.js
            email: email
        }
        var expMonth = (paymentStripeCardResponse.card.exp_month).toString().length > 1 ? paymentStripeCardResponse.card.exp_month : '0'+paymentStripeCardResponse.card.exp_month;
        sails.models['user'].findOne({ where: { id: userId } }).populate('userPaymentMethod').exec(function(err, customerResults){
            if(err) {
                sails.log.error("createCustomerAndPaymentMethod, finding user");
                return cb(err, null);
            }
            if(customerResults === undefined) {
                sails.log.warn("createCustomerAndPaymentMethod, no user found");
                return cb('No user found', null);
            }
            if(!customerResults.userPaymentMethod){
                //customer not found so create new customer and payment method
                stripe.customers.create(customerCreateParams, function (err, customerCreateResult) {
                    var cardMethodStatus = {};
                    if(err) {
                        sails.log.error("createCustomerAndPaymentMethod, error creating customer ", err.param);
                        return cb(err.message, null);
                    }
                    var pm = {
                        id: userId,
                        userPaymentMethod:{
                            stripeCustomerId: customerCreateResult.id,
                            stripeCardId: paymentStripeCardResponse.card.id,
                            lastFour: paymentStripeCardResponse.card.last4,
                            cardType: paymentStripeCardResponse.card.brand,
                            expirationDate: expMonth+'/'+paymentStripeCardResponse.card.exp_year
                        }
                    }
                    //save the payment token user can have multiple payment methods
                    sails.models['user'].update({ where: {id: userId } }, pm).exec(function(err, updateResult){
                        if(err) {
                            sails.log.error("createCustomerAndPaymentMethod, updating new user");
                            return cb(err, null);
                        }
                        cb(null, cardMethodStatus);
                    });
                });
            }
            else{
                //update customer payment method
                stripe.customers.update(customerResults.userPaymentMethod.stripeCustomerId, customerCreateParams, function (err, customerUpdate) {
                    var cardMethodStatus = {};
                    if(err) {
                        sails.log.error("createCustomerAndPaymentMethod, error updating customer ", err.param);
                        return cb(err.message, null);
                    }
                    var pm = {
                        stripeCustomerId: customerUpdate.id,
                        stripeCardId: paymentStripeCardResponse.card.id,
                        lastFour: paymentStripeCardResponse.card.last4,
                        cardType: paymentStripeCardResponse.card.brand,
                        expirationDate: expMonth+'/'+paymentStripeCardResponse.card.exp_year
                    };

                    //save the payment token user can have multiple payment methods
                    sails.models['payments'].update({ where: {id: customerResults.userPaymentMethod.id } }, pm).exec(function (err, resultsCustomer) {
                        if (err) {
                            sails.log.error("createCustomerAndPaymentMethod, updating user");
                            return cb(err, null);
                        }
                        cb(null, cardMethodStatus);
                    });
                }); //create payment method  
            } //else
        }); // customer find end brackets
    }

    module.exports.getCustomerOnStripe = function (userId, cb){
        if(!userId)
            return cb('userId is missing!', null);
        sails.models['user'].findOne({ where: { id: userId } }).populate('userPaymentMethod').exec(function(err, findCustomerResult){
            if(err) {
                sails.log.error("getCustomerOnStripe, finding user");
                return cb(err, null);
            }
            if(findCustomerResult === undefined) {
                sails.log.warn("getCustomerOnStripe, no user found");
                return cb('No user found', null);
            }
            if(!findCustomerResult.userPaymentMethod) {
                sails.log.warn("getCustomerOnStripe, no stripe customer found");
                return cb('No stripe customer found', null);
            }
            stripe.customers.retrieve(findCustomerResult.userPaymentMethod.stripeCustomerId, function(err, customer) {
                // asynchronously called
                if(err) {
                    sails.log.error("getCustomerOnStripe, retrieving customer from stripe");
                    return cb(err, null);
                }
                cb(err, customer);
            });
        });
    }

    module.exports.getPayments = function (userId, cb){
        if(!userId)
            return cb('userId is missing!', null);
        sails.models['user'].findOne({ where: { id: userId } }).exec(function(err, results){
            var result = {
                userId: userId
            };
            if(err) {
                sails.log.error("getPayments, finding user");
                return cb(err, null);
            }
            if(results === undefined) {
                //no user found
                sails.log.warn("getPayments, no user found");
                return cb('No User found!', null);
            }
            async.parallel([
                function(cb) {
                    sails.models['payments'].findOne({ where: { id: results.userPaymentMethod || {} } }).exec(function(err, paymentsResult) {
                        if (err) {
                            sails.log.warn("getPayments, finding payment method");
                            return cb(err, null);
                        }
                        var userPaymentMethod = {};
                        if(paymentsResult) {
                            userPaymentMethod = {
                                lastFour: paymentsResult.lastFour,
                                cardType: paymentsResult.cardType,
                                expirationDate: paymentsResult.expirationDate,
                                stripeCustomerId: paymentsResult.stripeCustomerId
                            }
                        }
                        result.userPaymentMethod = userPaymentMethod,
                        cb(null, paymentsResult);
                    });
                },
                function(cb) {
                    sails.models['merchant'].findOne({where: {id: results.userMerchant || {} }}).exec(function (err, merchantResult) {
                        if (err) {
                            sails.log.warn("getPayments, finding merchant");
                            return cb(err, null);
                        }
                        var userMerchant = {};
                        if(merchantResult) {
                            userMerchant = {
                                accountNumberLast4: merchantResult.accountNumberLast4,
                                routingNumber: merchantResult.routingNumber,
                                stripeBankId: merchantResult.stripeBankId,
                                stripeManagedAccountId : merchantResult.stripeManagedAccountId,
                                publicKey: merchantResult.publicKey,
                                stripeVerified: merchantResult.stripeVerified,
                                fields_needed: merchantResult.fields_needed,
                                due_by: merchantResult.due_by
                            }
                        }
                        result.userMerchant = userMerchant;
                        cb(null, merchantResult);
                    });
                }
            ], function(err, paraResults) {
                if(err) {
                    sails.log.error("getPayments, getting payments");
                    cb(err, null);
                }
                cb(null, result);
            })
        });
    }

    module.exports.deleteCustomer = function (userId, cb){
        if(!userId)
            return cb('userId is missing!', null);

        sails.models['user'].findOne({ where: { id: userId } }).populate('userPaymentMethod').exec(function(err, results){
            if(err) {
                sails.log.error("deleteCustomer, finding user");
                return cb(err, null);
            }
            if(results && results.userPaymentMethod) {
                stripe.customers.del( results.userPaymentMethod.stripeCustomerId, function(err, deleteCustomer) {
                    // asynchronously called
                    if(err) {
                        sails.log.error("deleteCustomer, deleting customer from stripe");
                        return cb(err.message, null);
                    }
                    //update the merchant info in selbi db
                    sails.models['payments'].destroy({ where: {id: results.userPaymentMethod.id } }).exec(function(err, destroyCustomerResults){
                        if(err){
                            sails.log.error("deleteCustomer, deleting customer from Selbi");
                            cb(err, null);
                        }

                       cb(null, destroyCustomerResults);
                    });
                });
            } else {
                return cb(null, 'No Customer Found to Delete');
            }
        });
    }

    module.exports.deletePaymentMethod = function (userId, cb){
        if(!userId)
            return cb('userId is missing!', null);
        sails.models['user'].findOne({ where: { id: userId } }).populate('userPaymentMethod').exec(function(err, results){
            if(err) {
                sails.log.error("deletePaymentMethod, finding user");
                return cb(err, null);
            }
            if(results && results.userPaymentMethod) {
                stripe.customers.deleteCard( results.userPaymentMethod.stripeCustomerId, results.userPaymentMethod.stripeCardId, function(err, deleteCustomerCard) {
                    // asynchronously called
                    if(err) {
                        sails.log.error("deletePaymentMethod deleting payment ", err.param);
                        return cb(err.message, null);
                    }
                    //update the merchant info in selbi db
                    var customerDeleteObj = {
                        cardType: '',
                        lastFour:  '',
                        expirationDate: '',
                        stripeCardId: ''
                    }
                    sails.models['payments'].update({ where: {id: results.userPaymentMethod.id } }, customerDeleteObj).exec(function(err, updateResults){
                        if(err) {
                            sails.log.error("deletePaymentMethod, updating payment db");
                        }
                       cb(null, updateResults);
                    });
                });
            } else {
                return cb(null, 'No Payment Method Found to Delete');
            }
        });
    }

    module.exports.deleteManagedAccount = function(userId, cb){
       if(!userId)
            return cb('userId is missing!', null);
        sails.models['user'].findOne({ where: { id: userId } }).populate('userMerchant').exec(function(err, results){
            if(err) {
                sails.log.error("deleteManagedAccount, finding user");
                return cb(err, null);
            }
            if(results && results.userMerchant) {
                stripe.accounts.del(results.userMerchant.stripeManagedAccountId, function(err, deleteConfirmation){
                    if(err){
                        sails.log.error("deleteManagedAccount deleting managed account from stripe ", err.param);
                        return cb(err.message, null);
                    }

                    //update the merchant info in selbi db
                    sails.models['merchant'].destroy({where: {id: results.userMerchant.id } }).exec(function(err, destroyResult){
                        if(err){
                            sails.log.error("deleteManagedAccount, destroying merchant record from db");
                            return cb(err, null);
                        }
                        return cb(null, destroyResult);
                    });
                });
            } else {
                return cb(null, 'No Managed Account Found to Delete');
            }
        }); 
    }

    module.exports.deleteExternalAccount = function (userId, cb){
        if(!userId)
            return cb('userId is missing!', null);
        sails.models['user'].findOne({ where: { id: userId } }).populate('userMerchant').exec(function(err, results){
            if(err) {
                sails.log.error("deleteExternalAccount, finding user");
                return cb(err, null);
            }
            stripe.accounts.deleteExternalAccount(results.userMerchant.stripeManagedAccountId, results.userMerchant.stripeBankId, function(err, deleteConfirmation){
                if(err){
                    sails.log.error("deleteExternalAccount, deleting external account from stripe ", err.param);
                    return cb(err.message, null);
                }
                var managedAccountDeleteObj = {
                    accountNumberLast4: '',
                    routingNumber:  '',
                    stripeBankId: ''
                }
                //update the merchant info in selbi db
                sails.models['merchant'].update({ where: {id: results.userMerchant.id } }, managedAccountDeleteObj).exec(function(err, updateResults){
                    if(err) {
                        sails.log.error("deleteExternalAccount, updating merchant in db");
                        return cb(err, null);
                    }
                   cb(null, updateResults);
                });
            });
        });
    }

    module.exports.getManagedAccount = function(userId, cb) {
        if(!userId)
            return cb('userId is missing!', null);
        sails.models['user'].findOne({ where: { id: userId } }).populate('userMerchant').exec(function(err, userResult){
            if(err) {
                sails.log.error("getManagedAccount, finding user");
                return cb(err, null);
            }
            if(userResult === undefined) {
                sails.log.warn("getManagedAccount, no user exists");
                return cb('No user found', null);
            }
            if(userResult.userMerchant) {
                stripe.accounts.retrieve(userResult.userMerchant.stripeManagedAccountId, function(err, managedAccount) {
                    // asynchronously called
                    if(err) {
                        sails.log.error("getManagedAccount, retrieving managed account from stripe ", err.param);
                        return cb(err.message, null);
                    }
                    return cb(null, managedAccountUpdate);
                });
            } else {
                return cb('No Managed Account Found', null);
            }
        });
    }

    module.exports.getManagedBalanceService = function(secretKey, cb) {
        if(!secretKey)
            return cb('secretKey is missing!', null);
        var managedBalance = require("stripe")(secretKey);
        managedBalance.balance.retrieve(function(err, balance) {
            if(err) {
                sails.log.warn("getManagedBalanceService, error in stripe retrieve balance");
                return cb(err, null);
            }
            return cb(null, balance)
        });
    }

    module.exports.createManagedAccount = function (managedAccountParams, userId, cb){
        //TODO need to add more checks here for required fields
        if(!managedAccountParams.id || !userId)
            return cb('userId is missing!', null);
        //1) check if this user has a merchant
        sails.models['user'].findOne({ where: { id: managedAccountParams.id } }).populate('userMerchant').exec(function(err, merchResults){
            if(err) {
                sails.log.error("createManagedAccount, finding user");
                return cb(err, null);
            }
            if(merchResults === undefined) {
                sails.log.warn("createManagedAccount, no user found");
                return cb('No user found', null);
            }
            if(merchResults.userMerchant) {
                //update managed account on stripe
                stripe.accounts.update(merchResults.userMerchant.stripeManagedAccountId, { external_account: managedAccountParams.external_account}, function(err, managedAccountUpdate) {
                    if(err) {
                        sails.log.error("createManagedAccount, updating managed acocunt on stripe ", err.param);
                        return cb(err.message, null);
                    }
                    var managedAccountUpdateObj = {
                        accountNumberLast4: managedAccountUpdate.external_accounts.data[0].last4,
                        routingNumber:  managedAccountUpdate.external_accounts.data[0].routing_number,
                        stripeBankId: managedAccountUpdate.external_accounts.data[0].id,
                        stripeManagedAccountId: managedAccountUpdate.id,
                        stripeVerified: managedAccountUpdate.legal_entity.verification.status,
                        fields_needed: managedAccountUpdate.verification.fields_needed,
                        due_by: managedAccountUpdate.verification.due_by
                    }
                    //create the merchant info in selbi db
                    sails.models['merchant'].update({ where: {id: merchResults.id } }, managedAccountUpdateObj).exec(function(err, updateResults){
                        if(err) {
                            sails.log.error("createManagedAccount, updating merchant on db");
                            return cb(err, null);
                        }
                       cb(null, updateResults);
                    });
                });
            }
            //No merchant was found on selbi so create a new merchant on Stripe
            else {
                delete managedAccountParams['id'];
                //add unix date to managedAccountParams for stripe validation purposes
                managedAccountParams.tos_acceptance.date = (new Date(merchResults.createdAt).getTime() / 1000).toFixed(0);
                stripe.accounts.create(managedAccountParams, function(err, managedAccountCreate) {
                  // asynchronously called
                    if(err) {
                        sails.log.error("createManagedAccount, creating managed account on stripe ", err.param);
                        return cb(err.message, null);
                    }

                    var merchantCreateObj = {
                        id: userId,
                        userMerchant:{
                            accountNumberLast4: managedAccountCreate.external_accounts.data[0].last4,
                            routingNumber:  managedAccountCreate.external_accounts.data[0].routing_number,
                            stripeBankId: managedAccountCreate.external_accounts.data[0].id,
                            stripeManagedAccountId : managedAccountCreate.id,
                            publicKey: managedAccountCreate.keys.publishable,
                            secretKey: managedAccountCreate.keys.secret,
                            stripeVerified: managedAccountCreate.legal_entity.verification.status,
                            fields_needed: managedAccountCreate.verification.fields_needed,
                            due_by: managedAccountCreate.verification.due_by
                        }
                    }
                    //create the merchant info in selbi db
                    sails.models['user'].update({ where: {id: userId } }, merchantCreateObj).exec(function(err, manageUserUpdate){
                        if(err) {
                            sails.log.error("createManagedAccount, creating merchant on db");
                            return cb(err, null);
                        }
                        cb(null,{ success: true });
                    });
                });
            }
        });
    }

    module.exports.createOrder = function (listingId, buyerId, sellerId, callback){
        var listingData;
        async.waterfall([
            function(cb) {
                //Get listing data
                sails.models['listing'].findOne({ where: { id: listingId } }).populate('user').exec(function(err, listingResult){
                    if(err) {
                        sails.log.warn("createOrder, finding user");
                        return cb(err, null);
                    }
                    if(listingResult.isSold === true) {
                        sails.log.warn("createOrder, item has been sold already");
                        return cb(500, 'Item has been sold');
                    }
                    listingData = listingResult;
                    cb(null, listingResult);
                });
            },
            function(listingResult, cb) {
                //get payments data for the buyer
                sails.services['paymentstripeservice'].getPayments(buyerId, function (err, buyerPaymentResult) {
                    if(err)
                        return cb(err, null);
                    cb(null, listingResult, buyerPaymentResult);
                });
            },
            function(listingResult, buyerPaymentResult, cb) {
                //get payments data for the seller
                sails.services['paymentstripeservice'].getPayments(sellerId, function (err, sellerPaymentResult) {
                    if(err)
                        return cb(err, null);
                    cb(null, listingResult, buyerPaymentResult, sellerPaymentResult);
                });
            },
            function(listingResult, buyerPaymentResult, sellerPaymentResult, cb) {
                //create sale transaction with Stripe
                sails.services['paymentstripeservice'].createSaleTransaction(listingResult, sellerPaymentResult.userMerchant,
                    buyerPaymentResult.userPaymentMethod, function (err, sellerPaymentResult) {
                    if(err)
                        return cb(err, null);
                    cb(null, sellerPaymentResult, listingResult.id);
                });
            },
            function(sellerPaymentResult, listingId, cb) {
                var transactionData = {
                    isSold: true,
                    chargeId: sellerPaymentResult.id,
                    transactionAmount: parseFloat((parseFloat(sellerPaymentResult.amount)/100).toFixed(2)),
                    application_fee: sellerPaymentResult.application_fee,
                    transactionDate: new Date(parseFloat(sellerPaymentResult.created)*1000).toISOString(),
                    transferId: sellerPaymentResult.transfer,
                    destinationAccount: sellerPaymentResult.destination,
                    buyerId: buyerId
                }
                //get payments data for the seller
                sails.models['listing'].update({ where: {id: listingId } }, transactionData).exec(function(err, updateResult){
                    if(err) {
                        sails.log.warn("createOrder, updating listing on db");
                        return cb(err, null);
                    }

                    cb(null, updateResult);
                });
            },
            function(updateResult, cb) {
                var soldNotificationObj = {
                    userFrom: buyerId,
                    userTo: sellerId,
                    type: 'sold'
                };
                var purchasedNotificationObj = {
                    userFrom: sellerId,
                    userTo: buyerId,
                    type: 'purchased'
                };
                async.parallel([
                    function(cbPar) {
                        sails.services['notificationservice'].createNotificationService( soldNotificationObj, function(err, createResponse){
                            if(err)
                                return cbPar(500, err);
                            cbPar(null, createResponse);
                        }); 
                    },
                    function(cbPar) {
                        sails.services['notificationservice'].createNotificationService( purchasedNotificationObj, function(err, createdResponse){
                            if(err)
                                return cbPar(500, err);
                            cbPar(null, createdResponse);
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
                    if(err) {
                        sails.log.warn("createOrder, notification and gathering user data");
                        return cb(500, err);
                    }
                    return cb(null, updateResult);
                });
            }
        ], function (err, result) {
            // result now equals 'done'
            if(err) {
                sails.log.error("createOrder, creating and executing order");
                return callback(err, null);
            }

            callback(null, result);
        });
        //on success create an order record locally and update the listing to being sold
        //send an email and notification to notify user
    }

    module.exports.createSaleTransaction = function (listing, managedAccount, customerAccount, cb){
        if(!listing || !managedAccount || !customerAccount)
            return cb(500, "Listing or ManagedAccount or CustomerAccount is missing!");
        var serviceFee = listing.user.serviceFee !== parseFloat(sails.config.stripe.serviceFeePercent) ? listing.user.serviceFee < parseFloat(sails.config.stripe.serviceFeePercent) ? listing.user.serviceFee : parseFloat(sails.config.stripe.serviceFeePercent) : parseFloat(sails.config.stripe.serviceFeePercent);
        stripe.charges.create({
            amount: parseFloat(((listing.price).toFixed(2)*100).toFixed(0)),
            currency: 'usd',
            description: ""+listing.title+": "+(listing.description).slice(0,3700)+".", //4,000 character limit
            application_fee: parseFloat((parseFloat(listing.price) * parseFloat(serviceFee)).toFixed(0)), // amount in cents
            customer: customerAccount.stripeCustomerId,
            destination: managedAccount.stripeManagedAccountId,
            statement_descriptor: 'Selbi: '+(listing.title).slice(0,15),
            metadata: {
                selbiId: listing.user.id // key:value limits - 40:500
            }
        }, function(err, chargeResult){
            if(err) {
                sails.log.error("createSaleTransaction creating a charge on stripe");
                return cb(err, chargeResult);
            }
            cb(null, chargeResult);
        });
    }

})();