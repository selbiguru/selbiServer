'use strict';

var _ = require('lodash');

/**
 * listing.js
 *
 * @description :: This is a model of a listing and it uses the base model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
module.exports = _.merge(_.cloneDeep(require('../base/Model')), {
  attributes: {
    // title of the listing
    id: {
      type: 'string',
      unique: true,
      primaryKey: true,
      index: true
    },
    // title of the listing
    title: {
      type: 'string',
      required: true
    },
    // Listing description
    //TODO: need a size limit ?? 
    description: {
      type: 'text',
      required: true
    },
    price: {
      type: 'float',
      required: true
    },
    //Pass an array of imageUrls
    imageUrls: {
      type: 'array',
      required: false
    },
    //This is the userid of the seller who creates the listing
    userId: {
      type: 'string',
      required: true
    },
    //listing is the owner of this one to many relationship * see http://sailsjs.org/#!/documentation/concepts/ORM/Associations/OnetoMany.html *
    bids: {
      collection: 'bid',
      via: 'owner'
    },
    isPublished: {
      type: 'boolean',
      required: true,
      defaultsTo: false
    },
    isPreview: {
      type: 'boolean',
      required: true,
      defaultsTo: false
    },
    user: {
      model: 'user',
      columnName: 'userId'
    }
  }
});