import {ChildProcess} from "child_process";
import child_process from "child_process";
import os from "os";
import path from "path";

export type ProperChildProcess
  = Promise<{stdout: string, stderr: string}>&{child: ChildProcess};

export function proper_exec(command: string, cwd = process.cwd(),
                            shell = os.platform() === "win32" ? "powershell"
                                                              : "bash") {

  const [cmd, ...args] = command.replaceAll("\\ ", "\n").split(" ");
  const basename       = cmd.match(/^.*?[\\/]([^\\/]+)$/)?.[1] || cmd;
  console.info(`$ \x1b[33m${basename} ${args.join(" ")}\x1b[0m`);


  const child
    = child_process.spawn(cmd,
                          args.map(function callbackfn(
                            value) { return value.replaceAll("\n", " "); }),
                          {
                            shell,
                            cwd,
                            env: process.env,
                            // [stdin, stdout, stderr, extra]
                            stdio: ["pipe", "pipe", "pipe"],
                          });


  let stdout = "";
  child.stdout?.on("data", function(chunk) { stdout += chunk.toString(); });

  let stderr = "";
  child.stderr?.on("data", function(chunk) { stderr += chunk.toString(); });

  const promise
    = new Promise<{ stdout: string, stderr: string }>(function(resolve,
                                                               reject) {
        child.on("close", (code) => { resolve({ stdout, stderr }); });
      }) as ProperChildProcess;

  promise.child = child;


  return promise;
}

export function proper_spawn(command: string, cwd = process.cwd(),
                             shell = os.platform() === "win32" ? "powershell"
                                                               : "bash") {

  const [cmd, ...args] = command.replaceAll("\\ ", "\n").split(" ");
  const basename       = cmd.match(/^.*?[\\/]([^\\/]+)$/)?.[1] || cmd;
  console.info(`$ \x1b[33m${basename} ${args.join(" ")}\x1b[0m`);

  return child_process.spawn(cmd,
                             args.map(function callbackfn(
                               value) { return value.replaceAll("\n", " "); }),
                             {
                               shell,
                               cwd,
                               env: process.env,
                               // [stdin, stdout, stderr, extra]
                               stdio: ["pipe", "pipe", "pipe"],
                             });
}

export function escape_path(...paths: string[]) {
  return path.join(...paths.map(function callbackfn(value) {
    return value.split(path.sep)
      .map(function callbackfn(
        v) { return v.includes(" ") ? JSON.stringify(v) : v; })
      .join(path.sep);
  }));
}
