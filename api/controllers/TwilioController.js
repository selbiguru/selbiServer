'use strict';

var _ = require('lodash');
var async = require('async');
/**
 * TwilioController
 *
 * @description :: Server-side logic for managing Twilio
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {

    sendValidationMessage: function(req, res){
        async.parallel([
            function(cb) {
                sails.services['userservice'].getUserByEmailService( req.body['email'] , function(err, userResult){
                    if(err || userResult)
                        return cb("A Selbi user already exists with this email", null);
                    return cb(null, userResult);
                });
            },
            function(cb) {
                sails.services['userservice'].uniquePhones(req.body['phoneNumber'], null, function(err, phoneResult){
                    if(err || !phoneResult)
                        return cb("A Selbi user already exists with this phone number", null);
                    return cb(null, phoneResult);
                });
            }
        ], function(err, results) {
            if(err) {
                sails.log.error('sendValidationMessage');
                sails.log.error(new Error(err));
                return res.json(500, err);
            } else {
                sails.services['smsservice'].sendValidationMessage(req.body['phoneNumber'], req.body['verifyPhone'], function(err, response){
                    if(err){
                        sails.log.error('sendValidationMessage, twilio failed to send phone validation');
                        sails.log.error(new Error(err));
                        return res.send(err.status, 'The phone number you entered is unable to receive a validation text from us, please check your phone number and try again');
                    } else {
                        return res.send({"success":200});
                    }
                });
            }
        });
    },
});

