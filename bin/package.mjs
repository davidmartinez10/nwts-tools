#!/usr/bin/env node
import child_process from "node:child_process";
import fs from "node:fs";
import path from "node:path/posix";
import win_path from "node:path/win32";
import os from "node:os";

import { patch_nwjs_codecs } from "../patch-nwjs-codecs.mjs";

const preserve_spaces = `🇺🇦${Number.MAX_SAFE_INTEGER}🇺🇦`;
const ignore = () => undefined;

/**
 * @param {string} command
 * @param {import("node:child_process").SpawnSyncOptions} [options]
 */
function run_cmd(command, options) {
  const arr = command.split(" ");
  const cmd = arr.shift() || "";
  const args = arr.map(function callbackfn(element) {
    return element.replace(preserve_spaces, "\\ ");
  });

  child_process.spawnSync(
    cmd,
    args,
    Object.assign({
      shell: true,
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
      encoding: "utf-8",
    }, options));
}

async function make_package() {
  console.clear();
  console.info("nwts-package\n");

  if (!["zip", "zip+exe"].includes(process.env.PACKAGE_TYPE || "")) {
    process.env.PACKAGE_TYPE = "plain";
  }

  const temp_folder = await fs.promises.mkdtemp(path.join(os.tmpdir(), "build-"));

  const build_directory = (
    process.env.BUILD_DIRECTORY
    || JSON.parse((String(await fs.promises.readFile(path.join(process.cwd(), "tsconfig.json")).catch(ignore))))?.compilerOptions?.outDir
    || "build"
  );

  const package_directory = (
    process.env.PACKAGE_DIRECTORY
    || "dist"
  );

  let { displayName, dependencies, devDependencies } = JSON.parse(String(await fs.promises.readFile(path.join(process.cwd(), "package.json"))));

  const { nw: nw_version } = devDependencies;
  const version = process.env.NWJS_VERSION || nw_version.replace("-sdk", "");

  const config = {
    "Application name": displayName,
    "Current working directory": process.cwd(),
    "Build directory": build_directory,
    "Package directory": package_directory,
    "NW.js version": version,
    "Package type": process.env.PACKAGE_TYPE || "normal",
  };

  console.info("Running on these settings:");
  console.table(config);

  displayName.replace(" ", preserve_spaces);

  // Fetch runtime dependencies
  await fs.promises.writeFile(path.join(temp_folder, "package.json"), JSON.stringify({ dependencies }), { encoding: "utf8" });
  child_process.execSync(`npm install`, { "cwd": temp_folder, stdio: "inherit" });

  const has_runtime_deps = Object.values(dependencies).length > 0;

  if (has_runtime_deps) {
    console.info("\nBundling these runtime dependencies:");
    console.table(dependencies);
  }

  const runtime_modules = path.join(temp_folder, "runtime_modules");

  if (has_runtime_deps) {
    await fs.promises.rename(path.join(temp_folder, "node_modules"), runtime_modules);
  }

  child_process.execSync(`npm install nw@${version}`, { "cwd": temp_folder, stdio: "inherit" });

  if (process.env.NWJS_FFMPEG === "PATCH") {
    const { findpath } = await import(
      os.platform() === "win32"
        ? `file:///${path.join(temp_folder, "node_modules/nw/index.js")}`
        : path.join(temp_folder, "node_modules/nw/index.js")
    );

    await patch_nwjs_codecs(findpath());
  }

  if (!fs.existsSync(package_directory)) {
    run_cmd(`mkdir ${package_directory}`);
  }

  switch (os.platform()) {

    case "win32": {
      const app_directory = win_path.join(".", package_directory, displayName);

      run_cmd(`Robocopy "${win_path.join(temp_folder, "node_modules/nw/nwjs")}" "${app_directory}" *.* /E /MOVE`);

      if (has_runtime_deps) {
        run_cmd(`Robocopy ${JSON.stringify(path.normalize(runtime_modules))} ${JSON.stringify(path.join(build_directory, "node_modules"))} *.* /E /MOVE`);
      }

      if (process.env.PACKAGE_TYPE === "plain") {
        run_cmd(`Robocopy "${build_directory}" "${app_directory}" *.* /E`);
      } else {
        const nw = win_path.join(app_directory, "nw.exe");
        const package_nw = win_path.join(app_directory, "package.nw");
        const package_zip = win_path.join(temp_folder, "package.zip");

        let with_dirs = false;
        for await (const item of await fs.promises.opendir(build_directory)) {
          if (item.isDirectory()) {
            const dirpath = win_path.join(build_directory, item.name);
            run_cmd(`powershell Compress-Archive "${dirpath}" "${dirpath}.zip"`);
            run_cmd(`powershell Remove-Item "${dirpath}" -Recurse`);
            with_dirs = true;
          }
        }

        if (with_dirs) {
          const manifest = JSON.parse(String(await fs.promises.readFile(path.join(build_directory, "package.json"))));

          const manifest_main = String(await fs.promises.readFile(path.join(build_directory, manifest.main)));
          let launcher_js;

          if (path.extname(manifest.main) === ".html") {
            const scripts = manifest_main.split("\n")
              .filter(function predicate(value) {
                return value.includes("<script");
              })
              .map(function callbackfn(value) {
                const script_src = value.split(`src="`)[1].split(`"`)[0];
                return script_src;
              })
              .filter(function predicate(value) {
                return [".js", ".cjs", ".mjs"].includes(path.extname(value)) && value[0] === "/";
              });

            launcher_js = String(await fs.promises.readFile(path.join(build_directory, scripts[0])));
          } else {
            launcher_js = manifest_main;
          }

          async function expander() {
            const win = nw.Window.get();
            win.hide();
            for await (const item of await require("node:fs/promises").opendir(".")) {
              if (require("node:path").extname(item.name) === ".zip") {
                const { execSync } = require("node:child_process");
                execSync(`powershell Expand-Archive ${item.name} -DestinationPath .`);
                execSync(`powershell Remove-Item ${item.name}`);
              }
            }
            win.show();
            "__launcher__";
          }

          const script = `${String(expander).replace(`"__launcher__";`, launcher_js)}; expander();`;
          await fs.promises.writeFile(path.join(build_directory, "launcher.js"), script);
        }

        run_cmd(`cd "${build_directory}" && powershell Compress-Archive ".\\*" "${package_zip}"`);
        run_cmd(`move "${package_zip}" "${package_nw}"`);

        if (process.env.PACKAGE_TYPE === "zip+exe") {
          run_cmd(`copy /b "${nw}"+"${package_nw}" "${win_path.join(app_directory, `${displayName}.exe`)}"`);
          run_cmd(`del "${nw}" "${package_nw}"`);
        }
      }

      break;
    }

    case "darwin": {
      run_cmd(`mv "${temp_folder}/node_modules/nw/nwjs/nwjs.app/" "./${package_directory}/${displayName}.app/"`);
      if (has_runtime_deps) run_cmd(`mv "${runtime_modules}/" "./${build_directory}/node_modules/"`);

      const resources = `${package_directory}/${displayName}.app/Contents/Resources`;

      if (process.env.PACKAGE_TYPE === "plain") {
        run_cmd(`cp -R "./${build_directory}" "./${resources}/app.nw"`);
      } else {
        run_cmd(`cd "${build_directory}" && zip -r "../${resources}/app.nw" .`);
      }

      break;
    }

    case "linux": {
      run_cmd(`mv "${temp_folder}/node_modules/nw/nwjs/" "./${package_directory}/${displayName}/"`);
      if (has_runtime_deps) run_cmd(`mv "${runtime_modules}/" "./${build_directory}/node_modules/"`);

      if (process.env.PACKAGE_TYPE === "plain") {
        run_cmd(`cp -R "./${build_directory}" "./${package_directory}/${displayName}/package.nw"`);
      } else {
        run_cmd(`cd "${build_directory}" && zip -r "../${package_directory}/${displayName}/package.nw" .`);
        if (process.env.PACKAGE_TYPE === "zip+exe") {
          run_cmd(`cd "./${package_directory}/${displayName}" && cat nw package.nw > "${displayName}" && chmod +x "${displayName}"`);
          run_cmd(`cd "./${package_directory}/${displayName}" && rm nw package.nw`);
        }
      }

      break;
    }
  }

  await fs.promises.unlink(temp_folder).catch(ignore);
}

make_package();
