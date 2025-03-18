#!/usr/bin/env node
import fs from "fs";
import path from "path";
import os from "os";

import {proper_spawn, escape_path} from "../lib/proper-spawn";

async function recursively_walk(dir: string) {
  const nw = await import("nw");

  let compiler = nw.findpath();

  switch (os.platform()) {
  case "win32": compiler = compiler.replace("nw.exe", "nwjc.exe"); break;
  case "darwin":
    compiler = compiler.replace("nwjs.app/Contents/MacOS/nwjs", "nwjc");
    break;
  case "linux":
    compiler = compiler.replace("node_modules/nw/nwjs/nw",
                                "node_modules/nw/nwjs/nwjc");
    break;
  }

  for await (const item of await fs.promises.opendir(dir)) {
    if (item.isDirectory() && item.name !== "node_modules") {
      await recursively_walk(path.join(dir, item.name));
      continue;
    }

    const ext = path.extname(item.name);

    if ([".js", ".mjs", ".cjs"].includes(ext)) {

      const script_file = path.join(dir, item.name);
      const bin_file    = script_file.replace(ext, ".bin");

      if (process.argv.includes("--module")) {
        console.log("Module compiler not working properly as of now.");
        await proper_spawn(`${escape_path(compiler)} ${
          escape_path(script_file)} ${escape_path(bin_file)} --nw-module`);
        await fs.promises.writeFile(
          script_file,
          `nw.Window.get().evalNWBinModule(null, ${
            JSON.stringify(
              path.join(".", path.relative(build_directory, bin_file)))},${
            JSON.stringify(
              path.join(".", path.relative(build_directory, script_file)))});`,
          { encoding: "utf-8" });
      } else {

        await proper_spawn(`${escape_path(compiler)} ${
          escape_path(script_file)} ${escape_path(bin_file)}`);
        await fs.promises.writeFile(
          script_file,
          `nw.Window.get().evalNWBin(null, ${
            JSON.stringify(
              path.join(".", path.relative(build_directory, bin_file)))});`,
          { encoding: "utf-8" });
      }
    }
  }
}

const build_directory = process.env.BUILD_DIRECTORY || "build";

recursively_walk(build_directory)
  .then(function() { fs.promises.unlink("v8.log").catch(Boolean); });
