// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { Dialog } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder');
const { LUIS_INTENTS } = require('../shared/helpers');
// Require the adaptive card.
const adminLoginCard = require('./resources/adminLoginCard.json');

// This dialog's name. Also matches the name of the intent from ../dispatcher/resources/cafeDispatchModel.lu
const ADMIN_DIALOG = LUIS_INTENTS.Admin;

/**
 *
 * What can you do dialog.
 *   Sends the what can you do adaptive card to user.
 *   Includes a suggested actions of queries users can try. See ../shared/helpers/genSuggestedQueries.js
 *
 */
module.exports = {
    AdminDialog: class extends Dialog {
        static get Name() { return ADMIN_DIALOG; }
        constructor(botConfig, conversationState, userProfileAccessor, onTurnAccessor) {
            super(ADMIN_DIALOG);
        }
        /**
         * Override beginDialog.
         *
         * @param {DialogContext} dialog context
         * @param {Object} options
         */
        async beginDialog(dc, options) {
            await dc.context.sendActivity({ attachments: [CardFactory.adaptiveCard(adminLoginCard)] });
            // await dc.context.sendActivity(`Pick a query from the card or you can use the suggestions below.`);
            return await dc.endDialog();
        }
    }
};
