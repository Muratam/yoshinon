'use strict';
const electron = require('electron');
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
    this.window = new electron.BrowserWindow({
      width: 300,
      height: 200,
      transparent: true,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
    });
    this.window.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }));
    // this.window.webContents.openDevTools();
    this.window.on('closed', () => { this.window = null; });
  }
}
let window = new Window(electron.app);

// You can also put them in separate files and require them here.
