const {BotFrameworkAdapter, MemoryStorage, ConversationState, UserState} = require('botbuilder');
const {FlightBot} = require('flightBot');
const path = require('path');
const {BotConfiguration} = require('botframework-config');

const memoryStorage = new MemoryStorage();

const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);





const BOT_FILE = path.join(path.dirname(require.main.filename), (process.env.botFilePath || ''));

let botConfig;
botConfig = BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);

const DEV_ENVIRONMENT = 'development';

// bot name as defined in .bot file or from runtime
const BOT_CONFIGURATION = (process.env.NODE_ENV || DEV_ENVIRONMENT);

// Get bot endpoint configuration by service name
const endpointConfig = botConfig.findServiceByNameOrId(BOT_CONFIGURATION);

const adapter = new BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword
});



let flightBot;
try {
  flightBot = new FlightBot(conversationState, userState, botConfig);
} catch (err) {
  console.error(`[botInitializationError]: ${ err }`);
  process.exit();
}


adapter.onTurnError = async(context, error) => {

    console.error(`\n [onTurnError]: ${ error }`);

    context.sendActivity(`Oops. Something went wrong!`);

    await conversationState.clear(context);
    await conversationState.saveChanges(context);
};

module.exports.adapter = adapter;
module.exports.memoryStorage = memoryStorage;
module.exports.conversationState = conversationState;
module.exports.userState = userState;
module.exports.flightBot = flightBot;

