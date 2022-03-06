const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  setTaskCount: (todoCount, doneCount) => {
    ipcRenderer.send("set-task-count", todoCount, doneCount);
  },
  save: (content) => {
    ipcRenderer.send("save", content);
  },
  archive: (content) => {
    return ipcRenderer.sendSync("archive", content);
  },
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, argv) => callback(event, argv));
  },
});
