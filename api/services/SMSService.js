 (function() {
    'use strict';
    var twilio = require('twilio'),
        client = new twilio.RestClient(sails.config.twilio.accountSid, sails.config.twilio.authToken),
        self = this;


    /**
     *  Send texts to the given user with the given phoneNumber name and SMSmessage
     *  This is a private method to force to create a wrapper for sending templates that is handled by this module
     * @example:
     *      sendSMSMessage('+15559090909')
     * @param  {String} to           Destination Phone Number
     * @param  {String} from         Selbi Phone Number (stored in config)
     * @param  {String} body         SMS message to send (160 character max)
     * @return                       Returns twilio response call
     */
    var sendSMSMessage = function(phoneNumber, SMSmessage, cb) {
    	client.messages.create({
            to: phoneNumber.toString(),
            from: sails.config.twilio.twilioPhoneNumber,
            body: SMSmessage,
        }, function(error, message) {
            if (error) {
                sails.log.error("sendSMSMessage");
                cb(error, null);
            } else {
                cb(null, message);
            }
        });
    }

    module.exports.sendValidationMessage = function(phoneNumber, verifyCode, cb) {
        var message = "Hello from Selbi!  Please use the following code ("+verifyCode+") to verify your phone."
        sendSMSMessage(phoneNumber.toString(), message, function(err, res) {
            cb(err, res);
        });
    }
})();