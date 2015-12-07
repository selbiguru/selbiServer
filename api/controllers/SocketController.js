'use strict';

var _ = require('lodash');
var async = require('async');

/**
 * SocketController
 *
 * @description :: Server-side logic for managing Sockets
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
module.exports = _.merge(_.cloneDeep(require('../base/Controller')), {
	socketNotifications: function(req, res) {
        if (!req.isSocket) {
            return res.json(400, 'Trouble connecting to Sockets');
        }
		sails.services['notificationservice'].getNotificationByUserIdService( req.params['userTo'], function(err, getNotificationResponse){
            if(err)
                return res.json(500, err);
            sails.models['notification'].subscribe(req, _.pluck(getNotificationResponse, 'userTo'));
            return res.json();
        });
	},
});