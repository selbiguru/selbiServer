'use strict';

var _ = require('lodash');

/**
 * ImageController
 *
 * @description :: Server-side logic for managing Images
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {
	
	getListingSignature: function(request, response){
		var referenceId = request.param('referenceId');
		return response.json(200, sails.services['imageservice'].getListingSignature(referenceId, request.token));
	},
	deleteCloudinaryImages: function(request, response){
		sails.services['imageservice'].deleteCloudinaryImageService(request.body['images'], function(err, deleteSignature) {
			if(err) {
				sails.log.error('deleteCloudinaryImages');
                sails.log.error(new Error(err));
				return response.json(500, err)
			}
			return response.json(deleteSignature);
		});
	}
});

