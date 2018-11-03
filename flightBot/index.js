const {LuisRecognizer} = require('botbuilder-ai');
const {DialogSet} = require('botbuilder-dialogs');
const {ActivityTypes, CardFactory, MessageFactory} = require('botbuilder');

const {OnTurnProperty} = require('./dialogs/shared/stateProperties');
const {WelcomeCard} = require('./dialogs/welcome');
const {MainDispatcher} = require('./dialogs/dispatcher');


// State properties
const ON_TURN_PROPERTY = 'onTurnStateProperty';
const DIALOG_STATE_PROPERTY = 'dialogStateProperty';


class FlightBot {
  /**
   * Constructs the three pieces necessary for this bot to operate:
   * 1. StatePropertyAccessor for conversation state
   * 2. StatePropertyAccess for user state
   * 3. LUIS client
   * 4. DialogSet to handle our GreetingDialog
   *
   * @param {ConversationState} conversationState property accessor
   * @param {UserState} userState property accessor
   * @param {BotConfiguration} botConfig contents of the .bot file
   */
  constructor(conversationState, userState, botConfig) {
    
    if (!conversationState) throw new Error('Missing parameter. Conversation state is required.');
    if (!userState) throw new Error('Missing parameter. User state is required.');
    if (!botConfig) throw new Error('Missing parameter. Bot configuration is required.');
    
    // Create state property accessors.
    this.onTurnAccessor = conversationState.createProperty(ON_TURN_PROPERTY);
    this.dialogAccessor = conversationState.createProperty(DIALOG_STATE_PROPERTY);
    
    // Add main dispatcher.
    this.dialogs = new DialogSet(this.dialogAccessor);
    this.dialogs.add(new MainDispatcher(botConfig, this.onTurnAccessor, conversationState, userState));
    
    this.conversationState = conversationState;
    this.userState = userState;
    
  }
  
  /**
   * Driver code that does one of the following:
   * 1. Display a welcome card upon receiving ConversationUpdate activity
   * 2. Use LUIS to recognize intents for incoming user message
   * 3. Start a greeting dialog
   * 4. Optionally handle Cancel or Help interruptions
   *
   * @param {Context} context turn context from the adapter
   */
  async onTurn(turnContext) {
    
    // See https://aka.ms/about-bot-activity-message to learn more about message and other activity types.
    switch (turnContext.activity.type) {
      case ActivityTypes.Message:
        // Process card input.
        // All cards used in this sample are adaptive cards and contain a custom intent + entity payload.
        let onTurnProperties = await this.detectIntentAndEntitiesFromCardInput(turnContext);
        if (onTurnProperties === undefined) break;
        
        // Set the state with gathered properties (intent/ entities) through the onTurnAccessor.
        await this.onTurnAccessor.set(turnContext, onTurnProperties);
        
        // Create dialog context.
        const dc = await this.dialogs.createContext(turnContext);
        
        // Continue outstanding dialogs.
        await dc.continueDialog();
        
        // Begin main dialog if no outstanding dialogs/ no one responded.
        if (!dc.context.responded) {
          await dc.beginDialog(MainDispatcher.Name);
        }
        break;
      case ActivityTypes.ConversationUpdate:
        // Welcome user.
        await this.welcomeUser(turnContext);
        break;
      default:
        // Handle other activity types as needed.
        break;
    }
    
    // Persist state.
    // Hint: You can get around explicitly persisting state by using the autoStateSave middleware.
    await this.conversationState.saveChanges(turnContext);
    await this.userState.saveChanges(turnContext);
  }
  
  /**
   * Look at the LUIS results and determine if we need to handle
   * an interruptions due to a Help or Cancel intent
   *
   * @param {DialogContext} dc - dialog context
   * @param {LuisResults} luisResults - LUIS recognizer results
   */
  async isTurnInterrupted(dc, luisResults) {
    const topIntent = LuisRecognizer.topIntent(luisResults);
    
    // see if there are anh conversation interrupts we need to handle
    if (topIntent === CANCEL_INTENT) {
      if (dc.activeDialog) {
        // cancel all active dialog (clean the stack)
        await dc.cancelAllDialogs();
        await dc.context.sendActivity(`Ok.  I've cancelled our last activity.`);
      } else {
        await dc.context.sendActivity(`I don't have anything to cancel.`);
      }
      return true; // this is an interruption
    }
    
    if (topIntent === HELP_INTENT) {
      await dc.context.sendActivity(`Let me try to provide some help.`);
      await dc.context.sendActivity(`Help - show this info block.
Buy - to start order process.
My tickets - check list of your tickets.
Cancel - cancel current operation.
Admin - administration features.
`);
      return true; // this is an interruption
    }
    return false; // this is not an interruption
  }
  
  /**
   * Async helper method to welcome all users that have joined the conversation.
   *
   * @param {TurnContext} context conversation context object
   *
   */
  async welcomeUser(turnContext) {
    // Do we have any new members added to the conversation?
    if (turnContext.activity.membersAdded.length !== 0) {
      // Iterate over all new members added to the conversation
      for (var idx in turnContext.activity.membersAdded) {
        // Greet anyone that was not the target (recipient) of this message
        // 'bot' is the recipient for events from the channel,
        
        // bot was added to the conversation.
        if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
          
          // Send welcome card.
          await turnContext.sendActivity(MessageFactory.attachment(CardFactory.adaptiveCard(WelcomeCard)));
        }
      }
    }
  }
  
  /**
   * Async helper method to get on turn properties from cards
   *
   * - All cards for this bot -
   *   1. Are adaptive cards. See https://adaptivecards.io to learn more.
   *   2. All cards include an 'intent' field under 'data' section and can include entities recognized.
   *
   * @param {TurnContext} turn context object
   *
   */
  
  async detectIntentAndEntitiesFromCardInput(turnContext) {
    // Handle card input (if any), update state and return.
    if (turnContext.activity.value !== undefined) {
      return OnTurnProperty.fromCardInput(turnContext.activity.value);
    }
    
    // Acknowledge attachments from user.
    if (turnContext.activity.attachments && turnContext.activity.attachments.length !== 0) {
      await turnContext.sendActivity(`Thanks for sending me that attachment. I'm still learning to process attachments.`);
      return undefined;
    }
    
    // Nothing to do for this turn if there is no text specified.
    if (turnContext.activity.text === undefined || turnContext.activity.text.trim() === '') {
      return undefined;
    }
    return new OnTurnProperty();
  }
  
  /**
   * Helper function to update user profile with entities returned by LUIS.
   *
   * @param {LuisResults} luisResults - LUIS recognizer results
   * @param {DialogContext} dc - dialog context
   */
  async updateUserProfile(luisResult, context) {
    // Do we have any entities?
    if (Object.keys(luisResult.entities).length !== 1) {
      // get userProfile object using the accessor
      let userProfile = await this.userProfileAccessor.get(context);
      if (userProfile === undefined) {
        userProfile = new UserProfile();
      }
      // see if we have any user name entities
      USER_NAME_ENTITIES.forEach(name => {
        if (luisResult.entities[name] !== undefined) {
          let lowerCaseName = luisResult.entities[name][0];
          // capitalize and set user name
          userProfile.name = lowerCaseName.charAt(0).toUpperCase() + lowerCaseName.substr(1);
        }
      });
      USER_LOCATION_ENTITIES.forEach(city => {
        if (luisResult.entities[city] !== undefined) {
          let lowerCaseCity = luisResult.entities[city][0];
          // capitalize and set user name
          userProfile.city = lowerCaseCity.charAt(0).toUpperCase() + lowerCaseCity.substr(1);
        }
      });
      // set the new values
      await this.userProfileAccessor.set(context, userProfile);
    }
  }
}

module.exports.FlightBot = FlightBot;
