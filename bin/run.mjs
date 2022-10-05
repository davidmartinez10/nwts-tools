#!/usr/bin/env node
import fs from "node:fs/promises";
import child_process from "node:child_process";
import path from "node:path";

import { get_nwjs_path } from "../nwjs-path.mjs";
import got from "got";

const ignore = () => undefined;

async function nwjs() {
  const build_directory = (
    process.env.BUILD_DIRECTORY
    || JSON.parse((String(await fs.readFile(path.join(process.cwd(), "tsconfig.json")).catch(ignore))))?.compilerOptions?.outDir
    || "build"
  );

  const debug_port = (
    process.env.DEBUG_PORT
    || JSON.parse(String(await fs.readFile(path.join(process.cwd(), ".vscode/launch.json")).catch(ignore)))?.configurations[0]?.port
    || 19260
  );

  const nwjs_path = await get_nwjs_path();

  if (process.env.EXECUTION_MODE === "DEBUG") {
    child_process.spawn(
      nwjs_path,
      [
        build_directory,
        `--remote-debugging-port=${debug_port}`,
      ],
      {
        detached: true,
        shell: true,
      }
    ).unref();

    await new Promise(async function promise(resolve, reject) {
      const interval = 250;
      try {
        const { statusCode } = await got.head(`http://127.0.0.1:${debug_port}/`);
        if (statusCode !== 200) {
          throw Error();
        } else {
          resolve(undefined);
        }
      } catch {
        await new Promise(function (r) {
          setTimeout(r, interval);
        });
        promise(resolve, reject);
      }
    });

    process.exit(0);
  } else {
    child_process.spawnSync(
      nwjs_path,
      [
        build_directory,
        `--remote-debugging-port=${debug_port}`,
      ]
    );
  }
}

nwjs();
