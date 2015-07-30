(function(){
	'use strict';

	var cloudinary = require('cloudinary'),
		cloudinaryUrl = require('cloudinary-url'),
		uuid = require('node-uuid');

	cloudinary.config(sails.config.cloudinary);

	module.exports.getListingSignature = function(listingId, userId){
		var urlGenerator = new cloudinaryUrl(sails.config.cloudinary.api_key, sails.config.cloudinary.api_secret, 'selbi'),
		cloudinaryData = urlGenerator.sign({
			public_id: userId + "/" + listingId + "/listing_" + uuid.v1()
		});
		return cloudinaryData;
	};

})();