const fs   = require("node:fs");
const path = require("node:path");

const file = path.join(path.dirname(require.resolve("zx")), "core.js");

const bad_code
  = `
try {
    defaults.shell = which.sync('bash');
    defaults.prefix = 'set -euo pipefail;';
    defaults.quote = quote;
}
catch (err) {
    if (process.platform == 'win32') {
        defaults.shell = which.sync('powershell.exe');
        defaults.quote = quotePowerShell;
    }
}
 `.trim();

const good_code
  = `
 if (process.platform === 'win32') {
  defaults.shell = which.sync('powershell.exe');
  defaults.quote = quotePowerShell;
} else {
  defaults.shell = which.sync('bash');
  defaults.prefix = 'set -euo pipefail;';
  defaults.quote = quote;
}
`;

const core = String(fs.readFileSync(file));
fs.writeFileSync(file, core.replace(bad_code, good_code), { encoding: "utf8" });
