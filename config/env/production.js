'use strict';
/**
 * Production environment settings
 *
 * This file can include shared settings for a production environment,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */
module.exports = {
  /***************************************************************************
   * Set the default database connection for models in the production        *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/

  // models: {
  //   connection: 'someMysqlServer'
  // },

  /***************************************************************************
   * Set the port in the production environment to 80                        *
   ***************************************************************************/

  // port: 80,

  /***************************************************************************
   * Set the log level in production environment to "silent"                 *
   ***************************************************************************/

  // log: {
  //   level: "silent"
  // }


  /***************************************************************************
   * Set the production database connection for models in production         *
   * environment (see config/connections.js and config/models.js )           *
  ***************************************************************************/
  cloudinary: {
        cloud_name: "selbi",
        api_key: "379521277533334",
        api_secret: "TLriaJe_kfUseLAKslsbR-s-3d0"
    },
    mandrill: {
        "apikey": "0Bii9cro9C34sjmr4cZzkw",
        "fromEmail": "no-reply@etruckingsolutions.com",
        "fromName": "Etrucking Software Solutions"
    },
    braintree: {
        "publicKey" : "nktzr995vy2sxwrx",
        "privateKey" : "a73c6cb5a55678883fe611403d9c4e40",
        "merchantId" : "zw67j4nst8r33wms",
        "masterMerchantAccountId": "selbi"
    },
    twilio: {
        "accountSid" : "AC366dfa684c5f7d782350d7a6bb6109e5",
        "authToken" : "75242e352b090236ecddefc37549c3a4",
        "twilioPhoneNumber": "+13477673524"
    }
};
