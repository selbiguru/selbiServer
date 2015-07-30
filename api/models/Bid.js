'use strict';

var _ = require('lodash');

/**
 * Bid.js
 *
 * @description :: This is a model of a listing and it uses the base model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
module.exports = _.merge(_.cloneDeep(require('../base/Model')), {
  attributes: {
    // title of the listing
    id: {
      type: 'integer',
      required: true,
      primaryKey: true
    },
    BidPrice: {
      type: 'float',
      required: 'true'
    },
    //This is the userid of the seller who creates the listing
    bidUserId: {
      type: 'string',
      required: 'true'
    },
    //listing is the owner of this one to many relationship * see http://sailsjs.org/#!/documentation/concepts/ORM/Associations/OnetoMany.html *
    owner: {
      model: 'listing'
    },
    listingId: {
      type: 'integer',
      required: true,
    },
    //the price that the bidder was trying to beat
    priceToBeat: {
      type: 'float',
      required: 'true'
    },
    bidState: {
      type: 'string',
      enum: ['won', 'lost', 'canceled', 'deleted']
    }
  }
});
