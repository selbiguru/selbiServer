'use strict';

/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `config/404.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#/documentation/concepts/Routes/RouteTargetSyntax.html
 */
module.exports.routes = {
  // See https://github.com/balderdashy/sails/issues/2062
  'OPTIONS /*': function(req, res) {
    res.send(200);
  },

  // Health Route
  'GET /': 'HelpController.showStatus',

  // Authentication routes
  '/logout': 'AuthController.logout',
  'POST /login': 'AuthController.callback',
  'POST /register': 'UserController.signUp',
  'POST /login/:action': 'AuthController.callback',
  'POST /auth/local': 'AuthController.callback',
  'POST /auth/local/:action': 'AuthController.callback',

  // Image routes
  'GET /image/sign/:referenceId': 'ImageController.getListingSignature',
  'DELETE /image/deleteimage': 'ImageController.deleteCloudinaryImages',

  //Listing routes
  'POST /userlistings/create': 'ListingController.createListing',
  'PUT /userlistings/update/:id': 'ListingController.updateListing',
  'PUT /userlistings/:userId': 'ListingController.getUserListings',
  'PUT /userlistings/archive/:id': 'ListingController.archiveListing',
  'PUT /userlistings/userName/:username': 'ListingController.getUsernameListings',
  'GET /userlistings/listing/:userId/:id': 'ListingController.getListing',
  'PUT /userlistings/friendlistings/:userId': 'ListingController.getFriendsListings',
  'PUT /userlistings/selbilistings/:userId': 'ListingController.getSelbiListings',
  'DELETE /userlistings/delete/:id': 'ListingController.deleteListing',

  //Get User
  'GET /userData/:userId': 'UserController.getUserData',
  'GET /userData/userName/:username': 'UserController.getUserByUsername',
  'PUT /userData/:userId': 'UserController.updateUserData',
  'POST /userData/uniqueUsername': 'UserController.uniqueUsername',
  'POST /user/byphone/:userId': 'UserController.getUsersByPhones',
  'POST /userData/uniquePhone': 'UserController.uniquePhones',
  'PUT /userData/forgot/password': 'UserController.forgotPassword',
  'POST /userData/reset/password/:token': 'UserController.resetPassword',
  'GET /userData/reset/validate/:token': 'UserController.validateLinkPassword',

  //braintree payments routes
  'GET /payments/getClientToken': 'PaymentsController.getClientToken',
  'GET /payments/getMerchantAccount/:merchantAccountId': 'PaymentsController.getMerchantAccount',
  'GET /payments/findCustomer/:userId': 'PaymentsController.findCustomer',
  'GET /payments/:userId': 'PaymentsController.getPayments',
  'DELETE /payments/paymentMethod/:userId': 'PaymentsController.deletePaymentMethod',
  'DELETE /payments/merchant/:userId': 'PaymentsController.deleteMerchant',
  'POST /payments/createSubMerchantAccount/:userId': 'PaymentsController.createSubMerchantAccount',
  'POST /payments/createCustomerAndPaymentMethod': 'PaymentsController.createCustomerAndPaymentMethod',
  'POST /payments/createOrder': 'PaymentsController.createOrder',

  //Twilio routes
  'POST /twilio/sendValidationMessage': 'TwilioController.sendValidationMessage',

  //Sendinblue Email
  'POST /email/contactSelbi': 'EmailController.contactSelbi',
  'POST /email/welcomeSelbi': 'EmailController.sendWelcome',

  //Friend
  'POST /friend/request': 'InvitationController.sendFriendInvitation',
  'POST /friends/phonenumber/:userId': 'FriendController.addFriendsByPhone',
  'PUT /friend/request/:invitationId': 'InvitationController.updateFriendInvitation',
  'PUT /friend/friendinvitation': 'InvitationController.updateFriendInvitationByUserIds',
  'GET /friend/:userId/:friendId': 'InvitationController.getInvitationByUserIds',
  'GET /friend/username/:userId/:username': 'InvitationController.getInvitationByUsername',
  'GET /friends/:userId': 'FriendController.getFriendsByUser',
  'GET /friends/allinvites/:userId': 'FriendController.getAllFriendsByUser',

  //FAQ routes

  //AboutUs routes

  //Notification
  'POST /notification/create': 'NotificationController.createNotification',
  //'PUT /notification/update/:notificationId': 'NotificationController.updateNotificationById',
  //'PUT /notification/update/userids': 'NotificationController.updateNotificationByUsers',
  'DELETE /notification/delete/:notificationId': 'NotificationController.deleteNotification',
  'GET /notification/count/:userId': 'NotificationController.countNotifications',
  'GET /notification/userid/:userId': 'NotificationController.getNotificationByUserId',
  'GET /notification/notificationid/:notificationId': 'NotificationController.getByNotificationId',

};
