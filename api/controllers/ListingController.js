'use strict';

var _ = require('lodash');

/**
 * ListingController
 *
 * @description :: Server-side logic for managing Listing
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {

    findOne: function(req, res){
    	sails.models['listing'].findOne(req.params['id']).populate('user').exec(function(err, results){		
    		if(err) 
    			return res.json(500, err);
    		return res.json(results);
    	});
    },
    getUserListings: function(req, res){
    	sails.models['listing'].find({ where: { userId: req.params['userId'], sort: 'createdAt DESC' } }).exec(function(err, results){
    		if(err) 
    			return res.json(500, err);
    		return res.json(results);
    	});
    },
    getUsernameListings: function(req, res){
        sails.models['user'].find({ where: { username: req.params['username'] } }).exec(function(err, userResult) {
            if(err)
                return res.json(500, err);
            sails.models['listing'].find({ where: { userId: userResult[0].id, sort: 'createdAt DESC' } }).exec(function(err, results){
                if(err) 
                    return res.json(500, err);
                return res.json(results);
            });
        });
    }
});