var request = require('request');
module.exports = {
  help: function() {
    return {
      username: 'Anderson Cooper: Keeper of the Tweets',
      icon_url: 'http://dev.tylershambora.com/images/anderson-pooper.jpg',
      text: "Look, I'm pretty stupid, I can only do a few things. If you want me to post a message to twitter, you need to send me a direct message that follows this pattern: `post to twitter [tweet]`. If you don't follow this pattern, I won't respond. Also, if there's something wrong with your tweet, I won't send it and I'll try my best to tell you why. If you still have no idea what's going on, talk to @tsham."
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
          console.log('body: ' + body);
          var parsedBody = JSON.parse(body);
          if (parsedBody.hasOwnProperty('errors')) {
            parsedBody.errors.forEach(function(error) {
              convo.say({
                username: 'Anderson Cooper: Keeper of the Tweets',
                icon_url: 'http://dev.tylershambora.com/images/anderson-pooper.jpg',
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
            setTimeout(function() {
              convo.say('Great! Moving forward...');
              bot.say({
                channel: '#tweet-game-on-fleek',
                username: 'Anderson Cooper: Keeper of the Tweets',
                icon_url: 'http://dev.tylershambora.com/images/anderson-pooper.jpg',
                text: 'Hey! Checkout what '+ username +' just tweeted!\n' + 'https://twitter.com/bvatweetbot/status/' + parsedBody.id
              });
            }, 2000);
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
