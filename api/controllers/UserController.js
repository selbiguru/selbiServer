'use strict';

var _ = require('lodash');

/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {
	signUp: function signUp(request, response){
		sails.models['user'].create(request.params.all()).exec(function (err, user) {
			if(err) {
				return response.send(500, err.message);
			}
			var passportModel = sails.models['passport'];

			passportModel.create({
				protocol: 'local',
				password: request.body['password'],
				user: user.id
			}).exec(function(err, passport){
				if(err) {
					response.json(500, err.message);
				} else {
					sails.services['emailservice'].sendWelcomeEmail(user.email, user.firstName || user.email);
					response.json(200, user);
				}
			});
		});
	}, 
	getUserData: function getUserData(request, response){
    	sails.models['user'].find({id: request.params['userid']}).populate('userAddress').exec(function(err, results){		
    		if(err) {
    			console.log('error: ' + err);
    			return response.json(500, err);
    		}
    		return response.json(results);
    	});
	}
});
