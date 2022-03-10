import { IpcRendererEvent } from "electron";

export interface ElectronApi {
  setTaskCount: (todoCount: number, doneCount: number) => void;
  save: (content: string) => void;
  archive: (content: string) => boolean;
  on: (channel: string, callback: (event: IpcRendererEvent, ...argv: any[]) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronApi;
  }
}
