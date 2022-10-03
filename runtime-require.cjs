const os = require("node:os");
const path = require("node:path");

const is_win = os.platform() === "win32";
const cwd = path.dirname(process.execPath);

/**
 * @param {string} id
 */
function runtime_require(id) {
  return require(
    is_win && !cwd.includes("node_modules")
      ? path.join(cwd, "node_modules", id)
      : id
  );
}

module.exports = runtime_require;
