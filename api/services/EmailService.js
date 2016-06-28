(function() {
    'use strict';
    /**
     * Email Service
     *
     * @description :: Server-side logic for managing emails through Sendinblue.com
     * @help        :: See https://github.com/mailin-api/mailin-api-node-js
     */
    require('../Mailin/mailin.js');
    var client = new Mailin("https://api.sendinblue.com/v2.0", sails.config.sendinblue.apikey);


    /**
     *  Send email's to the given user with the given template name and template variables
     *  This is a private method to force to create a wrapper for sending templates that is handled by this module
     * @example:
     *      sails.services['emailservice'].sendWelcomeEmail('jordanxxxmmmxxxx@gmail.com', 'Jordan');
     * @param  {String} data           Data for transactional template using Mailin API
     * @return
     */
    var sendTransactionalEmail = function(data) {
        client.send_transactional_template(data).on('complete', function(data) {
            if(data.code === 'failure') {
                sails.log.error('sendTransactionalEmail, failure code');
                sails.log.error(new Error(data));
            }
            sails.log.verbose('Completed transactional email ');
        });

    };


    /**
     *  Send email's from one user to another with a plain text email.  Not used for template emails!
     * @example:
     *      sails.services['emailservice'].plainTextEmail('jordanxxxmmmxxxx@gmail.com', 'Jordan');
     * @param  {String} to              Destination Email address
     * @param  {String} toName          Receiver's Full Name
     * @param  {String} emailSubject    Email subject line
     * @param  {String} emailBody       Email body (message sent)
     * @param  {String} from            Sender's Email address
     * @param  {String} fromName        Sender's Full Name
     * @param  {Callback} cb            Callback results
     * @return
     */
    module.exports.plainTextEmail = function(to, toName, emailSubject, emailBody, from, fromName, cb ) {
        var data = {
        "from" : [from, fromName],
        "subject" : emailSubject,
        "html" : emailBody
        }
        data['to'] = {};
        data['to'][to] = toName;
        client.send_email(data).on('complete', function(data) {
            var dataParse = JSON.parse(data);
            if(dataParse.code === "success") {
                cb(null, 200);
            } else {
                cb(dataParse.message);
            }

        });
    }   


    /**
     *  Send welcome to Selbi email to the new user
     * @example:
     *      sails.services['emailservice'].sendWelcomeEmail('xxxxx@gmail.com', 'Bill', 'Bucks');
     * @param  {String} toEmail           Destination Email address
     * @param  {String} toFirst      First Name of new user
     * @param  {String} toLast       Last Name of new user
     * @return
     */
    module.exports.sendWelcomeEmail = function(toEmail, toFirst, toLast) {
        var data = { "id" : 1,
          "to" : sails.config.environment === 'production' ? toEmail : sails.config.sendinblue.toEmail,
          "attr" : {"FIRSTNAME":toFirst,"LASTNAME":toLast}
        }
        sendTransactionalEmail(data);
    };



    /**
     *  Send sold email to the seller
     * @example:
     *      sails.services['emailservice'].sendSoldEmail(listingData, buyerData);
     * @param  {Object} listingData      Object containing the information of the Item purchased and the seller
     * @param  {Object} buyerData        Object containing the information of the buyer
     * @return
     */
    module.exports.sendSoldEmail = function(listingData, buyerData) {

        var lineOneAddress = buyerData.userAddress.address2 ? buyerData.userAddress.address + ' ' + buyerData.userAddress.address2 : buyerData.userAddress.address;
        var lineTwoAddress = buyerData.userAddress.city + ' ' + buyerData.userAddress.state + ' ' + buyerData.userAddress.zip;

        var data = { 
            "id" : 4,
            "to" : sails.config.environment === 'production' ? listingData.user.email : sails.config.sendinblue.toEmail,
            "attr" : {
                    "FIRSTNAME": buyerData.firstName,
                    "LASTNAME": buyerData.lastName,
                    "ADDRESSONE": lineOneAddress,
                    "ADDRESSTWO": lineTwoAddress,
                    "EMAIL": buyerData.email,
                    "PRICE": (listingData.price).formatMoney(2),
                    "TITLE": listingData.title,
                    "REFNUM": listingData.id,
                    }
        }
        sendTransactionalEmail(data);
    };


    /**
     *  Send purchased email to the buyer
     * @example:
     *      sails.services['emailservice'].sendPurchaseEmail(buyerData, listingData);
     * @param  {Object} buyerData        Object containing the information of the buyer
     * @param  {Object} listingData      Object containing the information of the Item purchased and the seller
     * @return
     */
    module.exports.sendPurchaseEmail = function(buyerData, listingData) {
        var data = { 
            "id" : 3,
            "to" : sails.config.environment === 'production' ? buyerData.email : sails.config.sendinblue.toEmail,
            "attr" : {
                    "FIRSTNAME": listingData.user.firstName,
                    "LASTNAME": listingData.user.lastName,
                    "EMAIL": listingData.user.email,
                    "PRICE": listingData.price.formatMoney(2),
                    "TITLE": listingData.title,
                    "REFNUM": listingData.id,
                    }
        }
        sendTransactionalEmail(data);
    };


    /**
     *  Send reset password email to the user
     * @example:
     *      sails.services['emailservice'].resetPasswordEmail('xxxxx@gmail.com', 'Bill', 'Bucks', '222 main street, USA', 'buyerx@some.domain');
     * @param  {String} to           Destination Email address
     * @param  {String} reflink      reference link to change password with token included
     * @return
     */
    module.exports.resetPasswordEmail = function(to, reflink) {
        var data = { 
            "id" : 2,
            "to" : to,
            "attr" : {
                    "REFLINK": reflink
                    }
        }

        sendTransactionalEmail(data);
    };

})();;