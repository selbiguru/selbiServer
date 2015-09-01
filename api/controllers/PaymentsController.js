'use strict';

var _ = require('lodash');
var braintree = require('braintree');
/**
 * Braintree payments controller
 *
 * @description :: Server-side logic for managing payments through Braintree
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {

    getClientToken: function(req, res){

    getgateway().clientToken.generate({}, function (err, response) {
            if(err)
                return res.json(500, err);
            return res.json(response.clientToken);
        });
    },
    createCustomerAndPaymentMethod: function(req, res){

        getgateway.customer.create({
            id: req.params['userId'],
            firstName: req.params['firstName'],
            lastName: req.params['lastName'],
            paymentMethodNonce: req.params['paymentMethodNonce']
        }, function (err, result) {
            if(err || !result.success)
                return res.json(500, err);

            //save the paymenttoken user can have multiple payment methods
            //TODO save this to user model
            res.json(result.customer.paymentMethods);

        });
    }
});

function getgateway(){
    //All calls to braintree will need this gateway to connect
        return braintree.connect({
            environment: braintree.Environment.Sandbox,
            merchantId: sails.config.braintree.merchantId,
            publicKey: sails.config.braintree.publicKey,
            privateKey: sails.config.braintree.privateKey

    });
}
  