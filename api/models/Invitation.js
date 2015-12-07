'use strict';

var _ = require('lodash');

/**
 * Invitaion.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
module.exports = _.merge(_.cloneDeep(require('../base/Model')), {
  attributes: {
    id:{
      type: 'integer',
      unique: true,
      primaryKey: true
    },
    userFrom: {
      type: 'string',
      unique: false
    },
    userTo: {
      type: 'string',
      unique: false
    },
    status: {
        type: 'string',
        enum: ['pending', 'approved', 'denied'],
        defaultsTo: 'approved'
    }
  }
});
