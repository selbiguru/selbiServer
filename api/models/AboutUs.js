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
      type: 'string',
      unique: true,
      primaryKey: true
    },
    aboutus: {
      type: 'string',
      required: true
    }
  }
});