// preload.js
//
// bridge between main process and renderer

const { contextBridge, ipcRenderer } = require('electron');
const { SerialPort } = require('serialport');

contextBridge.exposeInMainWorld('electronAPI', {
    getSerialPorts: () => SerialPort.list(),
    sendSerialPath: (serialPath) => ipcRenderer.send('serial-path', serialPath),
	sendLoadMain: (newPage) => ipcRenderer.send('load-main', newPage),
    saveSequence: (sequenceArray, filename) => ipcRenderer.send('save-sequence', sequenceArray, filename),
});