// Config ===============================================

var Q                    = require('q');
var moment               = require('moment');
var Botkit               = require('botkit');
var responses            = require('./responses.js');

var whitelistedUsers     = [];
var readOnlyChannels     = [];



// Init ===============================================

if (!process.env.BOT_TOKEN) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

var controller = Botkit.slackbot({
  debug: true,
  logLevel: 6
});

controller.configureSlackApp({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  scopes: ['bot']
});

controller.setupWebserver(process.env.PORT, function(err, webserver) {
  if (err) {
    throw new Error(err);
  }
  controller.createHomepageEndpoint(controller.webserver);
});

var bot = controller.spawn({
  token: process.env.BOT_TOKEN
});

bot.startRTM(function(err) {
  if (err) {
    console.log('Even if you fall on your face, you\'re still moving forward.');
    throw new Error(err);
  }
});


// Listeners  ===============================================

controller.hears([/^help/, /help$/], ['direct_message'], function(bot, message) {
  bot.reply(message, responses.help());
});

controller.hears([/post to twitter ([\s\S]*)/], ['direct_message'], function(bot, message) {
  console.log(message);
  var tweet = message.match[1];
  var parsedTweet = tweet.replace(/<\S+?\|(.+?)>/g, '<$1>').replace(/<|>/g, '');
  console.log(parsedTweet);
  var resourceUrl = 'https://api.twitter.com/1.1/statuses/update.json';
  var oauth = {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    token: process.env.TWITTER_TOKEN,
    token_secret: process.env.TOKEN_SECRET
  };
  var queryString = {
    status: parsedTweet
  };
  bot.startConversation(message, function(err, convo) {
    convo.say({
      username: 'Anderson Cooper: Keeper of the Tweets',
      icon_url: 'http://dev.tylershambora.com/images/anderson-pooper.jpg',
      text: '*I\'m about to post the following to twitter:*',
      attachments: [{
        fallback: tweet,
        text: tweet,
        color: '#00aced',
        mrkdwn_in: ['fallback', 'text']
      }]
    });
    convo.ask(responses.confirm(), [
      responses.yes(bot, resourceUrl, oauth, queryString),
      responses.no(bot),
      responses.default()
    ]);
  });
});

controller.on('rtm_open', function(bot) {
  console.log('** The RTM api just connected: ' + bot.identity.name);
});

controller.on('rtm_close', function() {
  console.log('** The RTM api just closed');
});
