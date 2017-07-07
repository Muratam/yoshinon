'use strict';
const {BaseWindow, BaseBrowserWindow} = require('./base_window');
const {sleep} = require('sleep-async')();
const uncomment = (func) => func.toString().match(/\/\*([^]*)\*\//)[1];
// uncomment(()=>{/* hoge */}) => hoge
class MainWindow extends BaseWindow {
  onCreate() {
    const size = this.screen.getPrimaryDisplay().size;
    const window = new BaseBrowserWindow({
      width: Math.floor(size.width * 0.3),
      height: size.width / 20,
      transparent: true,
    });
    window.loadFile('yoshinon.html');
    window.once('ready-to-show', () => {
      window.moveToRightBottom();
      const child =
          window.createChild({transparent: false}, 'up', 1.0, 1.0, 1.0, 4.0);
      child.loadFile('index.html');
      child.once('ready-to-show', () => {
        child.webContents.send('document.write', `
          <h1> hoge </h1>
        `);
      });
    });
    return window;
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
