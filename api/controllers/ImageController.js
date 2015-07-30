'use strict';

var _ = require('lodash');

/**
 * ImageController
 *
 * @description :: Server-side logic for managing Images
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {
	
	getListingSignature: function getSignature(request, response){
	 	var listingId = request.param('listingId');
	  return response.json(200, sails.services['image'].getListingSignature(listingId, request.token));
	}
});

