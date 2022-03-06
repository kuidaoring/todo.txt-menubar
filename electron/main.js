const { app, nativeTheme, BrowserWindow, Tray, ipcMain } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const fs = require("fs").promises;

const defaultTodoTxtPath = path.join(
  process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"],
  "todo.txt"
);
const defaultDoneTxtPath = path.join(
  process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"],
  "done.txt"
);
const darkModeIcon = path.join(
  __dirname,
  "../asset/outline_checklist_white_24dp.png"
);
const lightModeIcon = path.join(
  __dirname,
  "../asset/outline_checklist_black_24dp.png"
);
const getIconPath = () => {
  return nativeTheme.shouldUseDarkColors ? darkModeIcon : lightModeIcon;
};

const main = async () => {
  await app.whenReady();

  let content;
  let loadSuccess = true;
  try {
    content = await fs.readFile(defaultTodoTxtPath, "utf-8");
  } catch (err) {
    content = "";
    loadSuccess = false;
  }

  const mainWindow = new BrowserWindow({
    width: 600,
    height: 300,
    vibrancy: "under-window",
    visualEffectState: "active",
    frame: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../public/index.html")}`
  );

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send(
      "did-finish-load-todotxt-file",
      content,
      loadSuccess
    );
  });

  mainWindow.on("blur", () => {
    mainWindow.hide();
  });

  const tray = new Tray(getIconPath());
  const { x, y } = tray.getBounds();
  mainWindow.setBounds({ x: x, y: y });
  tray.on("click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
      return;
    }
    mainWindow.setVisibleOnAllWorkspaces(true);
    mainWindow.show();
    mainWindow.setVisibleOnAllWorkspaces(false);
  });

  nativeTheme.on("updated", () => tray.setImage(getIconPath()));

  ipcMain.on("set-task-count", (event, todoCount, doneCount) => {
    tray.setTitle(`📝 ${todoCount} / ✅ ${doneCount}`);
  });
  ipcMain.on("save", async (event, content) => {
    try {
      await fs.writeFile(defaultTodoTxtPath, content);
      event.reply("save-success-reply");
    } catch (err) {
      console.log(`save failed: ${err}`);
      event.reply("save-failed-reply", err);
    }
  });
  ipcMain.on("archive", async (event, content) => {
    try {
      await fs.appendFile(defaultDoneTxtPath, `${content}\n`);
      event.returnValue = true;
    } catch (err) {
      console.log(`archive failed: ${err}`);
      event.returnValue = false;
    }
  });
};

main();
