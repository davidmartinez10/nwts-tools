import child_process from "child_process";
import os from "os";
import path from "path";

export function proper_spawn(command: string, cwd = process.cwd(),
                             shell = os.platform() === "win32" ? "powershell"
                                                               : "bash") {
  console.log(`\n$ \x1b[33m${command}\x1b[0m\n`);

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

  const p
    = new Promise(function(resolve, reject) { child.on("close", resolve); }) as
        Promise<void>
      & { kill(): Boolean };

  p.kill = function() {
    if (! child.kill()) {
      if (child.pid) { return process.kill(child.pid); }
    }
    return true;
  };

  return p;
}

export function escape_path(...paths: string[]) {
  return path.join(...paths.map(function callbackfn(value) {
    return value.split(path.sep)
      .map(function callbackfn(
        v) { return v.includes(" ") ? JSON.stringify(v) : v; })
      .join(path.sep);
  }));
}
