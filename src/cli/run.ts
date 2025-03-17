#!/usr/bin/env node
import child_process from "child_process";

async function nwjs() {
  const { got } = await import("got");
  const nw = await import("nw");

  const build_directory = (process.env.BUILD_DIRECTORY || "build");

  const debug_port = (process.env.DEBUG_PORT || 9222);

  const nwjs_path = nw.findpath();

  if (process.env.EXECUTION_MODE === "DEBUG") {
    const child = child_process.spawn(JSON.stringify(nwjs_path),
      [
        JSON.stringify(build_directory),
        `--remote-debugging-port=${debug_port}`,
        ...process.argv.slice(1)
      ],
      {
        detached: true,
        shell: true,
        cwd: process.cwd(),
        env: process.env,
        stdio: "inherit",
      });

    child.unref();

    await new Promise(async function promise(resolve, reject) {
      const interval = 250;
      try {
        const { statusCode }
          = await got.head(`http://127.0.0.1:${debug_port}/`);
        if (statusCode !== 200) {
          throw Error();
        } else {
          resolve(undefined);
        }
      } catch {
        await new Promise(function (r) { setTimeout(r, interval); });
        promise(resolve, reject);
      }
    });

    process.exit(0);
  } else {
    child_process.spawn(nwjs_path,
      [
        build_directory,
        `--remote-debugging-port=${debug_port}`,
        ...process.argv.slice(1)
      ],
      {
        cwd: process.cwd(),
        env: process.env,
        stdio: "inherit",
      });
  }
}

nwjs()
  .then(function onfulfilled() { process.exit(0); })
  .catch(function onrejected(reason) {
    console.error(reason);
    process.exit(1);
  });
