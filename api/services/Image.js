(function() {
    'use strict';

    var cloudinary = require('cloudinary'),
        cloudinaryUrl = require('cloudinary-url'),
        uuid = require('node-uuid');

    cloudinary.config(sails.config.cloudinary);

    module.exports.getListingSignature = function(referenceId, userId) {
    	var urlGenerator = new cloudinaryUrl(sails.config.cloudinary.api_key, sails.config.cloudinary.api_secret, 'selbi');

        var initPath = (referenceId == 0) ? userId + "/" + uuid.v1() : userId + "/" + referenceId + "/" + uuid.v1();
        var cloudinaryData = urlGenerator.sign({
	            public_id: initPath
	        });
        return cloudinaryData;
    };

})();