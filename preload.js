// preload.js
//
// bridge between main process and renderer

const { contextBridge, ipcRenderer } = require('electron');
const { SerialPort } = require('serialport');

contextBridge.exposeInMainWorld('electronAPI', {
    // Send to main.js
    getSerialPorts: () => SerialPort.list(),
    sendSerialPath: (serialPath) => ipcRenderer.send('serial-path', serialPath),
	sendLoadMain: (newPage) => ipcRenderer.send('load-main', newPage),
    saveSequence: (sequenceArray, filename) => ipcRenderer.send('save-sequence', sequenceArray, filename),
    // Send from main.js
    saveSequenceResponse: (callback) => ipcRenderer.on('save-sequence-response', (_event, success, err) => callback(success, err)),
    // Bidirectional -> main.js ->
    allSequenceFiles: () => ipcRenderer.invoke('dialog:allSequenceFiles'),
    sequenceFileContents: async (filename) => {
        return await ipcRenderer.invoke('sequenceFileContents', filename);
    },
});