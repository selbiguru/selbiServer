'use strict';

var _ = require('lodash');

/**
 * payments.js
 *
 * @description :: This is a model of the payment info of a user. A one to one relationship with User model that is the owner
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
module.exports = _.merge(_.cloneDeep(require('../base/Model')), {
  attributes: {
    id:{
      type: 'string',
      unique: true,
      primaryKey: true
    },
    /* merchant account Id for bank account info saved on braintree */
    merchantAccountId: {
      type: 'string',
      required: false
    },
    paymentMethodToken: {
        type: 'string',
        required: false
    },
    cardType: {
      type: 'string',
      required: false
    },
    lastFour: {
      type: 'string',
      required: false
    },
    owner: {
            model:'user'
    }
  }
});