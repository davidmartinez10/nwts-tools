import os from "./node/os";
import path from "./node/path";

const is_win = os.platform() === "win32";
const cwd = path.dirname(process.execPath);

export function runtime_require<T>(id: string) {
  return require(
    is_win && !cwd.includes("node_modules")
      ? path.join(cwd, "node_modules", id)
      : id
  ) as T;
}
