const { app, nativeTheme, BrowserWindow, Tray } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");

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

  tray = new Tray(getIconPath());
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
});
