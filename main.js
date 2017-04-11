'use strict';
const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
class Window {
  constructor(app) {
    this.app = app;
    this.app.on('ready', this.create);
    this.app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') this.app.quit();
    });
    this.app.on('activate', () => {
      if (this.window === null) this.create();
    });
  }
  create() {
    // const Screen = require('screen');
    // console.log(screen.getPrimaryDisplay().workAreaSize());
    this.window = new BrowserWindow({
      width: 400,
      height: 300,
      transparent: true,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
    });
    // this.window.setIgnoreMouseEvents(true);
    this.window.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }));
    // this.window.webContents.openDevTools();
    this.window.on('closed', () => { this.window = null; });
    // console.log(electron.screen.getPrimaryDisplay().workAreaSize);
  }
}
let window = new Window(app);
// You can also put them in separate files and require them here.
