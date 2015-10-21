'use strict';
/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */
module.exports = {
    /***************************************************************************
     * Set the default database connection for models in the development       *
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
        "masterMerchantAccountId": "selbi",
        "fundingDescriptor": "Selbi Sale",
        "serviceFeePercent": "10"
    },
    twilio: {
        "accountSid" : "AC21c328a896543f751d70f26702e77a7c",
        "authToken" : "5e7ca65f34e2d19100cb01cf9b2fd67d",
        "twilioPhoneNumber": "+13477673524"
    }
};