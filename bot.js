const SlackBot = require('slackbots');
const fs = require('fs');
const request = require('request');
const Twitter = require('twitter');
const {sleep} = require('sleep-async')();
exports.Bot = class Bot {
  getSlackUser(id) {
    if (!('users' in this)) {
      this.users = this.slack.getUsers()._value.members;
    }
    for (const user of this.users) {
      if (user.id === id) {
        return [user.name, user.profile.image_48];
      }
    }
    return ['', './yoshinon.png'];
  }
  getSlackChannel(id) {
    if (!('channels' in this)) {
      this.channels = this.slack.getChannels()._value.channels;
    }
    for (const channel of this.channels) {
      if (channel.id === id) {
        return '#' + channel.name;
      }
    }
    return '';
  }
  getSlackChannelID(channelname) {
    if (channelname.startsWith('#')) channelname = channelname.slice(1);
    if (!('channels' in this)) {
      this.channels = this.slack.getChannels()._value.channels;
    }
    for (const channel of this.channels) {
      if (channel.name === channelname) {
        return channel.id;
      }
    }
    return '';
  }


  slackApi(methodName, params, callback) {
    params.token = this.slack_token;
    const data = {url: `https://slack.com/api/${methodName}`, form: params};
    request.post(data, function(err, request, body) {
      try {
        callback(JSON.parse(body));
      } catch (e) {
        console.log(e)
      }
    });
  }
  getSlackChannelHistory(id, callback) {
    this.slackApi('channels.history', {channel: id}, (history) => {
      const messages = [];
      for (let message of history.messages) {
        message.channel = id;
        messages.push(message);
      }
      callback(messages);
    });
  }
  _parseSlackMessage(data) {
    if (data.type == 'message') {
      const [name, icon_url] = this.getSlackUser(data.user);
      const channel = this.getSlackChannel(data.channel);
      if (channel === '' || name === '' || !('text' in data)) return false;
      return Bot.toMessage(icon_url, channel, name, data.text);
    }
  }
  _parseTweet(tweet) {
    return Bot.toMessage(
        tweet.user.profile_image_url_https, ':twitter:', tweet.user.name,
        tweet.text);
  }
  constructor() {
    this._gotMessageFunctions = [];
    const [slack_token, c_k, c_s, a_k, a_s] =
        fs.readFileSync('TOKEN', 'utf-8').split('\n');
    this.slack_token = slack_token;
    // slack ///////////////////////////////////////////
    this.slack = new SlackBot({token: this.slack_token});
    this.slack.on('message', (data) => {
      const parsed = this._parseSlackMessage(data);
      if (parsed) this._applyMessage(parsed);
    });
    // twitter //////////////////////////////////////////
    this.twitter = new Twitter({
      consumer_key: c_k,
      consumer_secret: c_s,
      access_token_key: a_k,
      access_token_secret: a_s
    });
    this.twitter.stream('user', (stream) => {
      stream.on('data', (tweet) => {
        const screen_name = tweet.user.screen_name;
        this._applyMessage(this._parseTweet(tweet));
      });
      stream.on('error', (e) => {console.log(e)});
    });
  }
  gotMessage(func) {
    this._gotMessageFunctions.push(func);
  }
  traceHistory(channel = '', once = false, callback) {
    this.traced = this.traced || {slack: {}};
    if (channel.startsWith('#')) {
      channel = this.getSlackChannelID(channel);
      if (once && this.traced.slack[channel]) return;
      this.traced.slack[channel] = true;
      this.getSlackChannelHistory(channel, (messages) => {
        messages = messages.map(m => this._parseSlackMessage(m)).filter(m => m);
        if (messages === []) return;
        callback(messages);
        console.log(`channel ${channel} history got`);
      });
    } else {
      if (once && this.traced[channel]) return;
      this.traced[channel] = true;
      if (channel == ':twitter:') {
        const tlurl = 'statuses/home_timeline';
        const params = {count: 200};
        this.twitter.get(tlurl, params, (error, tweets, response) => {
          if (error) return;
          tweets = tweets.map(t => this._parseTweet(t));
          callback(tweets);
          console.log('tweet history get');
        });
      }
    }
  }
  _applyMessage(message) {
    for (const func of this._gotMessageFunctions) func(message)
  }
  static toMessage(icon_url, channel, name, text) {
    return {
      icon_url: icon_url, channel: channel, name: name, text: text
    }
  }
}
