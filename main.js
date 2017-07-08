'use strict';
const {BaseWindow, BaseBrowserWindow} = require('./base_window');
const {ipcMain} = require('electron');
const {Bot} = require('./bot');
class MainWindow extends BaseWindow {
  changeToDefaultVoice() {
    this._changeToDefualtVoiceIndex = this._changeToDefualtVoiceIndex + 1 || 0;
    const text = `お昼でしてー。食はおのれを形作る大切な力ですよー
      夜遅くまで精が出ますねー、わたくしもご一緒しましょうかー
      光に満ちているのでしてーLIVEに行くのが吉でしょうー
      ちひろさんが呼んでおられるのでしてーお早くーお早くー
      隣人と手をとりてー、さすれば輪を広げられるでしょうー
      いべんと…？魂を感じますー。行ってみたいのでしてー
      こころのこもった贈り物ならばー開けて確かめるがよいでしょうー
      ふーむ…何かにとらわれている様子…これは悪しき気…(
      ${this._changeToDefualtVoiceIndex})`
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
      // voice.webContents.openDevTools();
      voice.blur();  // FIXME: dont work
      this.changeToDefaultVoice();
      this.changeToDefaultVoice();
      this.changeToDefaultVoice();
    });

    this.bot = new Bot();
    this.bot.gotMessage((data) => {
      console.log(data);
      voice.webContents.send('media-voice', JSON.stringify(data));
    });

    voice.hided = false;
    ipcMain.on('clicked', (event, msg) => {
      if (voice.hided) {
        voice.show();
      } else {
        voice.hide();
      }
      voice.hided = !voice.hided;
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

let mainWindow = new MainWindow();
// TODO: channel_history展開 /tweet home展開
// TODO: RT: ...
// TODO: chennel_rep / tweet_hear
// TODO: 時間経過で背景透過度自然減衰
// TODO: ニコニコ風字幕一気に情報取得
// TODO: iTunes置き換え(再生速度とかしたい)
// TODO: python/ruby/nodejs統合インターフェイス
// TODO: 数学ノートインターフェース

// You can also put them in separate files and require them here.
