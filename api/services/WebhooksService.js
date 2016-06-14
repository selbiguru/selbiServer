(function() {
    'use strict';
    /**
     * Payments Service
     *
     * @description :: Provides Stripe related calls to talk to Stripe Events
     */
    var async = require('async'),
    self = this,
    stripe = require('stripe')(sails.config.stripe.privateKey);

    /**
     *  This is a public method to update a Stripe event 
     *  @param      eventId is the id of the Stripe Event
     *  @param      cb is the callback
     *  @return     Returns Stripe/Selbi updated event
     */
    module.exports.updateStripeEvent = function(eventId, cb) {
        async.waterfall([
            function(callback) {
                sails.services['webhookservice'].retrieveStripeEvent(eventId, function (err, retrievedEvent) {
                    if(err) {
                        console.log('error retrieving stripe event ', err.param,' ', err.message);
                        return callback(err.message, null);
                    }
                    return callback(null, retrievedEvent);
                });
            },
            function(retrievedEvent, callback) {
                var updateEvent = {
                    type: retrievedEvent.type,
                    livemode: retrievedEvent.livemode,
                    request: retrievedEvent.request
                }
                sails.models['stripeevent'].update({ where: {eventId: retrievedEvent.id } }, updateEvent).exec(function(err, updateEventResult){
                    if(err)
                        return callback(err, null);
                    return callback(null, updateEventResult);
                }); 
            }
        ], function (err, result) {
            if(err)
                return cb(err, null);

            cb(null, result);
        });
    };

    /**
     *  This is a public method to get a Stripe event 
     *  @param      eventId is the id of the Stripe Event
     *  @param      cb is the callback
     *  @return     Returns Stripe updated event
     */
    module.exports.stripeAccountUpdate = function(eventId, cb) {
        async.waterfall([
            function(callback) {
                sails.services['webhookservice'].retrieveStripeEvent(eventId, function (err, retrievedEvent) {
                    console.log('webhook stripe 5 ', err);
                    console.log('webhook stripe 6 ', retrievedEvent);
                    if(err) {
                        console.log('error retrieving stripe event ', err.param,' ', err.message);
                        return callback(err.message, null);
                    }
                    return callback(null, retrievedEvent);
                });
            },
            function(retrievedEvent, callback) {
                var updateVerificationObj = {
                    stripeVerified: retrievedEvent.data.object.legal_entity.verification.status,
                    fields_needed: retrievedEvent.data.object.verification.fields_needed
                }
                console.log('webhook stripe 7 ', updateEvent);
                sails.models['merchant'].update({ where: {stripeManagedAccountId: retrievedEvent.data.object.id } }, updateVerificationObj).exec(function(err, updateVerificationMerchant){
                    console.log('webhook stripe 8 ', err);
                    console.log('webhook stripe 9 ', updateVerificationMerchant);
                    if(err)
                        return callback(err, null);
                    return callback(null, updateVerificationMerchant);
                }); 
            }
        ], function (err, result) {
            console.log('webhook stripe 10 ', err);
            console.log('webhook stripe 11 ', result);
            if(err)
                return cb(err, null);

            return cb(null, result);
        });
    };


    /**
     *  This is a public method to retrieve a Stripe event 
     *  @param      eventId is the id of the Stripe Event
     *  @param      cb is the callback
     *  @return     Returns Stripe updated event
     */
    module.exports.retrieveStripeEvent = function(eventId, cb) {
        stripe.events.retrieve(eventId, function(err, eventObj) {
            if(err)
                return cb(err.message, null);
            return cb(null, eventObj);
        });
    };

})();