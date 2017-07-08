'use strict';
const {BaseWindow, BaseBrowserWindow} = require('./base_window');
const {sleep} = require('sleep-async')();
const fs = require('fs');
const {ipcMain} = require('electron');
const Twitter = require('twitter');
class MainWindow extends BaseWindow {
  changeToDefaultVoice() {
    sleep(3000, () => {
      this.voice.webContents.send('media-voice', JSON.stringify([
        './yoshinon.png', '#接続完了でしてー',
        `お昼でしてー。食はおのれを形作る大切な力ですよー
        夜遅くまで精が出ますねー、わたくしもご一緒しましょうかー
        光に満ちているのでしてーLIVEに行くのが吉でしょうー
        ちひろさんが呼んでおられるのでしてーお早くーお早くー
        隣人と手をとりてー、さすれば輪を広げられるでしょうー
        いべんと…？魂を感じますー。行ってみたいのでしてー
        こころのこもった贈り物ならばー開けて確かめるがよいでしょうー
        ふーむ…何かにとらわれている様子…これは悪しき気…
        `.replace(/\n/g, '\n')
      ]));
    });
  }
  createVoice() {
    const voice = this.yoshinon.createChild(
        {transparent: true, alwaysOnTop: false}, 'left', 1.3, 1.5, 2.5, 0.5);
    voice.loadFile('html/voice.html');
    voice.once('ready-to-show', () => {
      voice.webContents.send('show');
      voice.on('focus', () => {
        if (voice.hided) return;
        voice.setBounds({
          x: voice.bounds.x,
          y: voice.screenSize.height / 4,
          width: voice.bounds.width,
          height: voice.screenSize.height / 4 * 3,
        });
      });
      voice.on('blur', () => {
        voice.setBounds(voice.bounds);
      });
      voice.blur();  // FIXME: dont work
      this.changeToDefaultVoice();
    });
    const bot = new Bot();
    bot.gotMessage = (data) => {
      console.log(data);
      voice.webContents.send('media-voice', JSON.stringify(data));
    };
    voice.hided = false;
    this.voice = voice;
    this.bot = bot;
  }

  onCreate() {
    const size = this.screen.getPrimaryDisplay().size;
    this.yoshinon = new BaseBrowserWindow({
      width: size.width / 10,
      height: size.width / 10,
      transparent: true,
    });
    this.yoshinon.loadFile('html/yoshinon.html');
    this.yoshinon.once('ready-to-show', () => {
      this.yoshinon.moveToRightBottom();
      this.createVoice();
    });
    ipcMain.on('clicked', (event, msg) => {
      if (this.voice.hided) {
        this.voice.show();
      } else {
        this.voice.hide();
      }
      this.voice.hided = !this.voice.hided;
    });
    return this.yoshinon;
  }
}
class Bot {
  getUser(id) {
    if (!('users' in this)) {
      this.users = this.bot.getUsers()._value.members;
    }
    for (const user of this.users) {
      if (user.id == id) {
        return [user.name, user.profile.image_48];
      }
    }
    return ['', './yoshinon.png'];
  }
  getChannel(id) {
    if (!('channels' in this)) {
      this.channels = this.bot.getChannels()._value.channels;
    }
    for (const channel of this.channels) {
      if (channel.id == id) {
        return '#' + channel.name;
      }
    }
    return '';
  }
  constructor() {
    const SlackBot = require('slackbots');
    const [slack_token, c_k, c_s, a_k, a_s] =
        fs.readFileSync('TOKEN', 'utf-8').split('\n');
    this.bot = new SlackBot({token: slack_token});
    this.bot.on('message', (data) => {
      if (data.type == 'message') {
        const [name, icon_url] = this.getUser(data.user);
        const channel = this.getChannel(data.channel);
        if (channel === '' || name === '') return;
        if ('text' in data)
          this.gotMessage([icon_url, name + ' ' + channel, data.text]);
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
        const icon_url = tweet.user.profile_image_url_https;
        const name = tweet.user.name;
        const screen_name = tweet.user.screen_name;
        const text = tweet.text;
        this.gotMessage([icon_url, name, text]);
      });
      // stream.on('error', (e) => {console.log(e)});
    });
    this.gotMessage = (data) => {};
  }
}

let mainWindow = new MainWindow();
// TODO: channel_history展開 /tweet home展開
// TODO: chennel_rep / tweet_hear
// TODO: 時間経過で背景透過度自然減衰
// TODO: ニコニコ風字幕一気に情報取得
// TODO: iTunes置き換え(再生速度とかしたい)
// TODO: python/ruby/nodejs統合インターフェイス
// TODO: 数学ノートインターフェース

// You can also put them in separate files and require them here.
