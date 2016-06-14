'use strict';

var _ = require('lodash');

/**
 * payments.js
 *
 * @description :: This is a model of the merchant info of a user. A one to one relationship with User model that is the owner
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
module.exports = _.merge(_.cloneDeep(require('../base/Model')), {
    attributes: {
        id:{
            type: 'integer',
            unique: true,
            primaryKey: true
        },
        merchantId: { //merchant id on braintree
            type: 'string',
            required: false
        },
        accountNumberLast4: {
            type: 'string',
            required: false
        },
        routingNumber: {
            type: 'string',
            required: false
        },
        publicKey: {
            type: 'string',
            required: false
        },
        secretKey: {
          type: 'string',
          required: false
        },
        stripeBankId: {
          type: 'string',
          required: false
        },
        stripeManagedAccountId: {
          type: 'string',
          required: false
        },
        stripeVerified: {
          type: 'boolean',
          defaultsTo: false
        },
        fields_needed: {
          type: 'array',
          required: false
        },
        owner: {
            model:'user'
        }
    }
});