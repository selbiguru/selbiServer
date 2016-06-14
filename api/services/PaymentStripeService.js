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
        if(!paymentStripeCardResponse || !userId)
            return cb('paymentStripeCardResponse or userId is missing!', null);

        var customerCreateParams = {
            description: 'Customer '+firstName+' '+lastName+'. Email: '+email+'.',
            source: paymentStripeCardResponse.id, // obtained with Stripe.js
            email: email
        }
        var expMonth = (paymentStripeCardResponse.card.exp_month).toString().length > 1 ? paymentStripeCardResponse.card.exp_month : '0'+paymentStripeCardResponse.card.exp_month;
        console.log('create customer 0' , customerCreateParams);
        sails.models['user'].findOne({ where: { id: userId } }).populate('userPaymentMethod').exec(function(err, customerResults){
            if(err)
                return cb(err, null);
            if(customerResults === undefined)
                return cb('No user found', null);
            console.log('create customer 1 ', customerResults);
            console.log('create customer 2 ', customerResults.userPaymentMethod);
            console.log('create customer 3 ', !customerResults.userPaymentMethod);
            if(!customerResults.userPaymentMethod){
                console.log('create customer 4');
                //customer not found so create new customer and payment method
                stripe.customers.create(customerCreateParams, function (err, customerCreateResult) {
                    console.log('create customer 5 ', customerCreateResult);
                    var cardMethodStatus = {};
                    if(err) {
                        console.log('error creating customer ', err.param,' ', err.message);
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
                        console.log('create customer 6 ', updateResult);
                        if(err)
                             return cb(err, null);

                        cb(null, cardMethodStatus);
                    });
                });//create brackets
            }
            else{
                //update customer payment method
                console.log('create customer 7 ');
                stripe.customers.update(customerResults.userPaymentMethod.stripeCustomerId, customerCreateParams, function (err, customerUpdate) {
                    console.log('create customer 8 ', err);
                    console.log('create customer 9 ', customerUpdate);
                    var cardMethodStatus = {};
                    if(err) {
                        console.log('error creating customer ', err.param,' ', err.message);
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
                        console.log('create customer 9 ', resultsCustomer);
                        if (err)
                            return cb(err, null);
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
                if(err)
                return cb(err, null);
            if(customerResults === undefined)
                return cb('No user found', null);
            if(!findCustomerResult.userPaymentMethod)
                return cb('No stripe customer found', null);
            stripe.customers.retrieve("cus_8brBBcDuO2aoUd'", function(err, customer) {
                // asynchronously called
                if(err)
                    return cb(err, null);
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
                                stripeCustomerId: paymentsResult.stripeCustomerId
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
                                stripeBankId: merchantResult.stripeBankId,
                                stripeManagedAccountId : merchantResult.stripeManagedAccountId,
                                publicKey: merchantResult.publicKey,
                                stripeVerified: merchantResult.stripeVerified,
                                fields_needed: merchantResult.fields_needed
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

    module.exports.deleteCustomer = function (userId, cb){
        if(!userId)
            return cb('userId is missing!', null);

        sails.models['user'].findOne({ where: { id: userId } }).populate('userPaymentMethod').exec(function(err, results){
            if(err)
                return cb(err, null);
            if(results && results.userPaymentMethod) {
                stripe.customers.del( results.userPaymentMethod.stripeCustomerId, function(err, deleteCustomer) {
                    console.log('delete payment method 3 ', err);
                    console.log('delete payment method 4 ', deleteCustomer);
                    // asynchronously called
                    if(err) {
                        console.log('error deleting customer ', err.param,' ', err.message);
                        return cb(err.message, null);
                    }
                    //update the merchant info in selbi db
                    sails.models['payments'].destroy({ where: {id: results.userPaymentMethod.id } }).exec(function(err, destroyCustomerResults){
                        console.log('delete payment method 5 ', destroyCustomerResults);
                        if(err){
                            console.log('Error deleting customer from Selbi');
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
            console.log('delete payment method 0 ', results);
            console.log('delete payment method 1 ', results.userPaymentMethod);
            console.log('delete payment method 2 ', !results.userPaymentMethod);
            if(err)
                return cb(err, null);
            if(results && results.userPaymentMethod) {

                stripe.customers.deleteCard( results.userPaymentMethod.stripeCustomerId, results.userPaymentMethod.stripeCardId, function(err, deleteCustomerCard) {
                    console.log('delete payment method 3 ', err);
                    console.log('delete payment method 4 ', deleteCustomerCard);
                    // asynchronously called
                    if(err) {
                        console.log('error deleting customer card ', err.param,' ', err.message);
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
                        console.log('delete payment method 5 ', updateResults);
                        if(err)
                            console.log('Error deleting customer card from our db');

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
            if(err)
                return cb(err, null);
            if(results && results.userMerchant) {
                stripe.accounts.del(results.userMerchant.stripeManagedAccountId, function(err, deleteConfirmation){
                    console.log('delete payment method 0 ', err);
                    console.log('delete payment method 1 ', deleteConfirmation);
                    if(err){
                        console.log('error deleting managed external account ', err.param,' ', err.message);
                        return cb(err.message, null);
                    }

                    //update the merchant info in selbi db
                    sails.models['merchant'].destroy({where: {id: results.userMerchant.id } }).exec(function(err, destroyResult){
                        console.log('delete payment method 2 ', err);
                        console.log('delete payment method 3 ', destroyResult);
                        if(err){
                            console.log('Error deleting managed account from selbi');
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
            if(err)
                return cb(err, null);
            stripe.accounts.deleteExternalAccount(results.userMerchant.stripeManagedAccountId, results.userMerchant.stripeBankId, function(err, deleteConfirmation){
                if(err){
                    console.log('error deleting managed external account ', err.param,' ', err.message);
                    return cb(err.message, null);
                }
                var managedAccountDeleteObj = {
                    accountNumberLast4: '',
                    routingNumber:  '',
                    stripeBankId: ''
                }
                //update the merchant info in selbi db
                sails.models['merchant'].update({ where: {id: results.userMerchant.id } }, managedAccountDeleteObj).exec(function(err, updateResults){
                    if(err)
                        return cb(err, null);

                   cb(null, updateResults);
                });
            });
        });
    }

    module.exports.getManagedAccount = function(userId, cb) {
        if(!userId)
            return cb('userId is missing!', null);
        sails.models['user'].findOne({ where: { id: userId } }).populate('userMerchant').exec(function(err, userResult){
            if(err)
                return cb(err, null);
            if(userResult === undefined)
                return cb('No user found', null);
            if(userResult.userMerchant) {
                stripe.accounts.retrieve(userResult.userMerchant.stripeManagedAccountId, function(err, managedAccount) {
                    // asynchronously called
                    if(err)
                        console.log('error getting managed account ', err.param,' ', err.message);
                        return cb(err.message, null);
                    return cb(null, managedAccountUpdate);
                });
            } else {
                return cb('No Managed Account Found', null);
            }
        });
    }

    module.exports.createManagedAccount = function (managedAccountParams, userId, cb){
        //TODO need to add more checks here for required fields
        if(!managedAccountParams.id || !userId)
            return cb('userId is missing!', null);
        //1) check if this user has a merchant
        sails.models['user'].findOne({ where: { id: managedAccountParams.id } }).populate('userMerchant').exec(function(err, merchResults){
            console.log('create managed account 1 ' , merchResults);
            console.log('create managed account 2 ' , !merchResults.userMerchant);
            console.log('create managed account 2.5 ' , !!merchResults.userMerchant);
            if(err)
                return cb(err, null);
            if(merchResults === undefined)
                return cb('No user found', null);
            if(merchResults.userMerchant) {
                console.log('create managed account 3');
                //update managed account on stripe
                stripe.accounts.update(merchResults.userMerchant.stripeManagedAccountId, { external_account: managedAccountParams.external_account}, function(err, managedAccountUpdate) {
                    console.log('create managed account 4 ' , err);
                    console.log('create managed account 5 ' , managedAccountUpdate);
                    if(err) {
                        console.log('error updating managed account ', err.param,' ', err.message);
                        return cb(err.message, null);
                    }
                    var managedAccountUpdateObj = {
                        accountNumberLast4: managedAccountUpdate.external_accounts.data[0].last4,
                        routingNumber:  managedAccountUpdate.external_accounts.data[0].routing_number,
                        stripeBankId: managedAccountUpdate.external_accounts.data[0].id,
                        stripeManagedAccountId: managedAccountUpdate.id,
                        stripeVerified: managedAccountUpdate.legal_entity.verification.status,
                        fields_needed: managedAccountUpdate.verification.fields_needed
                    }
                    //create the merchant info in selbi db
                    sails.models['merchant'].update({ where: {id: merchResults.id } }, managedAccountUpdateObj).exec(function(err, updateResults){
                        console.log('create managed account 6 ' , err);
                        console.log('create managed account 7 ' , updateResults);
                        if(err)
                            return cb(err, null);

                       cb(null, updateResults);
                    });
                });
            }
            //No merchant was found on selbi so create a new merchant on braintree
            else {
                delete managedAccountParams['id'];
                //add unix date to managedAccountParams for stripe validation purposes
                managedAccountParams.tos_acceptance.date = (new Date(merchResults.createdAt).getTime() / 1000).toFixed(0);
                console.log('create managed account 8 ' , managedAccountParams.tos_acceptance.date);
                stripe.accounts.create(managedAccountParams, function(err, managedAccountCreate) {
                  console.log('create managed account 9 ' , err);
                  console.log('create managed account 10 ' , managedAccountCreate);
                  // asynchronously called
                    if(err) {
                        console.log('error creating managed account ', err.param,' ', err.message);
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
                            fields_needed: managedAccountCreate.verification.fields_needed
                        }
                    }
                    //create the merchant info in selbi db
                    sails.models['user'].update({ where: {id: userId } }, merchantCreateObj).exec(function(err, manageUserUpdate){
                        console.log('create managed account 11 ' , err);
                        console.log('create managed account 12 ' , manageUserUpdate);
                        if(err)
                            return cb(err, null);
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
                //create sale transaction with Braintree
                sails.services['paymentstripeservice'].createSaleTransaction(listingResult, sellerPaymentResult.userMerchant,
                    buyerPaymentResult.userPaymentMethod, function (err, sellerPaymentResult) {
                    if(err)
                        return cb(err, null);

                    cb(null, sellerPaymentResult, listingResult.id);
                });
            },
            function(sellerPaymentResult, listingId, cb) {
                console.log('create sale 3 ', sellerPaymentResult)
                var transactionData = {
                    isSold: true,
                    chargeId: sellerPaymentResult.id,
                    transactionAmount: parseFloat((parseFloat(sellerPaymentResult.amount)/100).toFixed(2)),
                    application_fee: sellerPaymentResult.application_fee,
                    transactionDate: new Date(parseFloat(sellerPaymentResult.created)).toISOString(),
                    transferId: sellerPaymentResult.transfer,
                    destinationAccount: sellerPaymentResult.destination,
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
                    if(err)
                        return cb(500, err);
                    return cb(null, updateResult);
                });
            }
        ], function (err, result) {
            // result now equals 'done'
            if(err)
                return callback(err, null);

            callback(null, result);
        });
        //on success create an order record locally and update the listing to being sold
        //send an email and notification to notify user
    }

    module.exports.createSaleTransaction = function (listing, managedAccount, customerAccount, cb){
        console.log('create sale 0 ');
        if(!listing || !managedAccount || !customerAccount)
            return cb(500, "Listing or ManagedAccount or CustomerAccount is missing!");
        var serviceFee = listing.user.serviceFee !== parseFloat(sails.config.stripe.serviceFeePercent) ? listing.user.serviceFee < parseFloat(sails.config.stripe.serviceFeePercent) ? listing.user.serviceFee : parseFloat(sails.config.stripe.serviceFeePercent) : parseFloat(sails.config.stripe.serviceFeePercent);
        stripe.charges.create({
            amount: parseFloat(((listing.price).toFixed(2)*100).toFixed(0)),
            currency: 'usd',
            description: ""+listing.title+": "+listing.description+".",
            application_fee: parseFloat((parseFloat(listing.price) * parseFloat(serviceFee)).toFixed(0)), // amount in cents
            customer: customerAccount.stripeCustomerId,
            destination: managedAccount.stripeManagedAccountId,
            statement_descriptor: 'Selbi '+listing.title,
            metadata: {
                selbiId: listing.user.id
            }
        }, function(err, chargeResult){
            console.log('create sale 1 ', err);
            console.log('create sale 2 ', chargeResult);
            if(err)
                return cb(err, chargeResult);
            cb(null, chargeResult);
        });




            /*getgateway().transaction.sale({
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
            });*/
    }

})();