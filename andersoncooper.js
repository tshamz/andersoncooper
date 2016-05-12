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



// Listeners  ===============================================

controller.hears(['help'], ['direct_message'], function(bot, message) {
  bot.reply(message, "Look, I'm pretty stupid, I can only do a few things. If you want me to post a message to twitter, you need to send me a direct message that's prefixed with 'post to twitter [message]'. If you don't, I'll respond to you with nonsense. Also, if there's something wrong with your post, I won't send it, but I will tell you why. Talk to @tsham if you need further instruction.");
});

controller.hears([/post to twitter ([\s\S]*)/], 'direct_message', function(bot, message) {
  console.log(message.match[1]);
});

// controller.hears(['hey mister'], ['direct_message', 'mention', 'direct_mention'], function(bot, message) {
//   getRealNameFromId(bot, message.user)
//     .then(isValidUser)
//     .then(function(result) {
//       bot.reply(message, 'Hello!');
//       if (result) {
//         bot.reply(message, 'Hey! You\'re pretty valid!');
//       }
//     });
// });

controller.on('direct_message, mention, direct_mention', function(bot, message) {

});


controller.hears([/[\s\S]*/], ['direct_message', 'direct_mention', 'mention', 'ambient'], function(bot, message) {
  if (readOnlyChannels.indexOf(message.channel) !== -1) {
    getRealNameFromId(bot, message.user).then(function(realName) {
      var options = {
        token: process.env.MEGA_TOKEN,
        ts: message.ts,
        channel: message.channel,
        as_user: true
      };

      console.log('%s said: "%s"', realName, message.text);
      console.log('Attempting to delete the message.' );

      // this whole block looks pretty ripe for some abstraction and recursion (tsham)
      bot.api.chat.delete(options, function(err, response) {
        if (!response.ok) {
          console.log('Unable to delete due to error: ' + err);
          console.log('Trying one more time in 2 seconds');
          setTimeout(function() {
            bot.api.chat.delete(options, function(err, response) {
              if (!response.ok) {
                console.log('Unable to delete after a second attempt due to error: ' + err);
              }
            });
          }, 2000);
        } else {
          console.log('Message successfully deleted!');
        }
      });
    });
  }
});

controller.on('rtm_open', function(bot) {
  console.log('** The RTM api just connected: ' + bot.identity.name);
});

controller.on('rtm_close', function() {
  console.log('** The RTM api just closed');
});
