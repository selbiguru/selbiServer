'use strict';

var _ = require('lodash');
/**
 * Emails controller
 *
 * @description :: Server-side logic for managing emails
 */

module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {

    contactSelbi: function(req, res){
    	sails.services['emailservice'].plainTextEmail(sails.config.sendinblue.toEmail, sails.config.sendinblue.fromName, req.body['subject'], req.body['body'], req.body['email'] , req.body['name'], function(err, results){
    		if (err) { 
    			return res.json(500, err);
    		} else {
    			return res.json(200, {success: true});
    		}
    	});
    },

    sendWelcome: function(req, res){
        sails.services['emailservice'].sendWelcomeEmail(req.body['email'], req.body['firstName'], req.body['lastName']);
        res.json(200, "Success");
    },
});