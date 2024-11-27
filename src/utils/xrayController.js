import path, { dirname } from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';

let xrayProcess;

const currentDir = dirname(fileURLToPath(import.meta.url));

// Function to start the Xray process
function startXray(mainWindow) {
  const xrayPath = path.resolve(currentDir, '../xray/xray.exe');  // Adjust path here
  const configPath = path.resolve(currentDir, '../config.json');

  // Debugging: log the paths
  console.log("Resolved xrayPath:", path.resolve(xrayPath));  // Log the full resolved path

  // Verify that xray.exe exists
  fs.access(xrayPath, fs.constants.F_OK, (err) => {
    if (err) {
      mainWindow.webContents.send('xray-not-found', err.message.toString());
      return; // Exit if file doesn't exist
    }
    console.log(`xray.exe found at path: ${xrayPath}`);

    console.log("Starting Xray VPN...");

    // Use spawn to start the process
    xrayProcess = spawn(xrayPath, ['run', '--config', configPath]);

    xrayProcess.stdout.on('data', (data) => {
      mainWindow.webContents.send('xray-output', data.toString());
      console.log(`Xray output: ${data.toString()}`);
    });

    xrayProcess.stderr.on('data', (data) => {
      mainWindow.webContents.send('xray-output-error', data.toString()); // Working fine
    });

    xrayProcess.on('exit', (code) => {
      // Handle exit conditions
      mainWindow.webContents.send('xray-exit', code ? code.toString() : "");
      xrayProcess = null; // Clean up the reference
    });

    xrayProcess.on('error', (err) => {
      mainWindow.webContents.send('xray-error', err.message.toString());
    });
  });
}

// Function to stop the Xray process
function stopXray() {
  if (xrayProcess) {
    console.log("Stopping Xray VPN...");
    xrayProcess.kill('SIGINT');
    xrayProcess = null;
  }
}

export {
  startXray,
  stopXray
}