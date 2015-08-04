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
		var referenceId = request.param('referenceId');
		return response.json(200, sails.services['image'].getListingSignature(referenceId, request.token));
	}
});

