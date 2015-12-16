'use strict';

var _ = require('lodash');
var async = require('async');
var bcrypt = require('bcryptjs');

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
					sails.services['emailservice'].sendWelcomeEmail(user.email, user.firstName, user.lastName);
					response.json(200, user);
				}
			});
		});
	},
	forgotPassword: function(req, res){
        async.waterfall([
        	function(cb) {
        		bcrypt.genSalt(10, function callback(error, salt) {
        			if(error)
        				cb(error, null);
        			var token = salt.toString('hex');
        			cb(null, token);
      			});
        	},
        	function(token, cb) {
        		sails.models['user'].findOne({where: {email: req.body['email'] } }).exec(function(err, userResult) {
        			if(err) {
        				cb(err, null)
        			} else if(!userResult) {
        				cb(userResult, null);
        			} else {
        				var passwordObject = {
	        				resetPasswordToken: token,
					        resetPasswordExpires: Date.now() + 1800000 // 1/2 hour
					    }
				        sails.models['user'].update({where: {email: req.body['email'] } }, passwordObject).exec(function(err, user) {
				        	if(err)
				        		cb(err, null);
				        	cb(null, token, userResult);
				        });
        			}
        		});
        	},
        	function(token, userResult, cb) {
        		//sails.services['emailservice'].sendWelcomeEmail('selbiguru@gmail.com', req.body['firstName'], req.body['lastName']);
        		cb(null, "Success");
        	}
       	], function(err, results) {
       		if(err)
       			res.json(500, err)
       		res.json(results);
       	});
    },
    validateLinkPassword: function(req, res) {
    	sails.models['user'].findOne({resetPasswordToken: req.params['token'], resetPasswordExpires: {'>': Date.now()}}).exec(function(err, userResult) {
			if(err){
				cb(err, null);
			} else if(!userResult) {
				cb(userResult, null);
			} else {
				res.redirect('/error');
			}
		});
    },
    resetPassword: function(req, res) {
    	var passportModel = sails.models['passport'];
        async.waterfall([
        	function(cb) {
        		sails.models['user'].findOne({resetPasswordToken: req.params['token'], resetPasswordExpires: {'>': Date.now()}}).exec(function(err, userResult) {
        			if(err){
        				cb(err, null);
        			} else if(!userResult) {
        				cb(userResult, null);
        			} else {
        				var passwordObject = {
	        				resetPasswordToken: undefined,
					        resetPasswordExpires: undefined
					    }
				        sails.models['user'].update({where: {id: userResult.id } }, passwordObject).exec(function(err, user) {
				        	if(err)
				        		cb(err, null);
				        	cb(null, user[0]);
				        });
        			}
        		});
        	},
        	function(user, cb) {
        		req.body.password
        		passportModel.update({where: { user: user.id } },{ password: req.body['password'] }).exec(function(err, passport){
					if(err) {
						cb(err, null);
					} else {
						cb(null, 'Success');
					}
				});
        	}
       	], function(err, results) {
       		if(err)
       			res.json(500, err)
       		res.json(results);
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
        sails.services['userservice'].getUserDataService( req.params['userId'] , function(err, userResult){
            if(err)
                return res.json(500, err);
            return res.json(userResult);
        });
    },
    updateUserData: function (req, res){
    	sails.models['user'].update({where : { id: req.params['userId'] } }, req.body).exec(function(err, updateResult){
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
    },
    uniquePhones: function (req, res){
    	sails.models['user'].find({where : {phoneNumber: req.body['phone']} }).exec(function(err, results) {
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
    },
    getUserByUsername: function (req, res){
    	sails.services['userservice'].getUserByUsernameService( req.params['username'], function(err, usernameUser){
            if(err)
                return res.json(500, err);
            return res.json(usernameUser);
        });
    },
    getUsersByPhones: function(req, res){
		var userList = req.body;
		var responseList = [];

		async.eachLimit(userList, 50, function(user, cbEach){
			sails.models['user'].findOne({ where: {phoneNumber: user.newNumber }}).exec(function(err, result){
				if(err) {
					return res.json(500, err);
				}
				if(result && result.id) {
					sails.services['invitationservice'].getInvitationByUserIdsService( req.params['userId'], result.id, function(err, results) {
						if(err) {
							return res.json(500, err);
						} else {
							responseList.push({
								newNumber: user.newNumber,
								originalNumber: user.originalNumber,
								contactName: user.contactName,
								username: result.username,
								id: result ? result.id : 0,
								isActiveUser: result && result.id ? true : false,
								invitation: results
							});
							cbEach();
						}
					});
				} else {
					responseList.push({
						newNumber: user.newNumber,
						originalNumber: user.originalNumber,
						contactName: user.contactName,
						username: false,
						id: 0,
						isActiveUser: false,
						invitation: []
					});
					cbEach();
				}
	    	});
		}, function(err){
			if(err) {
				return res.json(500, err);
			}
			return res.json(responseList);
		});
	}
});