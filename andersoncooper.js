// Config ===============================================

var Q                    = require('q');
var moment               = require('moment');
var Botkit               = require('botkit');
var request              = require('request');
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

var isValidChannelName = function(bot, channelName) {
  var deferred = Q.defer();
  bot.api.channels.list({}, function(err, response) {
    deferred.resolve(response.channels.some(function(channel) {
      return channel.name === channelName;
    }));
  });
  return deferred.promise;
};

var isValidUser = function(realName) {
  var deferred = Q.defer();
  deferred.resolve(whitelistedUsers.some(function(userName) {
    return userName === realName;
  }));
  return deferred.promise;
};

// var validateTweet = function(tweet) {
//   var numberOfUrls = 0;
//   var urlPattern = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig
//   var urlMatches = tweet.match(urlPattern);
//   if (urlMatches) {
//     numberOfUrls = urlMatches.length;
//     tweet = tweet.replace(urlPattern, '');
//   }
//   var totalUrlLength = numberOfUrls * 23;
//   var totalTweetLength = tweet.length + totalUrlLength;
//   return totalTweetLength <= 140;
// };


// Listeners  ===============================================

controller.hears([/^help/, /help$/], 'direct_message', function(bot, message) {
  bot.reply(message, responses.help());
});

controller.on(['direct_message'], function(bot, message) {
  bot.reply(message, '_[nonsense]_');
});

controller.hears([/post to twitter ([\s\S]*)/], ['direct_message'], function(bot, message) {
  var tweet = message.match[1];
  var encodedTweet = encodeURIComponent(tweet);
  var resourceUrl = 'https://api.twitter.com/1.1/statuses/update.json';
  var oauth = {
    consumer_key: 'rUa6cFMIbAzAKHZRdWVn4mdJX',
    consumer_secret: 'LMeuyqxYbWI3Zl0ay7gfoKcGCeqCUMLVsPqOIJT1hyEdr9V9ac',
    token: '731137964663705600-e8UZyZx5qlV0fbJNyN9HwrwhmYWJzwZ',
    token_secret: 'vTpkZhquOpyERxwPvQWaa4xSoTifOxEVr5AXtcSGyqhU9'
  };
  var queryString = {
    status: encodedTweet
  };
  bot.startConversation(message, function(err, convo) {
    convo.say('Hey! You just said: ' + message.match[1]);
    convo.say("I'm going to try and tweet this.");

    request.post({url: resourceUrl, oauth: oauth, qs: queryString}, function(error, response, body) {
      console.log(oauth);
      console.log('error: ' + error);
      console.log('body: ' + body);
    });
  });
});

controller.on('direct_message, mention, direct_mention', function(bot, message) {

});


// controller.hears([/[\s\S]*/], ['direct_message', 'direct_mention', 'mention', 'ambient'], function(bot, message) {

// });

controller.on('rtm_open', function(bot) {
  console.log('** The RTM api just connected: ' + bot.identity.name);
});

controller.on('rtm_close', function() {
  console.log('** The RTM api just closed');
});
