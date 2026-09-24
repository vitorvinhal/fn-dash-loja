// scripts/bump-version.js
// Auto-increments patch version on each build
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const versionFile = path.join(__dirname, "../src/lib/version.ts");
const content = fs.readFileSync(versionFile, "utf-8");

const match = content.match(/APP_VERSION = "(\d+)\.(\d+)\.(\d+)"/);
if (!match) { console.log("Could not parse version, skipping bump"); process.exit(0); }

const [, major, minor, patch] = match.map(Number);
const newPatch = patch + 1;
const newVersion = `${major}.${minor}.${newPatch}`;
const today = new Date().toISOString().split("T")[0];

const updated = content
  .replace(/APP_VERSION = "[^"]+"/, `APP_VERSION = "${newVersion}"`)
  .replace(/APP_UPDATED_AT = "[^"]+"/, `APP_UPDATED_AT = "${today}"`);

fs.writeFileSync(versionFile, updated);
console.log(`Version bumped: ${major}.${minor}.${patch} → ${newVersion}`);
