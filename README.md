# FlightBot
Node.Js + BotFramework + LUIS learning project

# Intro

FlightBot provides friendly and variative Ticket Buy process.
Bot based on the BotBuilder-Samples/samples/javascript_nodejs/51.cafe-bot (https://github.com/Microsoft/BotBuilder-Samples/tree/master/samples/javascript_nodejs/51.cafe-bot) exmple.
Uses wide range of LUIS and BotFramework features. Successful Ticket Buys saves into MongoDB and available for User by request.


# Technologies Used
- Node.js
- LUIS
- Microsoft BotFramework
- MongoDB

# Installation

To install:
npm i
Edit .env file with your environment
npm start

# Known issues
- No Ticket Dialogue cleanup after successful buy or cancel
- Various occasional issues with Names and Cities recognition
- Poor informationing during ticket buy process
- Poor validation messages
- Not clean/not refactored Bot modules structure
