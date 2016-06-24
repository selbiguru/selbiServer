'use strict';

var _ = require('lodash');
var stripe = require('stripe')(sails.config.stripe.privateKey);
/**
 * Stripe payments controller
 *
 * @description :: Server-side logic for managing payments through Stripe
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {

    stripeEvent: function(req, res){
        if(!req.body)
            return res.send(300);
        // Retrieve the request's body and parse it as JSON
        var event_json = req.body;
        var createEventObj = {
            eventId:event_json.id,
            type: event_json.type,
            livemode: event_json.livemode,
            request: event_json.request
        }
        if(event_json.livemode){
            //save the payment token user can have multiple payment methods
            sails.models['stripeevent'].create(createEventObj).exec(function(err, createEventResult){
                if(err) {
                    sails.log.error('stripeEvent, create stripe event');
                    sails.log.error(new Error(err));
                    return res.send(300);
                }
                res.send(200);
                if(event_json.type === 'account.updated'){
                    sails.services['webhooksservice'].retrieveStripeEvent(event_json.id, function (err, retrievedEvent) {
                        if(err) {
                            sails.log.error('stripeEvent, retrieve stripe event');
                            sails.log.error(new Error(err));
                            return;
                        }
                        sails.services['webhooksservice'].stripeAccountUpdate(retrievedEvent, function(err, updateEventResult){
                            if(err){
                                sails.log.error('stripeEvent, update user stripe account on db');
                                sails.log.error(new Error(err));
                                return;
                            }
                            sails.log.verbose('saved updated Selbi merchant object with stripe event');
                            return;
                        });
                    });
                }
            });
        } else {
            res.send(200);
        }
    },

    testStripeEvent: function(req, res){
        if(!req.body)
            return res.send(300);
        // Retrieve the request's body and parse it as JSON
        var event_json = req.body;
        var createEventObj = {
            eventId:event_json.id,
            type: event_json.type,
            livemode: event_json.livemode,
            request: event_json.request
        }
        //save the payment token user can have multiple payment methods
        sails.models['teststripeevent'].create(createEventObj).exec(function(err, createEventResult){
            if(err) {
                sails.log.error('testStripeEvent, create test stripe event');
                sails.log.error(new Error(err));
                return res.send(300);
            }
            res.send(200);
            if(event_json.type === 'account.updated'){
                sails.services['webhooksservice'].stripeAccountUpdate(event_json, function(err, updateEventResult){
                    if(err){
                        sails.log.error('testStripeEvent, updating stripe event in db');
                        sails.log.error(new Error(err));
                        return;
                    }
                    sails.log.verbose('saved updated Selbi merchant object with stripe test event');
                    return;
                });
            }
        });
    },

});