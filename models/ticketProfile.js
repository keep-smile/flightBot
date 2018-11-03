// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Simple user profile class.
 */
class TicketProfile {
    constructor( ticketState ) {
        
        this.personName = ticketState.personName || '';
        this.ticketClass = ticketState.ticketClass[0] || '';
        this.cityFrom = ticketState.cityFrom || '';
        this.cityTo = ticketState.cityTo || '';
        this.ticketBuyConfirmed = ticketState.ticketBuyConfirmed || '';
        
        
        // this.ticketClass = ticketClass || undefined;
    }
};

exports.TicketProfile = TicketProfile;
