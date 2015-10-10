'use strict';

var _ = require('lodash');
/**
 * TwilioController
 *
 * @description :: Server-side logic for managing Twilio
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {

    sendValidationMessage: function(req, res){
    	sails.services['smsservice'].sendValidationMessage(req.body['phoneNumber'], req.body['verifyPhone'], function(err, response){
            console.log("#$@#$@#$@#$ ", err);
            console.log("michigan go blue ", response);
            if(err){
                return res.send(err.status, err);
            } else {
                return res.send({"success":200});
            }
        });
    },
});

