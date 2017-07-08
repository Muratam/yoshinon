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
      hasShadow: false,
      transparent: true,
    };
    // overwrite if not exists
    for (const k in defaults) {
      if (!(k in options)) options[k] = defaults[k];
    }
    super(options);
    // super.setIgnoreMouseEvents(true);
    // super.maximize();
    super.once('ready-to-show', () => {super.show()});
    const {screen} = require('electron');
    this.screenSize = screen.getPrimaryDisplay().size;
  }
  loadFile(filepath) {
    this.loadURL(url.format({
      pathname: path.join(__dirname, filepath),
      protocol: 'file:',
      slashes: true
    }));
  }
  moveToRightBottom() {
    const [width, height] = this.getSize();
    const x = this.screenSize.width - width;
    const y = this.screenSize.height - height;
    this.setPosition(x, y, true);
  }
  setPosition(x, y, animate = true) {
    const [width, height] = this.getSize();
    x = Math.min(this.screenSize.width - width, x);
    y = Math.min(this.screenSize.height - height, y);
    super.setPosition(x, y, animate);
  }
  setBounds(bounds, animate = true) {
    const {x, y, width, height} = bounds;
    bounds.x = Math.min(this.screenSize.width - width, x);
    bounds.y = Math.min(this.screenSize.height - height, y);
    super.setBounds(bounds, animate);
  }
  createChild(
      options = {},      // FIXME: options will be overwrite !!
      direction = 'up',  // up,down,left,right
      relX = 1.0, relY = 1.0, relWidth = 1.0, relHeight = 1.0) {
    const [x, y] = this.getPosition();
    const [width, height] = this.getSize();
    const newWidth = Math.floor(relWidth * width);
    const newHeight = Math.floor(relHeight * height);
    options.x = x;
    options.y = y;
    options.width = 1;
    options.height = 1;
    const child = new BaseBrowserWindow(options);
    let newX = x + Math.floor(relX * width) - width;
    let newY = y + Math.floor(relY * height) - height;
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
    child.bounds = {x: newX, y: newY, width: newWidth, height: newHeight};
    child.once('ready-to-show', () => {
      child.setBounds(child.bounds, true);
      child.setParentWindow(this);
    });
    return child;
  }
}

exports.uncomment = (func) => func.toString().match(/\/\*([^]*)\*\//)[1];
// uncomment(()=>{/* hoge */}) => "hoge"
