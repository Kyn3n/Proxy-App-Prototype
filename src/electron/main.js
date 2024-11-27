import { app, BrowserWindow, ipcMain, clipboard } from 'electron';
import path from 'path';
import { isDev } from './util.js';
import { startXray, stopXray } from '../utils/xrayController.js'
import { processConfig, decodeSSLink, decodeTrolessLink, decodeVmessLink, checkOutbounds } from '../utils/processConfig.js';
import { startProxySettings, stopProxySettings } from '../utils/runPowershell.js';

let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1850,
        height: 1000,
        webPreferences: {
          preload: path.join(app.getAppPath(),'src/electron/preload.cjs'),
          contextIsolation: true,
          nodeIntegration: false
        }
    })

    if(isDev()) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
    }
}

ipcMain.handle('start-xray', async () => {
  if (!mainWindow && !mainWindow.webContents) {
    console.error("MainWindow is not initialized.");
    throw new Error("MainWindow is not available.");
  }
  
  startXray(mainWindow);
});

ipcMain.handle('stop-xray', () => {
  stopXray();
});

ipcMain.handle('clipboard:read', () => {
  return clipboard.readText();
});

ipcMain.handle('process-configuration', async (event, config) => {
  try {
    processConfig(config)
  } catch (error) {
    throw new Error(error.message)
  }
})

ipcMain.handle('decode-vmess', (event, link) => {
  return decodeVmessLink(link);
})

ipcMain.handle('decode-vless-trojan', (event, link) => {
  return decodeTrolessLink(link);
})

ipcMain.handle('decode-shadowsocks', (event, link) => {
  return decodeSSLink(link);
})

ipcMain.handle('check-outbounds', async (event, removeOutbound) => {
  try {
    checkOutbounds(removeOutbound); // This is your function
  } catch (error) {
    throw new Error(error.message); // Throw the error to be caught by the frontend
  }
});

ipcMain.handle('start-proxy', () => {
  try {
      startProxySettings();
  } catch (error) {
    throw new Error(error.message); // Throw the error to be caught by the frontend
  }
})

ipcMain.handle('stop-proxy', () => {
  try {
    stopProxySettings();
  } catch (error) {
    throw new Error(error.message); // Throw the error to be caught by the frontend
  }
})

app.whenReady().then(() => {
    createWindow()
   
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })


app.on('window-all-closed', () => {
  checkOutbounds(true)
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

