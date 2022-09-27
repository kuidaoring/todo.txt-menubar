require("dotenv").config();
const { notarize } = require("electron-notarize");

exports.default = async function notarizeApp(context) {
  await notarize({
    tool: process.env.CI === "true" ? "notarytool" : "legacy",
    appBundleId: "com.gihub.kuidaoring.todotxt-menubar",
    ascProvider: process.env.TEAM_ID, // for legacy
    teamId: process.env.TEAM_ID, // for notarytool
    appPath: "dist/mac/todo.txt-menubar.app",
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASS,
  });
};
