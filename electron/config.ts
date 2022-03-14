import path from "path";

const defaultTodoTxtPath = path.join(
  process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"] as string,
  "todo.txt"
);
const defaultDoneTxtPath = path.join(
  process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"] as string,
  "done.txt"
);

export type Config = {
  file: {
    todoTxtPath: string;
    doneTxtPath: string;
  };
  window: {
    width: number;
    height: number;
  };
  editor: EditorConfig;
};

export type EditorConfig = { lineWrapping: boolean };

export const defaults = {
  file: {
    todoTxtPath: defaultTodoTxtPath,
    doneTxtPath: defaultDoneTxtPath,
  },
  window: {
    width: 600,
    height: 300,
  },
  editor: {
    lineWrapping: true,
  },
};
