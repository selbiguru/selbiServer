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
        if(!JSON.parse(req.body))
            return res.send(300);
        // Retrieve the request's body and parse it as JSON
        var event_json = JSON.parse(req.body);
        console.log('webhook stripe 0 ', event_json);
        var updateEvent = {
            eventId:event_json.id,
            type: eventObj.type,
            livemode: eventObj.livemode,
            request: eventObj.request
        }
        //save the payment token user can have multiple payment methods
        sails.models['stripeevent'].create(updateEvent).exec(function(err, createEventResult){
            console.log('webhook stripe 1 ', err);
            console.log('webhook stripe 2 ', createEventResult);
            if(err)
                 return res.send(300);
            res.send(200);
            if(event_json.type === 'account.updated'){
                sails.services['webhookservice'].stripeAccountUpdate(event_json.id, function(err, updateEventResult){
                    console.log('webhook stripe 3 ', err);
                    console.log('webhook stripe 4 ', updateEventResult);
                    if(err){
                        console.log('err updating Stripe Event object');
                        return;
                    }
                    console.log('saved updated event object');
                    return;
                });
            }
        });
    },

});