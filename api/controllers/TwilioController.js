'use strict';

var _ = require('lodash');
/**
 * TwilioController
 *
 * @description :: Server-side logic for managing Twilio
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {

    sendSMSMessage: function(req, res){
        console.log("@#$@%$#$%#$%#$%",req.body['phoneNumber'] );
        var message = "Hello from Selbi!  Please use the following code ("+req.body['verifyPhone']+") to verify your phone."
    	sails.services['smsservice'].sendSMSMessage(req.body['phoneNumber'], message, function(err, response){
            console.log("FAHHHHHHHHHHD ", err);
            console.log("JAAAAAAAM ", response);
            if(err){
                return res.send(err.status, err);
            } else {
                return res.send(response);
            }
        });
    },
});

