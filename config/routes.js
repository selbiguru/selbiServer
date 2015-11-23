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

  //Listing routes
  'GET /userlistings/:userId': 'ListingController.getUserListings',
  'GET /userlistings/userName/:username': 'ListingController.getUsernameListings',

  //Get User
  'GET /userData/:userId': 'UserController.getUserData',
  'GET /userData/userName/:username': 'UserController.getUserByUsername',
  'PUT /userData/:userId': 'UserController.updateUserData',
  'POST /userData/uniqueUsername': 'UserController.uniqueUsername',
  'POST /user/byphone': 'UserController.getUsersByPhones',
  'POST /userData/uniquePhone': 'UserController.uniquePhones',

  //braintree payments routes
  'GET /payments/getClientToken': 'PaymentsController.getClientToken',
  'POST /payments/createCustomerAndPaymentMethod': 'PaymentsController.createCustomerAndPaymentMethod',
  'GET /payments/findCustomer/:userId': 'PaymentsController.findCustomer',
  'GET /payments/:userId': 'PaymentsController.getPayments',
  'DELETE /payments/paymentMethod/:userId': 'PaymentsController.deletePaymentMethod',
  'DELETE /payments/merchant/:userId': 'PaymentsController.deleteMerchant',
  'POST /payments/createSubMerchantAccount/:userId': 'PaymentsController.createSubMerchantAccount',
  'GET /payments/getMerchantAccount/:merchantAccountId': 'PaymentsController.getMerchantAccount',
  'POST /payments/createOrder': 'PaymentsController.createOrder',

  //Twilio routes
  'POST /twilio/sendValidationMessage': 'TwilioController.sendValidationMessage',

  //Mandrill Email
  'POST /email/contactSelbi': 'EmailController.contactSelbi',

  //Friend
  'POST /friend/request': 'InvitationController.sendFriendInvitation',
  'PUT /friend/request/:invitationId/:status': 'InvitationController.updateFriendInvitation',
  'GET /friend/:userId/:friendId': 'InvitationController.getInvitationByUserIds',
  'GET /friend/username/:userId/:username': 'InvitationController.getInvitationByUsername',
  'GET /friends/:userId': 'FriendController.getFriendsByUser',

  //FAQ routes

  //AboutUs routes

};
