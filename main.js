'use strict';
const {BaseWindow, BaseBrowserWindow} = require('./base_window');
const {ipcMain} = require('electron');
const {Bot} = require('./bot');
const {sleep} = require('sleep-async')();
const readline = require('readline');


class MainWindow extends BaseWindow {
  constructor(connectBot = true) {
    super();
    this.connectBot = connectBot;
    ipcMain.on('console.log', (evt, msg) => {console.log(JSON.parse(msg))});
    readline.createInterface({input: process.stdin, output: process.stdout})
        .on('line', (input) => {
          if (input.startsWith('t ') && input.length > 2) {
            this.bot.tweet(input.slice(2));
          } else if (input === 't') {
            this.bot.traceHistory(':twitter:', false, (hists) => {
              this.voice.webContents.send(
                  'update-channel-history',
                  JSON.stringify([':twitter:', hists]));
            });
          } else if (input.startsWith('# ')) {
            this.bot.slackPost(input.slice(2));
          } else if (input === '#') {
            console.log(this.bot.slackCurrentChannel);
          } else if (input.startsWith('#')) {
            const channel = input.split(' ')[0];
            const text = input.split(' ').slice(1).join(' ');
            this.bot.slackPost(text, channel);
          } else {
            console.log(`no : ${input}`);
          }
        });
  }
  changeToDefaultVoice() {
    this._changeToDefualtVoiceIndex = this._changeToDefualtVoiceIndex + 1 || 0;
    const text = `お昼でしてー。
      (${this._changeToDefualtVoiceIndex})`
                     .replace(/\n/g, '\n');
    const message = JSON.stringify(
        Bot.toMessage('./yoshinon.png', ':play:', 'よしのん', text));
    this.voice.webContents.send('media-voice', message);
  }
  createVoice() {
    const voice = this.yoshinon.createChild({}, 'left', 1.3, 1.5, 2.5, 0.5);
    voice.loadFile('html/voice.html');
    voice.once('ready-to-show', () => {
      voice.webContents.send('show');
      voice.on('focus', () => {
        voice.setBounds({
          x: voice.bounds.x,
          y: voice.screenSize.height / 4,
          width: voice.bounds.width,
          height: voice.screenSize.height / 4 * 3,
        });
        voice.webContents.send('focus', '');
      });
      voice.on('blur', () => {
        voice.setBounds(voice.bounds);
        voice.webContents.send('blur', '');
      });
      this.changeToDefaultVoice();
    });
    if (this.connectBot) {
      this.bot = new Bot();
      this.bot.gotMessage((data) => {
        // console.log(data);
        voice.webContents.send('media-voice', JSON.stringify(data));
        this.bot.traceHistory(data.channel, true, (hists) => {
          const channel = hists[0].channel;
          // hists = hists.slice(1);
          voice.webContents.send(
              'update-channel-history', JSON.stringify([channel, hists]));
        });
      });
    }
    ipcMain.on('clicked', (event, msg) => {
      this.voice.webContents.send('toggle');
    });
    this.voice = voice;
    return voice;
  }
  createYoshinon() {
    const size = this.screen.getPrimaryDisplay().size;
    const yoshinon = new BaseBrowserWindow({
      width: size.width / 10,
      height: size.width / 10,
    });
    yoshinon.loadFile('html/yoshinon.html');
    yoshinon.once('ready-to-show', () => {
      yoshinon.moveToRightBottom();
      this.createVoice();
    });
    this.yoshinon = yoshinon;
    return yoshinon;
  }
  onCreate() {
    return this.createYoshinon();
  }
}
let mainWindow = new MainWindow(true);

// TODO: ニコニコ風字幕一気に情報取得 (for demonstrations)
// TODO: 数学ノートインターフェース

// You can also put them in separate files and require them here.
