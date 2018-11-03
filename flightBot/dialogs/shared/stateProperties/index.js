// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

module.exports = {
  EntityProperty: require('./entityProperty'),
  OnTurnProperty: require('./onTurnProperty'),
  UserProfile: require('./ticketProfile'),
  TicketBuyProperty: require('./ticketBuyProperty'),
  // ReservationResult: require('./createReservationPropertyResult').ReservationResult,
  // ReservationOutcome: require('./createReservationPropertyResult').ReservationOutcome,
  ticketBuyStatusEnum: require('./createTicketBuyPropertyResult').ticketBuyStatus,
  
  
  TicketBuyResult: require('./createTicketBuyPropertyResult').TicketBuyResult,
  TicketBuyOutcome: require('./createTicketBuyPropertyResult').TicketBuyOutcome
  
  
};
