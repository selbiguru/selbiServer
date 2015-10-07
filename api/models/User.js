'use strict';

var _ = require('lodash');

/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
module.exports = _.merge(_.cloneDeep(require('../base/Model')), {
  attributes: {
    id:{
      type: 'string',
      unique: true,
      primaryKey: true
    },
    username: {
      type: 'string',
      unique: true
    },
    email: {
      type: 'email',
      unique: true
    },
    firstName: {
      type: 'string',
      required: true
    },
    lastName: {
      type: 'string',
      required: true
    },
    profileImage: {
      type: 'string',
      required: false
    },
    admin: {
      type: 'boolean',
      defaultsTo: false
    },
    facebookEmail: {
      type: 'email',
      unique: true
    },
    dateOfBirth: {
      type: 'string'
    },
    userAgreementAccepted: {
      type: 'boolean',
      defaultsTo: false
    },
    // Below is all specification for relations to another models

    // Passport configurations
    passports: {
      collection: 'Passport',
      via: 'user'
    },
    // Login objects that are attached to user
    logins: {
      collection: 'UserLogin',
      via: 'user'
    },
    requestLogs: {
      collection: 'RequestLog',
      via: 'user'
    },
    listings: {
      collection: 'Listing',
      via: 'user'
    },
    userAddress: {
      model: 'address'
    },
    userPaymentMethod: {
      model: 'payments'
    },
    userMerchant: {
      model: 'merchant'
    }
  }
});
