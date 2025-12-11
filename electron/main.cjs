const { app, BrowserWindow } = require('electron');
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1080,
    height: 1920,
    fullscreen: false, // Mudado para facilitar debug
    autoHideMenuBar: false, // Mostrar menu para debug
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Abrir DevTools automaticamente em modo desenvolvimento
  if (process.env.ELECTRON_DEV_URL) {
    win.webContents.openDevTools();
  }

  const devUrl = process.env.ELECTRON_DEV_URL || 'http://localhost:3000/';
  console.log('Electron: Carregando URL:', devUrl);

  if (process.env.ELECTRON_DEV_URL) {
    win.loadURL(devUrl).catch(err => {
      console.error('Electron: Erro ao carregar URL:', err);
    });
  } else {
    const filePath = path.join(__dirname, '../dist/index.html');
    console.log('Electron: Carregando arquivo:', filePath);
    win.loadFile(filePath).catch(err => {
      console.error('Electron: Erro ao carregar arquivo:', err);
    });
  }

  // Log de erros da página
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Electron: Falha ao carregar:', errorCode, errorDescription);
  });

  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log('Renderer:', message);
  });
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