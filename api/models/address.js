'use strict';

var _ = require('lodash');

/**
 * address.js
 *
 * @description :: This is a model of the address of a user. A one to one relationship with User model that is the owner
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
module.exports = _.merge(_.cloneDeep(require('../base/Model')), {
  attributes: {
    id:{
      type: 'string',
      unique: true,
      primaryKey: true
    },
    streetAddress: {
      type: 'string',
      required: true
    },
    /* bldg/apt/block*/
    streetAddress2: {
      type: 'string',
      required: false
    },
    city: {
      type: 'string',
      required: true
    },
    state: {
      type: 'string',
      required: true
    },
    zip: {
      type: 'string',
      required: true
    },
    country: {
      type: 'string',
      required: true
    },
    owner: {
            model:'user'
    }
  }
});
