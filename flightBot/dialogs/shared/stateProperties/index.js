// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

module.exports = {
  EntityProperty: require('./entityProperty'),
  OnTurnProperty: require('./onTurnProperty'),
  
  TicketBuyProperty: require('./ticketBuyProperty'),
  ticketBuyStatusEnum: require('./createTicketBuyPropertyResult').ticketBuyStatus,
  TicketBuyResult: require('./createTicketBuyPropertyResult').TicketBuyResult,
  TicketBuyOutcome: require('./createTicketBuyPropertyResult').TicketBuyOutcome
  
  
};
