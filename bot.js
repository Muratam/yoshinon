const SlackBot = require('slackbots');
const fs = require('fs');
const Twitter = require('twitter');

exports.Bot = class {
  getSlackUser(id) {
    if (!('users' in this)) {
      this.users = this.slack.getUsers()._value.members;
    }
    for (const user of this.users) {
      if (user.id == id) {
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
      if (channel.id == id) {
        return '#' + channel.name;
      }
    }
    return '';
  }
  constructor() {
    const [slack_token, c_k, c_s, a_k, a_s] =
        fs.readFileSync('TOKEN', 'utf-8').split('\n');
    this.slack = new SlackBot({token: slack_token});
    this.slack.on('message', (data) => {
      if (data.type == 'message') {
        const [name, icon_url] = this.getSlackUser(data.user);
        const channel = this.getSlackChannel(data.channel);
        if (channel === '' || name === '') return;
        if ('text' in data) {
          this._applyMessage(icon_url, channel, name, data.text);
        }
      }
    });
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
    this._gotMessageFunctions = [];
  }
  gotMessage(func) {
    this._gotMessageFunctions += func;
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
