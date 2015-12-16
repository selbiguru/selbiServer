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
                console.log(err);
            },
            // OK.
            success: function() {
                console.log(arguments);
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
            name: "USERNAME",
            content: toFirst
        },
        {   name: "LASTNAME",
            content: toLast
        }]

        sendEmail(to, 'welcome', templateVariables);
    };



    /**
     *  Send sold email to the seller
     * @example:
     *      sails.services['emailservice'].sendSoldEmail('xxxxx@gmail.com', 'Bill', 'Bucks', '222 main street, USA', 'buyerx@some.domain');
     * @param  {String} to           Destination Email address
     * @param  {String} toFirst      First Name of the buyer
     * @param  {String} toLast       Last Name of the buyer
     * @param  {String} address      Address of the buyer
     * @param  {String} email        Email of buyer
     * @param  {String} email        Item purchased by the buyer
     * @return
     */
    module.exports.sendSoldEmail = function(to, toName, last, address, email, item) {

        var templateVariables = [{
            name: "USERNAME",
            content: toName
        },
        {   name: "LASTNAME",
            content: last
        },
        {   name: "address",
            content: address
        },
        {   name: "email",
            content: email
        },
        {   name: "item",
            content: item
        },
        ]

        sendEmail(to, 'sold', templateVariables);
    };


    /**
     *  Send purchased email to the buyer
     * @example:
     *      sails.services['emailservice'].sendPurchaseEmail('xxxxx@gmail.com', 'Bill', 'Bucks', '222 main street, USA', 'buyerx@some.domain');
     * @param  {String} to           Destination Email address
     * @param  {String} toFirst      First Name of the buyer
     * @param  {String} toLast       Last Name of the buyer
     * @param  {String} email        Email of seller
     * @param  {String} item         Item purchased from the seller
     * @return
     */
    module.exports.sendPurchaseEmail = function(to, toName, last, email, item) {

        var templateVariables = [{
            name: "USERNAME",
            content: toName
        },
        {   name: "LASTNAME",
            content: last
        },
        {   name: "email",
            content: email
        },
        ]

        sendEmail(to, 'purchase', templateVariables);
    };


    /**
     *  Send reset password email to the user
     * @example:
     *      sails.services['emailservice'].resetPasswordEmail('xxxxx@gmail.com', 'Bill', 'Bucks', '222 main street, USA', 'buyerx@some.domain');
     * @param  {String} to           Destination Email address
     * @param  {String} toFirst      First Name of the buyer
     * @param  {String} toLast       Last Name of the buyer
     * @param  {String} email        Email of seller
     * @param  {String} item         Item purchased from the seller
     * @return
     */
    module.exports.resetPasswordEmail = function(to, toName, last, email, item) {

        var templateVariables = [{
            name: "USERNAME",
            content: toName
        },
        {   name: "LASTNAME",
            content: last
        },
        {   name: "email",
            content: email
        },
        ]

        sendEmail(to, 'purchase', templateVariables);
    };

})();;