'use strict';

var _ = require('lodash');
var braintree = require('braintree');
/**
 * FAQ controller
 *
 * @description :: Server-side logic for managing FAQs
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {

    getFAQ: function(req, res){
        sails.models['faq'].find().exec(function(err, results){
            if(err)
                return res.json(500, err);
            return res.json(results);
        });
    }
});