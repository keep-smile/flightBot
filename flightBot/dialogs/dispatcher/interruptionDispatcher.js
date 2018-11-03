// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {ComponentDialog} = require('botbuilder-dialogs');
const {LuisRecognizer} = require('botbuilder-ai');
const {OnTurnProperty} = require('../shared/stateProperties');

const NONE_INTENT = 'None';
const TICKET_BUY_DIALOG_NAME = 'TicketBuy';
const TICKET_LIST_DIALOG_NAME = 'TicketList';
const ADMIN_DIALOG_NAME = 'Admin';
const INTERRUPTION_DISPATCHER_DIALOG = 'interruptionDispatcherDialog';

// LUIS service type entry in the .bot file for dispatch.
const LUIS_CONFIGURATION = 'FlightBot';

class InterruptionDispatcher extends ComponentDialog {
  /**
   * Constructor.
   *
   * @param {StatePropertyAccessor} onTurnAccessor
   * @param {ConversationState} conversationState
   * @param {StatePropertyAccessor} userProfileAccessor
   * @param {BotConfiguration} botConfig
   */
  constructor(onTurnAccessor, conversationState, userProfileAccessor, botConfig, ticketBuyAccessor) {
    super(INTERRUPTION_DISPATCHER_DIALOG);
    
    if (!onTurnAccessor) throw new Error('Missing parameter. On turn property accessor is required.');
    if (!conversationState) throw new Error('Missing parameter. Conversation state is required.');
    if (!userProfileAccessor) throw new Error('Missing parameter. User profile accessor is required.');
    if (!botConfig) throw new Error('Missing parameter. Bot configuration is required.');
    
    // keep on turn accessor
    this.onTurnAccessor = onTurnAccessor;
    
    // add dialogs
    // this.addDialog(new TicketBuyDialog(botConfig, conversationState, userProfileAccessor, onTurnAccessor, ticketBuyAccessor));
    // this.addDialog(new TicketListDialog());
    
    // this.addDialog(new AdmintDialog());
    
    // add recognizer
    const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION);
    if (!luisConfig || !luisConfig.appId) throw new Error(`Cafe Dispatch LUIS model not found in .bot file. Please ensure you have all required LUIS models created and available in the .bot file. See readme.md for additional information.\n`);
    this.luisRecognizer = new LuisRecognizer({
      applicationId: luisConfig.appId,
      endpoint: luisConfig.getEndpoint(),
      // CAUTION: Its better to assign and use a subscription key instead of authoring key here.
      endpointKey: luisConfig.authoringKey
    });
  }
  
  static get Name() {
    return INTERRUPTION_DISPATCHER_DIALOG;
  }
  
  /**
   * Override onBeginDialog
   *
   * @param {Object} dc dialog context
   * @param {Object} options dialog turn options
   */
  async onBeginDialog(dc, options) {
    // Override default begin() logic with interruption orchestration logic
    return await this.interruptionDispatch(dc, options);
  }
  
  /**
   * Override onContinueDialog
   *
   * @param {Object} dc dialog context
   */
  async onContinueDialog(dc) {
    // Override default continue() logic with interruption orchestration logic
    return await this.interruptionDispatch(dc);
  }
  
  /**
   * Helper method to dispatch on interruption.
   *
   * @param {Object} dc
   * @param {Object} options
   */
  async interruptionDispatch(dc, options) {
    // Call to LUIS recognizer to get intent + entities
    const LUISResults = await this.luisRecognizer.recognize(dc.context);
    
    // Return new instance of on turn property from LUIS results.
    // Leverages static fromLUISResults method
    let onTurnProperty = OnTurnProperty.fromLUISResults(LUISResults);
    
    switch (onTurnProperty.intent) {
      // Help, ChitChat and QnA share the same QnA Maker model. So just call the QnA Dialog.
      
      case TICKET_BUY_DIALOG_NAME:
      case TICKET_LIST_DIALOG_NAME:
      case ADMIN_DIALOG_NAME:
        await dc.context.sendActivity(`Sorry. I'm unable to do that right now. You can cancel the current conversation and start a new one`);
        return await dc.endDialog();
      case NONE_INTENT:
      default:
        return await dc.context.sendActivity(`Input dosn't recognised... Lest try one more time.`);
      
    }
  }
}


module.exports.InterruptionDispatcher = InterruptionDispatcher;
