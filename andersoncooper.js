// Config ===============================================

var Q                    = require('q');
var moment               = require('moment');
var Botkit               = require('botkit');
var emoji                = require('node-emoji');
var responses            = require('./responses.js');

var blacklistedUsers     = [];
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


// Helper Functions ===============================================

var getRealNameFromId = function(bot, userId) {
  var deferred = Q.defer();
  var realName = '';
  bot.api.users.info({user: userId}, function(err, response) {
    realName = response.user.real_name.toLowerCase();
    deferred.resolve(realName);
  });
  return deferred.promise;
};


// Listeners  ===============================================

controller.hears('help', ['direct_message'], function(bot, message) {
  bot.reply(message, responses.help());
});

controller.hears([/post to twitter ([\s\S]*)/], ['direct_message'], function(bot, message) {
  var tweet = message.match[1];
  var emojifiedTweet = emoji.emojify(tweet);
  var parsedTweet = emojifiedTweet
    .replace(/<\S+?\|(.+?)>/g, '<$1>')
    .replace(/<|>/g, '')
    .replace(/&amp;/, '&')
    .replace(/&gt;/, '>')
    .replace(/&lt;/, '<')
    .replace(/\\@/g, '@')
    .replace(/\\#/g, '#');
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
  getRealNameFromId(bot, message.user).then(function(userName) {
    console.log(userName + ' just tried to post: ' + tweet);
    if (blacklistedUsers.indexOf(userName) !== -1) {
      bot.reply(message, 'you done fucked up once before, you can no longer post.');
    } else {
      bot.startConversation(message, function(err, convo) {
        convo.say({
          username: 'Anderson Cooper: Keeper of the Tweets',
          icon_url: 'http://dev.tylershambora.com/images/anderson-pooper.jpg',
          text: '*I\'m about to post the following to twitter:*',
          attachments: [{
            fallback: parsedTweet,
            text: parsedTweet,
            color: '#00aced',
            mrkdwn_in: ['fallback', 'text']
          }]
        });
        convo.ask(responses.confirm(), [
          responses.yes(bot, userName, resourceUrl, oauth, queryString),
          responses.no(bot),
          responses.default()
        ]);
      });
    }
  });
});


controller.on('rtm_open', function(bot) {
  console.log('** The RTM api just connected: ' + bot.identity.name);
});

controller.on('rtm_close', function() {
  console.log('** The RTM api just closed');
});
