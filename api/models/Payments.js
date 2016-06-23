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
      type: 'integer',
      unique: true,
      primaryKey: true
    },
    stripeCustomerId: {
        type: 'string',
        required: false
    },
    stripeCardId: {
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
    expirationDate: {
      type: 'string',
      required: false
    },
    owner: {
      model:'user'
    }
  }
});