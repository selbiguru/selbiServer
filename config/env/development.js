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
    sendinblue: {
        "apikey": "djac5b8nLq3W7ZNR",
        "fromEmail": "no-reply@selbi.io",
        "fromName": "Selbi Support",
        "toEmail": "testing@selbi.io"
    },
    stripe: {
        "publicKey" : "pk_test_pVgDzmnHbUaT9z8L7p5slTKB",
        "privateKey" : "sk_test_MtXKfDYlQdtIYHTunUaw8cu4",
        "serviceFeePercent": "15"
    },
    twilio: {
        "accountSid" : "AC21c328a896543f751d70f26702e77a7c",
        "authToken" : "5e7ca65f34e2d19100cb01cf9b2fd67d",
        "twilioPhoneNumber": "+16505673524"
    },
    mongodbServer: {
        "awsEC2" : "ec2-52-8-140-147.us-west-1.compute.amazonaws.com",
    },
    couchDBServer: {
        "awsEC2" : "ec2-52-7-210-171.compute-1.amazonaws.com",
    },
    resetPasswordRef: {
        "passwordRefLink" : "http://development-selbi-server.herokuapp.com/userData/reset/validate/",
    }
};