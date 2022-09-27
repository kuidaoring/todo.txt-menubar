require("dotenv").config();
const { notarize } = require("electron-notarize");

exports.default = async function notarizeApp(context) {
  await notarize({
    tool: "notarytool",
    appPath: `${context.appOutDir}/${context.packager.appInfo.productFileName}`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: process.env.TEAM_ID,
  });
};
