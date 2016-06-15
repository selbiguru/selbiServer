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
        console.log('webhook stripe 0.00.00 ', req.body);
        console.log('webhook stripe 1.1.1 ', req.body.livemode);
        console.log('webhook stripe 1.1.1 ', typeof req.body);
        if(!req.body)
            return res.send(300);
        // Retrieve the request's body and parse it as JSON
        var event_json = req.body;
        console.log('webhook stripe 0 ', event_json);
        var createEventObj = {
            eventId:event_json.id,
            type: event_json.type,
            livemode: event_json.livemode,
            request: event_json.request
        }
        if(event_json.livemode){
            //save the payment token user can have multiple payment methods
            sails.models['stripeevent'].create(createEventObj).exec(function(err, createEventResult){
                console.log('webhook stripe 1 ', err);
                console.log('webhook stripe 2 ', createEventResult);
                if(err)
                     return res.send(300);
                res.send(200);
                if(event_json.type === 'account.updated'){
                    sails.services['webhooksservice'].stripeAccountUpdate(event_json.id, function(err, updateEventResult){
                        console.log('webhook stripe 3 ', err);
                        console.log('webhook stripe 4 ', updateEventResult);
                        if(err){
                            console.log('err updating Selbi user object');
                            return;
                        }
                        console.log('saved updated Selbi user object');
                        return;
                    });
                }
            });
        } else {
            console.log('TEST SUCCESSFUL!!!!!!!');
            res.send(200);
        }
    },

    testStripeEvent: function(req, res){
        console.log('webhook stripe 0.00.00 ', req.body);
        console.log('webhook stripe 1.1.1 ', req.body.livemode);
        console.log('webhook stripe 1.1.1 ', typeof req.body);
        if(!req.body)
            return res.send(300);
        // Retrieve the request's body and parse it as JSON
        var event_json = req.body;
        console.log('webhook stripe 0 ', event_json);
        var createEventObj = {
            eventId:event_json.id,
            type: event_json.type,
            livemode: event_json.livemode,
            request: event_json.request
        }
        //save the payment token user can have multiple payment methods
        sails.models['teststripeevent'].create(createEventObj).exec(function(err, createEventResult){
            console.log('webhook stripe 1 ', err);
            console.log('webhook stripe 2 ', createEventResult);
            if(err)
                 return res.send(300);
            res.send(200);
            if(event_json.type === 'account.updated'){
                sails.services['webhooksservice'].stripeAccountUpdate(event_json.id, function(err, updateEventResult){
                    console.log('webhook stripe 3 ', err);
                    console.log('webhook stripe 4 ', updateEventResult);
                    if(err){
                        console.log('err updating Selbi user object');
                        return;
                    }
                    console.log('saved updated Selbi user object');
                    return;
                });
            }
        });
    },

});