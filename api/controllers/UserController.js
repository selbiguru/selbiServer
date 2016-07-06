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
        sails.services['userservice'].uniqueUsername(request.body['username'], null, function(err, userNameResult){
            if (err) {
                sails.log.error('signUp, unique username');
                sails.log.error(new Error(err));
                request.params.all().username = request.body['username'].slice(0,16) + (Math.floor(Math.random() * 9000)+1000);
            } else if (!userNameResult) {
                request.params.all().username = request.body['username'].slice(0,16) + (Math.floor(Math.random() * 9000)+1000);
            }
            request.params.all().phoneNumber = parseFloat(request.params.all().phoneNumber);
            sails.models['user'].create(request.params.all()).exec(function (err, user) {
                if(err) {
                    sails.log.error('signUp, create user');
                    sails.log.error(new Error(err));
                    return response.send(500, "Unable to register, please try again");
                }
                var passportModel = sails.models['passport'];

                passportModel.create({
                    protocol: 'local',
                    password: request.body['password'],
                    user: user.id
                }).exec(function(err, passport){
                    if(err) {
                        sails.log.error('signUp, passport');
                        sails.log.error(new Error(err));
                        response.json(500, "Unable to register, please try again");
                    } else {
                        var welcomeEmail = (process.env.NODE_ENV === "production") ? user.email : sails.config.sendinblue.toEmail;
                        sails.services['emailservice'].sendWelcomeEmail(welcomeEmail, user.firstName, user.lastName);
                        response.json(200, user);
                    }
                });
            });
        });
	},
	forgotPassword: function(req, res){
        async.waterfall([
        	function(cb) {
        		bcrypt.genSalt(10, function callback(error, salt) {
        			if(error)
        				return cb(error, null);
        			var token = salt.toString('hex');
        			var newToken = token.replace(/\//g, "L");
        			cb(null, newToken);
      			});
        	},
        	function(token, cb) {
        		sails.models['user'].findOne({where: {email: req.body['email'] } }).exec(function(err, userResult) {
        			if(err) {
        				return cb(err, null)
        			} else if(!userResult) {
        				return cb(404, null);
        			} else {
        				var passwordObject = {
	        				resetPasswordToken: token,
					        resetPasswordExpires: Date.now() + 1800000 // 1/2 hour
					    }
				        sails.models['user'].update({where: {email: req.body['email'] } }, passwordObject).exec(function(err, user) {
				        	if(err)
				        		return cb(err, null);
				        	cb(null, token, user[0]);
				        });
        			}
        		});
        	},
        	function(token, user, cb) {
                var resetEmail = (process.env.NODE_ENV === "production") ? req.body['email'] : sails.config.sendinblue.toEmail;
        		sails.services['emailservice'].resetPasswordEmail(resetEmail, sails.config.resetPasswordRef.passwordRefLink + token);
        		cb(null, user);
        	}
       	], function(err, results) {
       		if(err) {
                sails.log.error('forgotPassword');
                sails.log.error(new Error(err));
       			return res.json(500, err)
            }
       		res.json(results);
       	});
    },
    validateLinkPassword: function(req, res) {
    	sails.models['user'].findOne({resetPasswordToken: req.params['token'], resetPasswordExpires: {'>': Date.now()}}).exec(function(err, userResult) {
			if(err){
                sails.log.error('validateLinkPassword, find one user token');
                sails.log.error(new Error(err));
				res.redirect('http://selbi.io/error');
			} else if(!userResult) {
                sails.log.warn('validateLinkPassword, no user exists');
				res.redirect('http://selbi.io/error');
			} else {
				res.redirect('http://selbi.io/resetpassword/'+req.params['token']);
			}
		});
    },
    resetPassword: function(req, res) {
    	var passportModel = sails.models['passport'];
        async.waterfall([
        	function(cb) {
        		sails.models['user'].findOne({resetPasswordToken: req.params['token'], resetPasswordExpires: {'>': Date.now()}}).exec(function(err, userResult) {
        			if(err){
        				return cb(err, null);
        			} else if(!userResult) {
        				return cb(404, null);
        			} else {
        				var passwordObject = {
	        				resetPasswordToken: undefined,
					        resetPasswordExpires: undefined
					    }
				        sails.models['user'].update({where: {id: userResult.id } }, passwordObject).exec(function(err, user) {
				        	if(err)
				        		return cb(err, null);
				        	cb(null, user[0]);
				        });
        			}
        		});
        	},
        	function(user, cb) {
        		passportModel.update({where: { user: user.id } },{ password: req.body['password'] }).exec(function(err, passport){
					if(err) {
						return cb(err, null);
					} else {
						cb(null, 'Success');
					}
				});
        	}
       	], function(err, results) {
       		if(err) {
                sails.log.error('resetPassword');
                sails.log.error(new Error(err));
       			return res.json(500, err);
            }
       		res.json(results);
       	});
    },
	getUserData: function(req, res){
        sails.services['userservice'].getUserDataService( req.params['userId'] , function(err, userResult){
            if(err) {
                sails.log.error('getUserData');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            return res.json(userResult);
        });
    },
    updateUserData: function (req, res){
    	sails.models['user'].update({where : { id: req.params['userId'] } }, req.body).exec(function(err, updateResult){
            if(err) {
                sails.log.error('updateUserData, update user data');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
    		//do a find and populate again to populate address.
	    	sails.models['user'].findOne({ where: { id: req.params['userId'] } }).populate('userAddress').exec(function(err, results){
	    		if(err) {
                    sails.log.error('updateUserData, find user');
                    sails.log.error(new Error(err));
	    			return res.json(500, err);
                }
	    		return res.json(results);
    		});
    	});
    },
    uniqueUsername: function (req, res){
    	sails.services['userservice'].uniqueUsername(req.body['username'], req.body['userId'], function(err, results){
            if (err) {
                sails.log.error('uniqueUsername');
                sails.log.error(new Error(err));
                return res.json(500, err);
            } else if (results) {
                return res.json(true);
            } else {
                return res.json(false);
            }
        });
    },
    uniquePhones: function (req, res){
    	sails.services['userservice'].uniquePhones(req.body['phone'], req.body['userId'], function(err, results){
            if (err) {
                sails.log.error('uniquePhones');
                sails.log.error(new Error(err));
                return res.json(500, err);
            } else if (results) {
                return res.json(true);
            } else {
                return res.json(false);
            }
        });
    },
    getUserByUsername: function (req, res){
    	sails.services['userservice'].getUserByUsernameService( req.params['username'], function(err, usernameUser){
            if(err) {
                sails.log.error('getUserByUsername');
                sails.log.error(new Error(err));
                return res.json(500, err);
            }
            return res.json(usernameUser);
        });
    },
    getUsersByPhones: function(req, res){
		var userList = req.body;
		var responseList = [];
        var repeatPhoneNumbers = [];
		async.eachLimit(userList, 50, function(user, cbEach){
            if(repeatPhoneNumbers.indexOf(parseFloat(user.newPhone) ) == -1 ) {
    			sails.models['user'].findOne({ where: {phoneNumber: parseFloat(user.newNumber) }}).exec(function(err, result){
                    if(err) {
    					return res.json(500, err);
    				}
    				if(result && result.id) {
                        repeatPhoneNumbers.push(parseFloat(user.newPhone));
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
            } else {
                cbEach();
            }
		}, function(err){
			if(err) {
                sails.log.error('getUsersByPhones');
                sails.log.error(new Error(err));
				return res.json(500, err);
			}
			return res.json(responseList);
		});
	}
});