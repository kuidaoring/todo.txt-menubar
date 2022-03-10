import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  setTaskCount: (todoCount: number, doneCount: number) => {
    ipcRenderer.send("set-task-count", todoCount, doneCount);
  },
  save: (content: string) => {
    ipcRenderer.send("save", content);
  },
  archive: (content: string) => {
    return ipcRenderer.sendSync("archive", content);
  },
  on: (channel: string, callback: (event: IpcRendererEvent, ...argv: any[]) => void) => {
    ipcRenderer.on(channel, (event, argv) => callback(event, argv));
  },
});
