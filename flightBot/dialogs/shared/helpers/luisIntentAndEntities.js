// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Possible LUIS entities. You can refer to dialogs\dispatcher\resources\entities.lu for list of entities
const LUIS_ENTITIES_LIST = ['personName', 'ticket_class', 'geographyV2_city', 'confirmationList'];

const LUIS_ENTITIES = {
    personName: 'personName',
    // user_last_name: 'user_last_name',
    ticket_class: 'ticket_class',
    city_from: 'geographyV2_city',
    city_to: 'geographyV2_city',
    // city_to: 'city_to',
    user_name_patternAny: 'userName_patternAny',
    confirmationList: 'confirmationList'
};
// List of all intents this bot will recognize. THis includes intents from the following LUIS models:
//  1. Main dispatcher - see dialogs\dispatcher\resources\cafeDispatchModel.lu
//  2. getUserProfile model - see dialogs\whoAreYou\resources\getUserProfile.lu
//  3. cafeBookTableTurnN model - see dialogs\bookTable\resources\turn-N.lu
const LUIS_INTENTS = {
    Admin: 'Admin',
    Help: 'Help',
    TicketBuy: 'TicketBuy',
    TicketList: 'TicketList'
};
module.exports.LUIS_ENTITIES_LIST = LUIS_ENTITIES_LIST;
module.exports.LUIS_INTENTS = LUIS_INTENTS;
module.exports.LUIS_ENTITIES = LUIS_ENTITIES;
