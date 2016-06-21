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
     *  @return     Returns Stripe updated event
     */
    module.exports.updateStripeEvent = function(eventId, cb) {
        async.waterfall([
            function(callback) {
                sails.services['webhooksservice'].retrieveStripeEvent(eventId, function (err, retrievedEvent) {
                    if(err) {
                        console.log('error retrieving stripe event ', err);
                        return callback(err, null);
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
     *  This is a public method to update Selbi merchant from Stripe Event
     *  @param      retrievedEvent is the Stripe Event
     *  @param      cb is the callback
     *  @return     Returns Updated Selbi User Account
     */
    module.exports.stripeAccountUpdate = function(retrievedEvent, cb) {
        var updateVerificationObj = {
            stripeVerified: retrievedEvent.data.object.legal_entity.verification.status,
            fields_needed: retrievedEvent.data.object.verification.fields_needed,
            due_by: new Date(parseFloat(retrievedEvent.data.object.verification.due_by )*1000).toISOString()
        }
        sails.models['merchant'].update({ where: {stripeManagedAccountId: retrievedEvent.data.object.id } }, updateVerificationObj).exec(function(err, updateVerificationMerchant){
            if(err)
                return cb(err, null);
            if(updateVerificationMerchant === null) {
                console.log('No user found to update merchant on stripe event');
            }
            return cb(null, updateVerificationMerchant);
        });       
    };


    /**
     *  This is a public method to retrieve a Stripe event 
     *  @param      eventId is the id of the Stripe Event
     *  @param      cb is the callback
     *  @return     Returns Stripe event
     */
    module.exports.retrieveStripeEvent = function(eventId, cb) {
        stripe.events.retrieve(eventId, function(err, eventObj) {
            if(err)
                return cb(err.message, null);
            return cb(null, eventObj);
        });
    };

})();