'use strict';

var _ = require('lodash');

/**
 * Notification.js
 *
 * @description :: This is a model of a notification and it uses the base model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
module.exports = _.merge(_.cloneDeep(require('../base/Model')), {
  attributes: {
    id:{
      type: 'string',
      unique: true,
      primaryKey: true
    },
    userTo: {
      type: 'string',
      required: true
    },
    userFrom: {
      type: 'string',
      required: true
    },
    type: {
        type: 'string',
        enum: ['default', 'sold', 'friendrequest'],
        defaultsTo: 'default'
    }
  }
});