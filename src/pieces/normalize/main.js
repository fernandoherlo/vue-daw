'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const { byId } = require('../packages/pieces-alex-bainter');
const gain = require('./gain');

const RENDER_TIME = 60; //seconds

app.on('window-all-closed', e => e.preventDefault());

const getDecibels = pieceId =>
  new Promise(resolve => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
      },
    });
    win.loadFile('index.html');
    win.webContents.openDevTools();
    ipcMain.once('ready', event => {
      event.reply('begin', { pieceId, renderTime: RENDER_TIME });
    });
    ipcMain.once('complete', (event, maxDb) => {
      win.close();
      resolve(maxDb);
    });
  });

app.whenReady().then(() => {
  Object.keys(byId)
    .filter(pieceId => typeof gain[pieceId] !== 'number')
    .reduce(
      (resultPromise, pieceId) =>
        resultPromise.then(results =>
          getDecibels(pieceId).then(gain => {
            results[pieceId] = gain;
            console.log(results);
            return results;
          })
        ),
      Promise.resolve({})
    );
});
