// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * Simple user profile class.
 */
class TicketProfile {
    constructor(fName, lName, cityFrom, cityTo, ticketClass ) {
        this.fName = fName || undefined;
        this.cityFrom = cityFrom || undefined;
        this.cityTo = cityTo || undefined;
        this.ticketClass = ticketClass || undefined;
    }
};

exports.TicketProfile = TicketProfile;
