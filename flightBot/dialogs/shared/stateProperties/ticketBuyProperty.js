// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const {MessageFactory} = require('botbuilder');
const {TicketBuyOutcome, TicketBuyResult, ticketBuyStatus} = require('./createTicketBuyPropertyResult');
const {LUIS_ENTITIES} = require('../helpers');

// Consts for LUIS entities.
const PERSON_NAME_ENTITY = LUIS_ENTITIES.personName;
// const USER_LAST_NAME_ENTITY = LUIS_ENTITIES.user_last_name;
const TICKET_CLASS_ENTITY = LUIS_ENTITIES.ticket_class;
const CITY_FROM_ENTITY = LUIS_ENTITIES.city_from;
const CITY_TO_ENTITY = LUIS_ENTITIES.city_to;
const USER_NAME_PATTERN_ANY_ENTITY = LUIS_ENTITIES.user_name_patternAny;
const CONFIRMATION_ENTITY = LUIS_ENTITIES.confirmationList;

const UserNameMinLength = 4;
const CityMinLength = 4;


/**
 * Reservation property class.
 * - This is a self contained class that exposes a bunch of public methods to
 *   evaluate if we have a complete instance (all required properties filled in)
 * - Generate reply text
 *     - based on missing properties
 *     - with all information that's already been captured
 *     - to confirm reservation
 *     - to provide contextual help
 * - Also exposes two static methods to construct a reservations object based on
 *     - LUIS results object
 *     - arbitrary object
 */
class TicketBuyProperty {
  /**
   * Reservation Property constructor.
   *
   * @param {String} id reservation id
   * @param {String} date reservation date
   * @param {String} time reservation time
   * @param {Number} partySize number of guests in reservation
   * @param {String} location reservation location
   */
  constructor(id, personName, ticketClass, cityFrom, cityTo, ticketBuyConfirmed, needsChange, metaData) {
    this.id = id || getGuid();
    this.personName = personName || '';
    // this.userLastName = userLastName || '';
    this.ticketClass = ticketClass || '';
    this.cityFrom = cityFrom || '';
    this.cityTo = cityTo || '';
    
    this.ticketBuyConfirmed = ticketBuyConfirmed || false;
    this.needsChange = needsChange || undefined;
    this.metaData = metaData || {};
  }
  
  /**
   * Helper method to evaluate if we have all required properties filled.
   *
   * @returns {Boolean} true if we have a complete reservation property
   */
  get haveCompleteTicketBuy() {
    return ((this.id !== undefined) &&
      (this.personName !== '') &&
      // (this.userLastName !== '') &&
      (this.ticketClass !== '') &&
      (this.cityTo !== '') &&
      (this.cityFrom !== ''));
  }
  
  /**
   * Helper method to update Reservation property with information passed in via the onTurnProperty object
   *
   * @param {OnTurnProperty}
   * @returns {ReservationResult}
   */
  updateProperties(onTurnProperty) {
    let returnResult = new TicketBuyResult(this);
    return validate(onTurnProperty, returnResult);
  }
  
  /**
   * Helper method for Language Generation read out based on current reservation property object
   *
   * @returns {String}
   */
  getMissingPropertyReadOut() {
    if (this.personName === '') {
      return `Enter Your Full Name?`;
    } else if (this.ticketClass === '') {
      return 'Enter desired Ticket Class <First/Second>?';
    } else if (this.cityFrom === '') {
      return `City From?`;
    } else if (this.cityTo === '') {
      return `City To?`;
    } else return '';
  }
  
  /**
   * Helper method for Language Generation read out based on properties that have been captured
   *
   * @returns {String}
   */
  getGroundedPropertiesReadOut() {
    
    if (this.haveCompleteTicketBuy) return this.confirmationReadOut();
    let groundedProperties = '';
    if (this.ticketClass !== '') groundedProperties += ` ${ this.ticketClass } class ticket`;
    if (this.personName !== '') groundedProperties += ` for ${ this.personName }`;
    // if (this.userLastName !== '') groundedProperties += ` ${ this.userLastName }`;
    if (this.cityFrom !== '') groundedProperties += ` from ${ this.cityFrom }`;
    if (this.cityTo !== '') groundedProperties += ` to ${ this.cityTo }`;
    
    if (groundedProperties === '') return groundedProperties;
    return ``;
  }
  
  /**
   * Helper to generate confirmation read out string.
   *
   * @returns {String}
   */
  confirmationReadOut() {
    
    return '' + this.ticketClass + ' class ticket for ' + this.personName + ' from ' + this.cityFrom + ' to ' + this.cityTo + '.';
  }
  
  /**
   * Helper to generate help read out string.
   *
   * @returns {String}
   */
  helpReadOut() {
    if (this.ticketClass === '') {
      return `You can buy First or Second class tickets.`;
    } else return '';
  }
}

module.exports = TicketBuyProperty;

/**
 * Static method to create a new instance of Reservation property based on onTurnProperty object
 *
 * @param {OnTurnProperty}
 * @returns {ReservationResult}
 */
TicketBuyProperty.fromOnTurnProperty = function (onTurnProperty) {
  let returnResult = new TicketBuyResult(new TicketBuyProperty());
  return validate(onTurnProperty, returnResult);
};

/**
 * Static method to create a new instance of Reservation property based on a JSON object
 *
 * @param {Object} obj
 * @returns {ReservationProperty}
 */
TicketBuyProperty.fromJSON = function (obj) {
  if (obj === undefined) return new TicketBuyProperty();
  const {id, personName, ticketClass, cityFrom, cityTo, ticketBuyConfirmed, needsChange} = obj;
  return new TicketBuyProperty(id, personName, ticketClass, cityFrom, cityTo, ticketBuyConfirmed, needsChange);
};

/**
 * HELPERS
 */
/**
 * Helper function to create a random GUID
 * @returns {string} GUID
 */
const getGuid = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0;
    var v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
/**
 * Helper function to validate input and return results based on validation constraints
 *
 * @param {Object} onTurnProperty
 * @param {ReservationResult} return result object
 */
const validate = function (onTurnProperty, returnResult) {
  if (onTurnProperty === undefined || onTurnProperty.entities.length === 0) return returnResult;
  
  // We only will pull number -> party size, datetimeV2 -> date and time, cafeLocation -> location.
  let personNameEntity = onTurnProperty.entities.find(item => item.entityName === PERSON_NAME_ENTITY);
  
  let ticketClassEntity = onTurnProperty.entities.find(item => item.entityName === TICKET_CLASS_ENTITY);
  let cityFromEntity = onTurnProperty.entities.find(item => item.entityName === CITY_FROM_ENTITY);
  let cityToEntity = onTurnProperty.entities.find(item => item.entityName === CITY_TO_ENTITY);
  // let locationEntity = onTurnProperty.entities.find(item => item.entityName === LOCATION_ENTITY);
  let confirmationEntity = onTurnProperty.entities.find(item => item.entityName === CONFIRMATION_ENTITY);
  
  if (personNameEntity !== undefined &&
    !(cityToEntity !== undefined && personNameEntity.entityValue[0] == cityToEntity.entityValue[0])
  
  ) {
    
    if (personNameEntity.entityValue[0].length < UserNameMinLength) {
      returnResult.outcome.push(new TicketBuyOutcome('Sorry. Name should be longer than 4 chars!', PERSON_NAME_ENTITY));
      returnResult.status = ticketBuyStatus.INCOMPLETE;
    } else {
      returnResult.newTicketBuy.personName = personNameEntity.entityValue[0];
    }
  }
  
  
  if (cityFromEntity !== undefined &&
    returnResult.newTicketBuy.personName != cityFromEntity.entityValue[0] &&
    !(returnResult.newTicketBuy.cityFrom !== '' && returnResult.newTicketBuy.cityTo === '' )
  ) {
  
    let correctCityFrom;
    // if (cityFromEntity.entityValue[1] !== undefined) {
    //   correctCityFrom = cityFromEntity.entityValue[1];
    // } else {
    //   correctCityFrom = cityFromEntity.entityValue[0];
    // }
  
    correctCityFrom = cityFromEntity.entityValue[0];
    
    
    if (correctCityFrom.length < CityMinLength) {
      returnResult.outcome.push(new TicketBuyOutcome('Sorry. City name should be longer than 4 chars!', CITY_FROM_ENTITY));
      returnResult.status = ticketBuyStatus.INCOMPLETE;
    } else {
      returnResult.newTicketBuy.cityFrom = correctCityFrom;
    }
  }
  
  
  if (cityToEntity !== undefined &&
    returnResult.newTicketBuy.personName != cityToEntity.entityValue[0] &&
    (returnResult.newTicketBuy.cityFrom != cityToEntity.entityValue[0] ||
      cityToEntity.entityValue[1] !== undefined
    )
  
  ) {
    
    let correctCityTo;
    if (cityToEntity.entityValue.length == 2 && cityToEntity.entityValue[1] !== undefined) {
      correctCityTo = cityToEntity.entityValue[1];
    } else {
      correctCityTo = cityToEntity.entityValue[0];
    }
    
    // correctCityTo = cityToEntity.entityValue[1];
    
    
    if (correctCityTo.length < CityMinLength) {
      returnResult.outcome.push(new TicketBuyOutcome('Sorry. City name should be longer than 4 chars!', CITY_TO_ENTITY));
      returnResult.status = ticketBuyStatus.INCOMPLETE;
    } else {
      returnResult.newTicketBuy.cityTo = correctCityTo;
    }
  }
  
  if (ticketClassEntity !== undefined) {
    
    if (ticketClassEntity.entityValue[0] != 'First' && ticketClassEntity.entityValue[0] != 'Second') {
      returnResult.outcome.push(new TicketBuyOutcome('Sorry. Unrecognised ticket class - you need to choose First or Second!', TICKET_CLASS_ENTITY));
      returnResult.status = ticketBuyStatus.INCOMPLETE;
    } else {
      returnResult.newTicketBuy.ticketClass = ticketClassEntity.entityValue[0];
    }
  }
  
  if (confirmationEntity !== undefined) {
    
    if (confirmationEntity.entityValue[0][0] == 'yes') {
      returnResult.newTicketBuy.ticketBuyConfirmed = true;
      returnResult.newTicketBuy.needsChange = undefined;
    } else {
      returnResult.newTicketBuy.needsChange = true;
      returnResult.newTicketBuy.ticketBuyConfirmed = undefined;
    }
  }
  
  
  return returnResult;
};
