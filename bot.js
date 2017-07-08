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
      const parseds = [];
      for (let message of history.messages) {
        message.channel = id;
        const parsed = this._parseSlackMessage(message);
        if (parsed) {
          const [icon_url, channel, name, text] = parsed;
          parseds.push(Bot.toMessage(icon_url, channel, name, text));
        }
      }
      callback(parseds);
    });
  }
  _parseSlackMessage(data) {
    if (data.type == 'message') {
      const [name, icon_url] = this.getSlackUser(data.user);
      const channel = this.getSlackChannel(data.channel);
      if (channel === '' || name === '' || !('text' in data)) return false;
      return [icon_url, channel, name, data.text];
    }
  }
  constructor() {
    this._gotMessageFunctions = [];
    const [slack_token, c_k, c_s, a_k, a_s] =
        fs.readFileSync('TOKEN', 'utf-8').split('\n');
    this.slack_token = slack_token;
    this.slack = new SlackBot({token: this.slack_token});
    this.slack.on('message', (data) => {
      const parsed = this._parseSlackMessage(data);
      if (parsed) {
        const [icon_url, channel, name, text] = parsed;
        this._applyMessage(icon_url, channel, name, text);
      }
    });
    /*
    this.twitter = new Twitter({
      consumer_key: c_k,
      consumer_secret: c_s,
      access_token_key: a_k,
      access_token_secret: a_s
    });
    this.twitter.stream('user', (stream) => {
      stream.on('data', (tweet) => {
        const screen_name = tweet.user.screen_name;
        this._applyMessage(
            tweet.user.profile_image_url_https, ':twitter:', tweet.user.name,
            tweet.text);
      });
      // stream.on('error', (e) => {console.log(e)});
    });
    */
  }
  gotMessage(func) {
    this._gotMessageFunctions.push(func);
  }
  traceHistory(type = 'slack', channel = '', once = false, callback) {
    this.traced = this.traced || {slack: {}};
    if (type == 'slack') {
      if (channel.startsWith('#')) channel = this.getSlackChannelID(channel);
      if (once && this.traced.slack[channel]) return;
      this.getSlackChannelHistory(channel, (hists) => {
        if (hists === []) return;
        callback(hists);
        console.log(`channel ${channel} history got`);
        this.traced.slack[channel] = true;
      });
    } else if (type == 'twitter') {
    }
  }
  _applyMessage(icon_url, channel, name, text) {
    for (const func of this._gotMessageFunctions) {
      func(Bot.toMessage(icon_url, channel, name, text));
    }
  }
  static toMessage(icon_url, channel, name, text) {
    return {
      icon_url: icon_url, channel: channel, name: name, text: text
    }
  }
}
