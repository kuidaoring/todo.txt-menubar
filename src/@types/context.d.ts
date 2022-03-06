export interface ElectronApi {
  setTaskCount: (todoCount: number, doneCount: number) => void;
  save: (content: string) => void;
  archive: (content: string) => boolean;
  on: (channel: string, callback) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronApi;
  }
}
