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
  controller.createWebhookEndpoints(controller.webserver);
  controller.createHomepageEndpoint(controller.webserver);
  controller.createOauthEndpoints(controller.webserver, function(err, req, res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Great Success!');
    }
  });
});

var _bots = {};
var trackBot = function(bot) {
  _bots[bot.config.token] = bot;
};

controller.on('create_bot', function(bot, config) {
  console.log(config);
  if (_bots[bot.config.token]) {
    // already online! do nothing.
  } else {
    bot.startRTM(function(err) {
      if (err) {
        console.log('Even if you fall on your face, you\'re still moving forward.');
        throw new Error(err);
      } else if (!err) {
        trackBot(bot);
      }
      bot.startPrivateConversation({user: config.createdBy},function(err, convo) {
        if (err) {
          console.log(err);
        }
      });
    });
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
  // @mentions and #hashtags must be prefixed like \@this and \#this or else they'll be interpreted and handled as slack @usernames and #channels
  var tweet = message.match[1];
  var emojifiedTweet = emoji.emojify(tweet);  // convert slack emoji codes to unicode
  var parsedTweet = emojifiedTweet
    .replace(/<\S+?\|(.+?)>/g, '<$1>')  // parse url sequences to use originally typed version if available
    .replace(/<|>/g, '')  // remove "<" and ">" from url sequences
    .replace(/&amp;/, '&')  // convert non-control encoded "&amp;" to "&"
    .replace(/&gt;/, '>')  // convert non-control encoded "&gt;" to ">"
    .replace(/&lt;/, '<')  // convert non-control encoded "&lt;" to "<"
    .replace(/\\@/g, '@')  // convert "\@" sequences to "@" since @ is reserved for slack usernames
    .replace(/\\#/g, '#');  // convert "\#" sequences to "#" since # is reserved for slack channel names
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
      bot.reply(message, 'you done goofed up once before, therefore you can no longer post.');
    } else {
      bot.startConversation(message, function(err, convo) {
        convo.say(responses.startConvo(parsedTweet));
        convo.ask(responses.confirm(), [
          responses.yes(bot, userName, resourceUrl, oauth, queryString),
          responses.no(bot),
          responses.default()
        ]);
      });
    }
  });
});

controller.on('direct_message',function(bot, message) {
  if (message.text.indexOf('help') === -1 || message.text.indexOf('post to twitter') === -1) {
    bot.reply(message, 'Want me to do something? Try asking for "help"');
  }
});

controller.on('rtm_open', function(bot) {
  console.log('** The RTM api just connected: ' + bot.identity.name);
});

controller.on('rtm_close', function() {
  console.log('** The RTM api just closed');
});
