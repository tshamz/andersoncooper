# andersoncooper.js

<p align="center">
  <img width="100%" src="http://i2.cdn.cnn.com/cnnnext/dam/assets/140225123034-anderson-cooper-profile-full-169.jpg" />
</p>

>andersoncooper is a slackbot who allows you to directly post to a twitter account directly from Slack.

## Getting Started

### Installing

1. Create a new Heroku app
2. Create Slack app
3. Get Slack bot token, as well as Slack admin/god token
4. Clone this repo
5. Push the code up to your Heroku app
6. Add the following config vars to your heroku app

```
BOT_TOKEN
CLIENT_ID
CLIENT_SECRET
CONSUMER_KEY
CONSUMER_SECRET
TOKEN_SECRET
TWITTER_TOKEN
```

where:
`BOT_TOKEN` is the bot's token from your Slack app
`CLIENT_ID` is the client id from your Slack app
`CLIENT_SECRET` is the client secret from your Slack app
`CONSUMER_KEY` from your twitter app
`CONSUMER_SECRET` from your twitter app
`TOKEN_SECRET` from your twitter app
`TWITTER_TOKEN` from your twitter app

Once you've finished all the prior steps and deployed your bot to your Heroku server, visit http://[YOUR HEROKU APP URL].com/login to authenticate your bot. Once you've completed the authentication process, the bot should be a part of your team. Message the bot "help" to learn more about the bot and how to use it.

## Built With

* [Botkit](https://github.com/howdyai/botkit)
* [slack api](https://api.slack.com/)

## Authors

* **Tyler Shambora** - [tshamz](https://github.com/tshamz)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
