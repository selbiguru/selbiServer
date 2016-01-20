(function() {
    'use strict';
    /**
     * Email Service
     *
     * @description :: Server-side logic for managing emails through Mandrill
     * @help        :: See http://node-machine.org/machinepack-mandrill
     */
    var Mandrill = require('machinepack-mandrill'),
        self = this;


    /**
     *  Send email's to the given user with the given template name and template variables
     *  This is a private method to force to create a wrapper for sending templates that is handled by this module
     * @example:
     *      sails.services['emailservice'].sendWelcomeEmail('tmjam.ahmed@gmail.com', 'Tauseef');
     * @param  {String} to           Destination Email address
     * @param  {String} templateName Template Name (stored on the provider)
     * @param  {Array}  variables    Array of template variables and its contents
     * @return
     */
    var sendEmail = function(to, templateName, variables) {
        Mandrill.sendTemplateEmail({
            apiKey: sails.config.mandrill.apikey,
            toEmail: to,
            templateName: templateName,
            mergeVars: variables,
        }).exec({
            // An unexpected error occurred.
            error: function(err) {
                console.log("errors", err);
            },
            // OK.
            success: function() {
                console.log("success", arguments);
            }
        });
    };


    /**
     *  Send email's from one user to another with a plain text email.  Not used for template emails!
     * @example:
     *      sails.services['emailservice'].sendContactSelbiEmail('tmjam.ahmed@gmail.com', 'Tauseef');
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
        Mandrill.sendPlaintextEmail({
            apiKey: sails.config.mandrill.apikey,
            toEmail: to,
            toName: toName,
            subject: emailSubject,
            message: emailBody,
            fromEmail: from,
            fromName: fromName,
        }).exec({
            // An unexpected error occurred.
            error: function(err) {
                cb(err);
            },
            // OK.
            success: function() {
                cb(null, 200);
            }
        });
    }   


    /**
     *  Send welcome to Selbi email to the new user
     * @example:
     *      sails.services['emailservice'].sendWelcomeEmail('xxxxx@gmail.com', 'Bill', 'Bucks');
     * @param  {String} to           Destination Email address
     * @param  {String} toFirst      First Name of new user
     * @param  {String} toLast       Last Name of new user
     * @return
     */
    module.exports.sendWelcomeEmail = function(to, toFirst, toLast) {

        var templateVariables = [{
            name: "FIRSTNAME",
            content: toFirst
        },
        {   name: "LASTNAME",
            content: toLast
        }]

        sendEmail(to, 'welcome-1', templateVariables);
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

        var lineOneAddress = buyerData.userAddress.address2 ? buyerData.userAddress.address + ' #' + buyerData.userAddress.address2 : buyerData.userAddress.address;
        var lineTwoAddress = buyerData.userAddress.city + ', ' + buyerData.userAddress.state + ' ' + buyerData.userAddress.zip;

        var templateVariables = [
            {   name: "LASTNAME",
                content: buyerData.lastName
            },
            {   name: "ADDRESSONE",
                content: lineOneAddress
            },
            {   name: "ADDRESSTWO",
                content: lineTwoAddress
            },
            {   name: "EMAIL",
                content: buyerData.email
            },
            {   name: "FIRSTNAME",
                content: buyerData.firstName
            },
            {   name: "PRICE",
                content: listingData.price
            },
            {   name: "TITLE",
                content: listingData.title
            },
            {   name: "REFNUM",
                content: listingData.id
            },
        ]

        sendEmail(listingData.user.email, 'item-sold', templateVariables);
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

        var templateVariables = [
            {   name: "LASTNAME",
                content: listingData.user.lastName
            },
            {   name: "EMAIL",
                content: listingData.user.email
            },
            {   name: "FIRSTNAME",
                content: listingData.user.firstName
            },
            {   name: "PRICE",
                content: listingData.price
            },
            {   name: "TITLE",
                content: listingData.Title
            },
            {   name: "REFNUM",
                content: listingData.id
            },
        ]

        sendEmail(buyerData.email, 'item-bought', templateVariables);
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

        var templateVariables = [
            {
                name: "REFLINK",
                content: reflink
            },
        ]

        sendEmail(to, 'forgot-password', templateVariables);
    };

})();;