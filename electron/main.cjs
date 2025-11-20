const { app, BrowserWindow } = require('electron');
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1080,
    height: 1920,
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  const devUrl = process.env.ELECTRON_DEV_URL || 'http://localhost:3000/';
  if (process.env.ELECTRON_DEV_URL) {
    win.loadURL(devUrl);
  } else {
    const filePath = path.join(__dirname, '../dist/index.html');
    win.loadFile(filePath);
  }
};

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});