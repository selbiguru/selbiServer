'use strict';

var _ = require('lodash');
var SMSService = require('../services/SMSService');
/**
 * TwilioController
 *
 * @description :: Server-side logic for managing Twilio
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {

    sendSMSMessage: function(req, res){
        var message: "Hello from Selbi!  Please use the following code ("+req.body['verifyPhone']+") to verify your phone."
    	SMSService.sendSMSMessage(req.body['phoneNumber'], message, function(err, response){
            if(err){
                return (500, err);
            } else {
                return (null, response);
            }
        });
    },
});

