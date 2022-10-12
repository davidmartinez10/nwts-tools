#!/usr/bin/env zx
import "zx/globals";
import { get_nwjs_path } from "../nwjs-path.mjs";

const ignore = () => void 0;

const build_directory = process.env.BUILD_DIRECTORY || "build";

/** @type {[string, string]} */
let replace = ["", ""];

switch (os.platform()) {
  case "win32":
    replace = ["nw.exe", "nwjc.exe"];
    break;
  case "darwin":
    replace = ["nwjs.app/Contents/MacOS/nwjs", "nwjc"];
    break;
  case "linux":
    replace = ["node_modules/nw/nwjs/nw", "node_modules/nw/nwjs/nwjc"];
    break;
}

const compiler = (await get_nwjs_path()).replace(...replace);

/**
 * @param {string} dir
 */
async function recursively_walk(dir) {
  for await (const item of await fs.opendir(dir)) {
    if (item.isDirectory()) {
      await recursively_walk(path.join(dir, item.name));
      continue;
    }

    const ext = path.extname(item.name);

    if ([".js", ".mjs", ".cjs"].includes(ext)) {

      const script_file = path.join(dir, item.name);
      const bin_file = script_file.replace(ext, ".bin");

      if (process.argv.includes("--module")) {
        console.log("Module compiler not working properly as of now.");
        await $`${compiler} ${script_file} ${bin_file} --nw-module`;
        await fs.writeFile(script_file, `nw.Window.get().evalNWBinModule(null, "${bin_file.replace(`${build_directory}/`, "")}", "${script_file.replace(`${build_directory}/`, "")}");`, { encoding: "utf-8" });
      } else {
        await $`${compiler} ${script_file} ${bin_file}`;
        await fs.writeFile(script_file, `nw.Window.get().evalNWBin(null, "${bin_file.replace(`${build_directory}/`, "")}");`, { encoding: "utf-8" });
      }
    }
  }
}

await recursively_walk(build_directory);
await fs.promises.unlink("v8.log").catch(ignore);
