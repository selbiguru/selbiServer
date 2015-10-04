'use strict';

var _ = require('lodash');
var twilio = require('twilio');
var client = new twilio.RestClient(sails.config.twilio.accountSid, sails.config.twilio.authToken);
/**
 * ListingController
 *
 * @description :: Server-side logic for managing Listing
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {

    sendSMSMessage: function(req, res){
    	client.messages.create({
            to:req.body['phoneNumber'];,
            from: sails.config.twilio.twilioPhoneNumber,
            body:'Hello from Selbi!  Please use the following code '+req.body['verifyPhone']+'.',
        }, function(error, message) {
            if (error) {
                return res.json(500, error.message);
            } else {
                return res.json(null, message);
            }
        });
    },
});

