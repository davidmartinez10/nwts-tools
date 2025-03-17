import child_process from "child_process";
import os from "os";
import path from "path";

export function proper_spawn(command: string, cwd = process.cwd(),
                             shell = os.platform() === "win32" ? "powershell"
                                                               : "bash") {
  const [cmd, ...args] = command.replaceAll("\\ ", "\n").split(" ");
  const child
    = child_process.spawn(cmd,
                          args.map(function callbackfn(
                            value) { return value.replaceAll("\n", " "); }),
                          {
                            shell,
                            cwd,
                            env: process.env,
                            stdio: "inherit",
                          });
  return new Promise(function(resolve, reject) { child.on("close", resolve); });
}

export function escape_path(...paths: string[]) {
  return path.join(...paths.map(function callbackfn(value) {
    return value.split(path.sep)
      .map(function callbackfn(
        v) { return v.includes(" ") ? JSON.stringify(v) : v; })
      .join(path.sep);
  }));
}
