const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  setTaskCount: (todoCount, doneCount) => {
    ipcRenderer.send("set-task-count", todoCount, doneCount);
  },
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, argv) => callback(event, argv));
  },
});
