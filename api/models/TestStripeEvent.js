'use strict';

var _ = require('lodash');

/**
 * AboutUs.js
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
    eventId: {
      type: 'string',
      required: true
    },
    type: {
      type: 'string',
      required: false
    },
    livemode: {
      type: 'string',
      required: false
    },
  }
});