var request = require('request');
var andersonCooper = {
  username: 'Anderson Cooper: Keeper of the Tweets',
  icon_url: 'http://dev.tylershambora.com/images/anderson-pooper.jpg',
};

module.exports = {
  help: function() {
    return {
      username: andersonCooper.userName,
      icon_url: andersonCooper.icon_url,
      text: "*Look, I'm pretty stupid, I can only do a few things.* \n\nIf you want me to post a message to twitter, you need to send me a direct message that follows this pattern: `post to twitter [tweet]` (without the square brackets). If you don't follow this pattern, I won't do anything. Also, if there's something wrong with your tweet, I won't send it, but I'll try my best to tell you why. If you still have no idea what's going on, talk to @tsham.\n\n\n*NOTE: ALWAYS PREFIX @mentions OR #hashtags WITH A \\ CHARACTER, LIKE \\#this or \\@this.*"
    };
  },
  startConvo: function(parsedTweet) {
    return {
      username: andersonCooper.userName,
      icon_url: andersonCooper.icon_url,
      text: '*I\'m about to post the following to twitter:*',
      attachments: [{
        fallback: parsedTweet,
        text: parsedTweet,
        color: '#00aced',
        mrkdwn_in: ['fallback', 'text']
      }]
    };
  },
  confirm: function() {
    return {
      text: 'Would you like to proceed?',
      attachments: [{
        fallback: '*YES* to confirm',
        text: '*YES* to confirm',
        color: 'good',
        mrkdwn_in: ['fallback', 'text']
      }, {
        fallback: '*NO* to abort',
        text: '*NO* to abort',
        color: 'danger',
        mrkdwn_in: ['fallback', 'text']
      }]
    };
  },
  yes: function(bot, userName, resourceUrl, oauth, queryString) {
    return {
      pattern: bot.utterances.yes,
      callback: function(response, convo) {
        request.post({url: resourceUrl, oauth: oauth, qs: queryString}, function(error, response, body) {
          var parsedBody = JSON.parse(body);
          if (parsedBody.hasOwnProperty('errors')) {
            parsedBody.errors.forEach(function(error) {
              convo.say({
                username: andersonCooper.userName,
                icon_url: andersonCooper.icon_url,
                text: '*There was an error...*',
                attachments: [{
                  fallback: error.message,
                  title: 'Error:',
                  text: error.message,
                  color: 'danger',
                  mrkdwn_in: ['fallback', 'text']
                }]
              });
            });
          } else {
            bot.say({
              channel: '#tweet-game-on-fleek',
              username: andersonCooper.username,
              icon_url: andersonCooper.icon_url,
              text: 'Hey! Checkout what *'+ userName +'* just tweeted!\n' + 'https://twitter.com/BVAccel/status/' + parsedBody.id_str
            });
          }
        });
        convo.next();
      }
    };
  },
  no: function(bot) {
    return {
      pattern: bot.utterances.no,
      callback: function(response, convo) {
        convo.say('twitter sucks anyways, snapchat is way cooler.');
        convo.next();
      }
    };
  },
  default: function() {
    return {
      default: true,
      callback: function(response, convo) {
        convo.repeat();
        convo.next();
      }
    };
  }
};
