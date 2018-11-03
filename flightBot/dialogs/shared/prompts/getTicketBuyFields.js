// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const {MessageFactory} = require('botbuilder');
const {TextPrompt} = require('botbuilder-dialogs');
const {LuisRecognizer} = require('botbuilder-ai');

const {TicketBuyProperty, ticketBuyStatusEnum, OnTurnProperty} = require('../stateProperties');

const CONTINUE_PROMPT_INTENT = 'getTicketBuyFields';
const HELP_INTENT = 'Help';
const CANCEL_INTENT = 'Cancel';
const INTERRUPTIONS_INTENT = 'Interruptions';
const NOCHANGE_INTENT = 'noChange';
const INTERRUPTION_DISPATCHER = 'interruptionDispatcherDialog';
const CONFIRM_CANCEL_PROMPT = 'confirmCancelPrompt';

// LUIS service type entry for turn.n book table LUIS model in the .bot file.
const LUIS_CONFIGURATION = 'FlightBot';
module.exports = {
  // This is a custom TextPrompt that uses a LUIS model to handle turn.n conversations including interruptions.
  GetTicketBuyFields: class extends TextPrompt {
    /**
     * Constructor.
     * @param {String} dialog id
     * @param {BotConfiguration} .bot file configuration
     * @param {StateAccessor} accessor for the reservation property
     * @param {StateAccessor} accessor for on turn property
     * @param {StateAccessor} accessor for user profile property
     */
    constructor(dialogId, botConfig, onTurnAccessor, userProfileAccessor, ticketBuyAccessor) {
      if (!dialogId) throw new Error('Need dialog ID');
      if (!botConfig) throw new Error('Need bot configuration');
      if (!ticketBuyAccessor) throw new Error('Need user reservation property accessor');
      if (!onTurnAccessor) throw new Error('Need on turn property accessor');
      
      // Call super and provide a prompt validator
      super(dialogId, async (validatorContext) => {
        // validation and prompting logic
        // get reservation property
        let reservationFromState = await this.ticketBuyAccessor.get(validatorContext.context);
        let newTicketBuy;
        if (reservationFromState === undefined) {
          newTicketBuy = new TicketBuyProperty();
        } else {
          newTicketBuy = TicketBuyProperty.fromJSON(reservationFromState);
        }
        // If we have a valid reservation, end this prompt.
        // Else get LG based on what's available in reservation property.
        if (newTicketBuy.haveCompleteTicketBuy) {
          if (!newTicketBuy.ticketBuyConfirmed) {
            if (newTicketBuy.needsChange === true) {
              await validatorContext.context.sendActivity(`What would you like to change?`);
              await validatorContext.context.sendActivity(MessageFactory.suggestedActions(['No changes'], `You can say things like 'ticket from New York to Dublin' or 'buy First class ticket'...`));
            } else {
              
              await validatorContext.context.sendActivity('So, here is what I got from you: ' + newTicketBuy.confirmationReadOut());
              await validatorContext.context.sendActivity(MessageFactory.suggestedActions(['Yes', 'Edit', 'Cancel'], `Should I go ahead with this buy?`));
            }
          } else {
            // have all required information. Return true and complete the text prompt.
            return true;
          }
        } else {
          // readout any information captured so far.
          let groundedPropertiesReadout = newTicketBuy.getGroundedPropertiesReadOut();
          if (groundedPropertiesReadout !== '') {
            await validatorContext.context.sendActivity(groundedPropertiesReadout);
          }
          // ask user for missing information
          await validatorContext.context.sendActivity(newTicketBuy.getMissingPropertyReadOut());
        }
        // We don't yet have everything we need. Return false.
        return false;
      });
      
      // Keep a copy of accessors for use within this class.
      this.ticketBuyAccessor = ticketBuyAccessor;
      this.onTurnAccessor = onTurnAccessor;
      this.userProfileAccessor = userProfileAccessor;
      
      // add recognizer
      const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION);
      if (!luisConfig || !luisConfig.appId) throw new Error(`Book Table Turn.N LUIS configuration not found in .bot file. Please ensure you have all required LUIS models created and available in the .bot file. See readme.md for additional information\n`);
      this.luisRecognizer = new LuisRecognizer({
        applicationId: luisConfig.appId,
        endpoint: luisConfig.getEndpoint(),
        // CAUTION: Its better to assign and use a subscription key instead of authoring key here.
        endpointKey: luisConfig.authoringKey
      });
    }
    
    /**
     * Override continueDialog.
     *   The override enables
     *     Interruption to be kicked off from right within this dialog.
     *     Ability to leverage a dedicated LUIS model to provide flexible entity filling,
     *     corrections and contextual help.
     *
     * @param {DialogContext} dialog context
     */
    async continueDialog(dc) {
      let turnContext = dc.context;
      // get reservation property
      let reservationFromState = await this.ticketBuyAccessor.get(turnContext);
      let newTicketBuy;
      if (reservationFromState === undefined) {
        newTicketBuy = new TicketBuyProperty();
      } else {
        newTicketBuy = TicketBuyProperty.fromJSON(reservationFromState);
      }
      // Get on turn property. This has any entities that mainDispatcher
      // might have captured in its LUIS call or from card input
      const onTurnProperties = await this.onTurnAccessor.get(turnContext);
      // if on turn property has entities
      let updateResult;
      if (onTurnProperties !== undefined && onTurnProperties.entities && onTurnProperties.entities.length !== 0) {
        // update reservation property with on turn property results
        updateResult = newTicketBuy.updateProperties(onTurnProperties);
      }
      // see if updates to reservation resulted in errors, if so, report them to user.
      if (updateResult &&
        updateResult.status === ticketBuyStatusEnum.INCOMPLETE &&
        updateResult.outcome !== undefined &&
        updateResult.outcome.length !== 0) {
        // set reservation property
        this.ticketBuyAccessor.set(turnContext, updateResult.newTicketBuy);
        // return and do not continue if there is an error
        await turnContext.sendActivity(updateResult.outcome[0].message);
        return await super.continueDialog(dc);
      }
      // call LUIS (bookTableTurnN model) and get results
      const LUISResults = await this.luisRecognizer.recognize(turnContext);
      let topIntent = LuisRecognizer.topIntent(LUISResults);
      // If we dont have an intent match from LUIS, go with the intent available via
      // the on turn property (parent's LUIS model)
      if (Object.keys(LUISResults.intents).length === 0) {
        // go with intent in onTurnProperty
        topIntent = (onTurnProperties.intent || 'None');
      }
      // update reservation object with LUIS result
      updateResult = newTicketBuy.updateProperties(OnTurnProperty.fromLUISResults(LUISResults));
      
      // see if update reservation resulted in errors, if so, report them to user.
      if (updateResult &&
        updateResult.status === ticketBuyStatusEnum.INCOMPLETE &&
        updateResult.outcome !== undefined &&
        updateResult.outcome.length !== 0) {
        // set reservation property
        this.ticketBuyAccessor.set(turnContext, updateResult.newTicketBuy);
        // return and do not continue if there is an error.
        await turnContext.sendActivity(updateResult.outcome[0].message);
        return await super.continueDialog(dc);
      }
      // Did user ask for help or said cancel or continuing the conversation?
      switch (topIntent) {
        case CONTINUE_PROMPT_INTENT:
          // user does not want to make any change.
          updateResult.newTicketBuy.needsChange = false;
          break;
        case NOCHANGE_INTENT:
          // user does not want to make any change.
          updateResult.newTicketBuy.needsChange = false;
          break;
        case HELP_INTENT:
          // come back with contextual help
          let helpReadOut = updateResult.newTicketBuy.helpReadOut();
          await turnContext.sendActivity(helpReadOut);
          break;
        case CANCEL_INTENT:
          // set reservation property
          this.ticketBuyAccessor.set(turnContext, updateResult.newTicketBuy);
          // start confirmation prompt
          return await dc.prompt(CONFIRM_CANCEL_PROMPT, `Are you sure you want to cancel?`);
        case INTERRUPTIONS_INTENT:
        default:
          // Provide contextual help before handling interruptions.
          // await dc.context.sendActivity('Just so you know .. ' + updateResult.newTicketBuy.helpReadOut());
          // if we picked up new entity values, do not treat this as an interruption
          if (onTurnProperties.entities.length !== 0 || Object.keys(LUISResults.entities).length > 1) break;
          // Handle interruption.
          return await dc.beginDialog(INTERRUPTION_DISPATCHER, OnTurnProperty.fromLUISResults(LUISResults));
      }
      // set reservation property based on OnTurn properties
      this.ticketBuyAccessor.set(turnContext, updateResult.newTicketBuy);
      return await super.continueDialog(dc);
    }
    
    /**
     * Override resumeDialog.
     * This is used to handle user's response to confirm cancel prompt.
     *
     * @param {DialogContext} dc
     * @param {DialogReason} reason
     * @param {Object} result
     */
    async resumeDialog(dc, reason, result) {
      if (result) {
        // User said yes to cancel prompt.
        await dc.context.sendActivity(`Sure. I've cancelled that!`);
        return await dc.cancelAllDialogs();
      } else {
        // User said no to cancel.
        return await super.resumeDialog(dc, reason, result);
      }
    }
    
    /**
     * Over ride repromptDialog.
     * This is useful to ensure the right re-prompt text is set before re-prompting.
     * This method is called anytime a re-prompt is initiated.
     * @param {TurnContext} turn context
     * @param {DialogInstance} dialog instance
     */
    async repromptDialog(context, instance) {
      let reservationFromState = await this.ticketBuyAccessor.get(context);
      let newTicketBuy;
      if (reservationFromState === undefined) {
        newTicketBuy = new TicketBuyProperty();
      } else {
        newTicketBuy = TicketBuyProperty.fromJSON(reservationFromState);
      }
      if (!newTicketBuy.haveCompleteTicketBuy) {
        instance.state.options.prompt = newTicketBuy.getMissingPropertyReadOut();
      } else {
        await context.sendActivity('So, here is what I got from you: ' + newTicketBuy.confirmationReadOut());
        instance.state.options.prompt = await MessageFactory.suggestedActions(['Yes', 'Edit', 'Cancel'], `Should I go ahead with this buy?`);
        
      }
      return await super.repromptDialog(context, instance);
    }
  }
};
