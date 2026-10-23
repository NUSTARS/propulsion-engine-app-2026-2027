// main.js
//
// main processes

const { app, BrowserWindow, ipcMain, dialog, ipcRenderer, webContents } = require('electron');
const path = require('node:path')
const fs = require('node:fs')
const { SerialPort } = require('serialport')
const { ByteLengthParser } = require('@serialport/parser-byte-length')
const { PacketLengthParser } = require('@serialport/parser-packet-length')

const sequenceFilesFolderName = "created_sequences";

let mainWindow;
let sp;
let parser;


const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  webPreferences: {
		sandbox: false,
		preload: path.join(__dirname, 'preload.js')
	}
  });

  mainWindow.loadFile('setup_renderer.html');

  mainWindow.openDevTools();
}


// opening the app
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
})

// closing the app
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


// Serial port initialization
ipcMain.on('serial-path', (_event, path) => {
	if (path !== 'none' && !sp) {
		sp = new SerialPort({path: path, baudRate: 9600, autoOpen: false, dataBits: 8, parityBits: 'none', stopBits: 1});
    mainWindow.loadFile('setup_renderer.html');
	}
	else {
		// this should never run
		console.log("ERROR: Invaild serialport configuration.");
	}
});


// handle sending bytes when we get the message
ipcMain.on('control-byte', (_event, controlByte) => {
	console.log(controlByte);
  sp.write(Buffer.from([controlByte]));
})


// Switch which page is being shown
ipcMain.on('load-main', (_event, newPage) => {
  mainWindow.loadFile(newPage);
});



ipcMain.on('save-sequence', (_event, sequenceArray, filename) => {
  jsonData = JSON.stringify(sequenceArray);
  if (!fs.existsSync(sequenceFilesFolderName)) {
    fs.mkdirSync(sequenceFilesFolderName);
  }
  fs.writeFile(sequenceFilesFolderName + "/" + filename, jsonData, function(err) {
    if (err) {
      console.log(err);
      mainWindow.webContents.send('save-sequence-response', false, err);
    } else {
      mainWindow.webContents.send('save-sequence-response', true, err);
    }
  })
});
