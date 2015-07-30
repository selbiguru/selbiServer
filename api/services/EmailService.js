(function() {
    'use strict';

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
    }    
    
    module.exports.sendWelcomeEmail = function(to, toName) {

        var templateVariables = [{
            name: "USERNAME",
            content: toName
        }]

        sendEmail(to, 'welcome', templateVariables);
    };

})();;