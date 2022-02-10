const { app, BrowserWindow, Tray } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");

let mainWindow;
let tray;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
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
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  mainWindow.on("blur", () => {
    mainWindow.hide();
  });

  tray = new Tray(
    path.join(__dirname, "../asset/outline_checklist_white_24dp.png")
  );
  tray.on("click", () => {
    mainWindow.setVisibleOnAllWorkspaces(true);
    mainWindow.show();
    mainWindow.setVisibleOnAllWorkspaces(false);
  });
});
