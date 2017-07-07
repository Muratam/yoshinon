'use strict';
const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const {sleep} = require('sleep-async')();
exports.BaseWindow = class {
  constructor(htmlPath = '') {
    this.app = app;
    this.app.parent = this;
    this.app.on('ready', () => {this.create()});
    this.app.on('activate', () => {
      if (this.window === null) this.create();
    });
    this.app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') this.app.quit();
    });
    this.htmlPath = htmlPath;
  }
  create() {
    const {screen} = require('electron');
    this.screen = screen;
    this.window = this.onCreate();
    this.window.on('closed', () => {this.window = null});
  }
  onCreate() {
    return new BrowserWindow({width: 400, height: 300});
  }
}

exports.BaseBrowserWindow = class BaseBrowserWindow extends BrowserWindow {
  constructor(options = {}) {
    const defaults = {
      show: false,
      alwaysOnTop: true,
      frame: false,
      movable: false,
      resizable: false,
      // hasShadow: false,
    };
    // overwrite if not exists
    for (const k in defaults) {
      if (!(k in options)) options[k] = defaults[k];
    }
    super(options);
    // super.setIgnoreMouseEvents(true);
    // super.maximize();
    super.once('ready-to-show', () => {super.show()});
  }
  loadFile(filepath) {
    this.loadURL(url.format({
      pathname: path.join(__dirname, filepath),
      protocol: 'file:',
      slashes: true
    }));
  }
  moveToRightBottom() {
    const {screen} = require('electron');
    const size = screen.getPrimaryDisplay().size;
    const [width, height] = this.getSize();
    const x = size.width - width;
    const y = size.height - height;
    this.setPosition(x, y, true);
  }
  createChild(
      options = {},      // FIXME: options will be overwrite !!
      direction = 'up',  // up,down,left,right
      relX = 1.0, relY = 1.0, relWidth = 1.0, relHeight = 1.0) {
    const [x, y] = this.getPosition();
    const [width, height] = this.getSize();
    options.x = x;
    options.y = y;
    options.width = width;
    options.height = height;
    const child = new BaseBrowserWindow(options);
    child.once('ready-to-show', () => {
      let newX = Math.floor(relX * x);
      let newY = Math.floor(relY * y);
      const newWidth = Math.floor(relWidth * width);
      const newHeight = Math.floor(relHeight * height);
      const directions = {
        'up': [0, -newHeight],
        'down': [0, newHeight],
        'left': [-newWidth, 0],
        'right': [newWidth, 0],
      };
      if (direction in directions) {
        newX += directions[direction][0];
        newY += directions[direction][1];
      }
      child.setBounds(
          {x: newX, y: newY, width: newWidth, height: newHeight}, true);
      child.setParentWindow(this);
    });
    return child;
  }
}