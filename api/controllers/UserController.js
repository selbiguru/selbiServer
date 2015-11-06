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
	getUserData: function(req, res){
        //TODO Add code here to accept an options object to pupulate objects that are asked for in the call
        /*
        var options = {
			populateAddress = true,
			populatePaymentMethod = true
        }
        */
    	sails.models['user'].findOne({ where: { id: req.params['userId'] } }).populate('userAddress').exec(function(err, results){
    		if(err) 
    			return res.json(500, err);
    		return res.json(results);
    	});
    },
    updateUserData: function (req, res){
    	sails.models['user'].update({id: req.params['userId']}, req.body).exec(function(err, updateResult){
    		if(err)
    			return res.json(500, err);
    			//do a find and populate again to populate address. 
	    	sails.models['user'].findOne({ where: { id: req.params['userId'] } }).populate('userAddress').exec(function(err, results){
	    		if(err) 
	    			return res.json(500, err);
	    		return res.json(results);
    		});
    	});
    },
    uniqueUsername: function (req, res){
    	sails.models['user'].find({where : {username: req.body['username']} }).exec(function(err, results) {
    		if(err)
    			return res.json(500, err);
    		if(results.length > 0) {
    			for(var i in results) {
    				if(results[i].id !== req.body['userId']) {
    					return res.json(false)
    				}
    			}
    			return res.json(true);
    		} else {
    			return res.json(true);
    		}
    	});
    }
});
