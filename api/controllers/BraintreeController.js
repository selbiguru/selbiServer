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

        //All calls to braintree will need this gateway to connect
        var gateway = braintree.connect({
            environment: braintree.Environment.Sandbox,
            merchantId: "zw67j4nst8r33wms",
            publicKey: "nktzr995vy2sxwrx",
            privateKey: "a73c6cb5a55678883fe611403d9c4e40"
        });

        gateway.clientToken.generate({}, function (err, response) {
            if(err)
                return res.json(500, err);
            return res.json(response.clientToken);
        });
    }
});
