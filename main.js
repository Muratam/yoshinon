'use strict';
const {BaseWindow, BaseBrowserWindow} = require('./base_window');
const {sleep} = require('sleep-async')();
class MainWindow extends BaseWindow {
  onCreate() {
    const size = this.screen.getPrimaryDisplay().size;
    const yoshinon = new BaseBrowserWindow({
      width: size.width / 10,
      height: size.width / 10,
      transparent: true,
    });
    yoshinon.loadFile('html/yoshinon.html');
    yoshinon.once('ready-to-show', () => {
      yoshinon.moveToRightBottom();
      const voice = yoshinon.createChild(
          {transparent: false}, 'left', 1.3, 1.5, 2.5, 0.5);
      voice.loadFile('html/voice.html');
    });
    return yoshinon;
  }
}
let mainWindow = new MainWindow();

// TODO: 位置を調整
// TODO: ニコニコ風字幕
// TODO: slack & twitter ふわっと
// TODO: cat とかで twitter したい
// TODO: よしのんインターフェース
// TODO: iTunes置き換え(再生速度とか)
// TODO: python/ruby/nodejs統合インターフェイス
// TODO: 数学ノートインターフェース

// You can also put them in separate files and require them here.
