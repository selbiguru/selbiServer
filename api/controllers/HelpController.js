'use strict';

var _ = require('lodash');

/**
 * HelpController
 *
 * @description :: Server-side logic for managing Images
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {
	
	showStatus: function(req, response){
		return response.json(200, { status: "OK"});
	}
});

