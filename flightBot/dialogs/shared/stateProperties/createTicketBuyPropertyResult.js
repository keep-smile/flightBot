// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

module.exports = {
  TicketBuyResult: class {
    /**
     * Constructor.
     *
     * @param {reservationProperty} reservationProperty
     * @param {Enum} status
     * @param {Object []} outcome {message:'', property:''}
     */
    constructor(property, status, outcome) {
      this.newTicketBuy = property || '';
      this.status = status || 0;
      this.outcome = outcome ? (Array.isArray(outcome) ? outcome : [outcome]) : [];
    }
  },
  ticketBuyStatus: {
    'SUCCESS': 0,
    'INCOMPLETE': 1
  },
  TicketBuyOutcome: class {
    /**
     * Constructor.
     *
     * @param {String} message
     * @param {String} entity name
     */
    constructor(message, entityName) {
      this.message = message || '';
      this.entityName = entityName || '';
    }
  }
};
