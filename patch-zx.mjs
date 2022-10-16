import fs from "node:fs";

const file = "./node_modules/zx/build/core.js";

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

const core = String(await fs.promises.readFile(file));

await fs.promises.writeFile(file, core.replace(bad_code, good_code),
                            { encoding: "utf8" });
