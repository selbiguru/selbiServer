(function() {
    'use strict';

    var cloudinary = require('cloudinary'),
        cloudinaryUrl = require('cloudinary-url'),
        uuid = require('node-uuid'),
        async = require('async');

    cloudinary.config(sails.config.cloudinary);

    module.exports.getListingSignature = function(referenceId, userId) {
    	var urlGenerator = new cloudinaryUrl(sails.config.cloudinary.api_key, sails.config.cloudinary.api_secret, 'selbi');

        var initPath = (referenceId == 0) ? userId + "/" + uuid.v1() : userId + "/" + referenceId + "/" + uuid.v1();
        var cloudinaryData = urlGenerator.sign({
	            public_id: initPath
	        });
        return cloudinaryData;
    };



    /**
     *  This is a public methods to retrive a signature from cloudinary
     *  @param      images is an array of strings of the public_ids of the images you want to delete from cloudindary
     *  @param      cb is a callback
     */
    module.exports.deleteCloudinaryImageService = function(images, cb) {
        var urlGenerator = new cloudinaryUrl(sails.config.cloudinary.api_key, sails.config.cloudinary.api_secret, 'selbi');
        var cloudinaryData = urlGenerator.sign({
                invalidate: true
            });
        async.eachLimit(images, 6, function(image, cbEach) {
            cloudinary.uploader.destroy(image, function(result) {
                if(result.error) {
                    return cbEach(500, result.error)
                } else {
                    return cbEach(null, result);
                }
            }, cloudinaryData.params);
        }, function(err, results) {
            if(err)
                return cb(500, err);
            return cb(null, 'success');
        });
    };

})();