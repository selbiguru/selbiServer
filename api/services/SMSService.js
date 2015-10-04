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
(function() {
    'use strict';
    var twilio = require('twilio'),
        client = new twilio.RestClient(sails.config.twilio.accountSid, sails.config.twilio.authToken);


    module.exports.sendSMSMessage = function(phoneNumber, SMSmessage ) {
    	client.messages.create({
            to: phoneNumber,
            from: sails.config.twilio.twilioPhoneNumber,
            body: SMSmessage,
        }, function(error, message) {
            if (error) {
                return res.json(500, error.message);
            } else {
                return res.json(null, message);
            }
        });
    }
})();