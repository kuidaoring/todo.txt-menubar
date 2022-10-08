import {
  app,
  nativeTheme,
  BrowserWindow,
  Tray,
  ipcMain,
  globalShortcut,
  shell,
} from "electron";
import path from "path";
import fs from "fs/promises";
import Store from "electron-store";
import { Config, defaults } from "./config";

const darkModeIcon = path.join(
  __dirname,
  "../../asset/outline_checklist_white_24dp.png"
);
const lightModeIcon = path.join(
  __dirname,
  "../../asset/outline_checklist_black_24dp.png"
);
const getIconPath = () => {
  return nativeTheme.shouldUseDarkColors ? darkModeIcon : lightModeIcon;
};

const main = async () => {
  await app.whenReady();

  app.dock.hide();

  const store = new Store<Config>({ defaults: defaults });
  const config: Config = {
    file: store.get("file"),
    window: store.get("window"),
    editor: store.get("editor"),
  };

  let content: string;
  let loadSuccess = true;
  try {
    content = await fs.readFile(config.file.todoTxtPath, "utf-8");
  } catch (err) {
    content = "";
    loadSuccess = false;
  }

  const mainWindow = new BrowserWindow({
    width: config.window.width,
    height: config.window.height,
    vibrancy: "under-window",
    visualEffectState: "active",
    frame: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadURL(
    app.isPackaged
      ? `file://${path.join(__dirname, "../index.html")}`
      : "http://localhost:3000"
  );

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send(
      "did-finish-load-todotxt-file",
      content,
      loadSuccess
    );
  });

  mainWindow.webContents.on("will-navigate", (e, url) => {
    shell.openExternal(url);
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  mainWindow.on("blur", () => {
    mainWindow.hide();
  });

  const tray = new Tray(getIconPath());
  const { x, y } = tray.getBounds();
  mainWindow.setBounds({ x: x, y: y });
  const showOrHideWindow = () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
      return;
    }
    mainWindow.setVisibleOnAllWorkspaces(true);
    mainWindow.show();
    mainWindow.setVisibleOnAllWorkspaces(false);
  };
  tray.on("click", showOrHideWindow);
  globalShortcut.register("CommandOrControl+Shift+T", showOrHideWindow);

  nativeTheme.on("updated", () => tray.setImage(getIconPath()));

  ipcMain.handle("get-editor-config", () => {
    return config.editor;
  });

  ipcMain.on("set-task-count", (event, todoCount, doneCount) => {
    tray.setTitle(`📝 ${todoCount} / ✅ ${doneCount}`);
  });
  ipcMain.on("save", async (event, content) => {
    try {
      await fs.writeFile(config.file.todoTxtPath, content);
      event.reply("save-success-reply");
    } catch (err) {
      console.log(`save failed: ${err}`);
      event.reply("save-failed-reply", err);
    }
  });
  ipcMain.on("archive", async (event, content) => {
    try {
      await fs.appendFile(config.file.doneTxtPath, `${content}\n`);
      event.returnValue = true;
    } catch (err) {
      console.log(`archive failed: ${err}`);
      event.returnValue = false;
    }
  });
};

app.on("web-contents-created", (event, contents) => {
  // disable window open
  contents.setWindowOpenHandler(({ url }) => {
    return { action: "deny" };
  });
  // disable navigation
  contents.on("will-navigate", (event, url) => {
    event.preventDefault();
  });
});

main();
