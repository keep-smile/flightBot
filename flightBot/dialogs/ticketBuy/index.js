// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const {MessageFactory} = require('botbuilder');

const {ComponentDialog, ConfirmPrompt, WaterfallDialog} = require('botbuilder-dialogs');
const GetTicketBuyFields = require('../shared/prompts/getTicketBuyFields').GetTicketBuyFields;
const {TicketBuyProperty} = require('../shared/stateProperties');

const {InterruptionDispatcher} = require('../dispatcher/interruptionDispatcher');
const TicketDB = require('models/ticket').TicketDB;


const {LUIS_INTENTS, GenSuggestedQueries} = require('../shared/helpers');

// This dialog's name. Matches the name of the LUIS intent from ../dispatcher/resources/cafeDispatchModel.lu
const TICKET_BUY_DIALOG = LUIS_INTENTS.TicketBuy;
const DIALOG_START = 'Ticket_buy_start';
const CONFIRM_CANCEL_PROMPT = 'confirmCancelPrompt';

const GET_TICKET_BUY_FIELDS_PROMPT = 'getTicketBuyFields';

/**
 * Class Who are you dialog.
 *
 *  Uses a waterfall dialog with a custom text prompt to get user's name and greet them.
 *  Has two water fall steps -
 *    1. Skips to water fall step #2 if we already have user's name or the main dispatcher picked up their name.
 *       Initiates the 'ask user name' prompt if we dont have their name yet
 *    2. Greets user with their name
 *
 * 'Ask user name' prompt is implemented as a custom text prompt. See ../shared/prompts/getUserNamePrompt.js
 *
 */
module.exports = {
  TicketBuyDialog: class extends ComponentDialog {
    /**
     * Constructor.
     *
     * @param {BotConfiguration} bot configuration
     * @param {ConversationState} conversationState
     * @param {StatePropertyAccessor} accessor for user profile property
     * @param {StatePropertyAccessor} accessor for on turn property
     * @param {StatePropertyAccessor} accessor for reservation property
     */
    constructor(botConfig, conversationState, userProfileAccessor, onTurnAccessor, ticketBuyAccessor) {
      super(TICKET_BUY_DIALOG);
      
      if (!botConfig) throw new Error('Missing parameter. Bot configuration is required.');
      if (!ticketBuyAccessor) throw new Error('Missing parameter. User profile property accessor is required.');
      if (!conversationState) throw new Error('Missing parameter. Conversation state is required.');
      
      // Keep accessors for the steps to consume.
      this.onTurnAccessor = onTurnAccessor;
      this.userProfileAccessor = userProfileAccessor;
      this.ticketBuyAccessor = ticketBuyAccessor;
      
      // Add water fall dialog with two steps.
      this.addDialog(new WaterfallDialog(DIALOG_START, [
        this.getAllRequiredProperties.bind(this),
        this.greetUser.bind(this)
      ]));
      
      
      // Get location, date, time & party size prompt.
      this.addDialog(new GetTicketBuyFields(GET_TICKET_BUY_FIELDS_PROMPT,
        botConfig,
        onTurnAccessor,
        userProfileAccessor,
        ticketBuyAccessor));
      
      // This dialog is interruptable. So add interruptionDispatcherDialog
      this.addDialog(new InterruptionDispatcher(onTurnAccessor, conversationState, userProfileAccessor, botConfig, ticketBuyAccessor));
      
      // When user decides to abandon this dialog, we need to confirm user action. Add confirmation prompt
      this.addDialog(new ConfirmPrompt(CONFIRM_CANCEL_PROMPT));
      
    }
    
    static get Name() {
      return TICKET_BUY_DIALOG;
    }
    
    async getAllRequiredProperties(stepContext) {
      // Get current reservation from accessor
      let ticketBuyStatus = await this.ticketBuyAccessor.get(stepContext.context);
      let newTicketBuy;
      
      if (ticketBuyStatus === undefined) {
        newTicketBuy = new TicketBuyProperty();
      } else {
        newTicketBuy = TicketBuyProperty.fromJSON(ticketBuyStatus);
      }
      // Get on turn (includes LUIS entities captured by parent)
      const onTurnProperty = await this.onTurnAccessor.get(stepContext.context);
      let ticketBuyResult;
      if (onTurnProperty !== undefined) {
        if (newTicketBuy !== undefined) {
          // update reservation object and gather results.
          ticketBuyResult = newTicketBuy.updateProperties(onTurnProperty);
        } else {
          ticketBuyResult = TicketBuyProperty.fromOnTurnProperty(onTurnProperty);
        }
      }
      // set reservation
      this.ticketBuyAccessor.set(stepContext.context, ticketBuyResult.newTicketBuy);
      
      let groundedProperties = ticketBuyResult.newTicketBuy.getGroundedPropertiesReadOut();
      if (groundedProperties !== '') await stepContext.context.sendActivity(groundedProperties);
      
      // see if update reservation resulted in errors, if so, report them to user.
      if (ticketBuyResult &&
        ticketBuyResult.status === ticketBuyResult.INCOMPLETE &&
        ticketBuyResult.outcome !== undefined &&
        ticketBuyResult.outcome.length !== 0) {
        // Start the prompt with the initial feedback based on update results.
        return await stepContext.prompt(GET, ticketBuyResult.outcome[0].message);
      } else {
        return await stepContext.prompt(GET_TICKET_BUY_FIELDS_PROMPT, ticketBuyResult.newTicketBuy.getMissingPropertyReadOut());
      }
    }
    
    
    async greetUser(step) {
      if (step.result) {
        const userProfile = await this.userProfileAccessor.get(step.context);
        await step.context.sendActivity(`You have succesfully bought ticket: `);
        
        let reservationFromState = await this.ticketBuyAccessor.get(step.context);
        
        let ticket = new TicketDB(reservationFromState).save();
        
        let newTicketBuy = TicketBuyProperty.fromJSON(reservationFromState);
      }
      
      
      let ticketInfo = await this.getAllRequiredProperties(step);
      await step.context.sendActivity(MessageFactory.suggestedActions(GenSuggestedQueries(), `Is there anything else I can help you with?`));
      await step.cancelAllDialogs();
      
      
      return ticketInfo;
    }
  }
};
