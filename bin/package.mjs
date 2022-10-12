#!/usr/bin/env zx
import "zx/globals";

import { patch_nwjs_codecs } from "nwts-tools/patch-nwjs-codecs.mjs";

const ignore = () => undefined;

console.clear();
console.info("nwts-package\n");

if (!["zip", "zip+exe"].includes(process.env.PACKAGE_TYPE || "")) {
  process.env.PACKAGE_TYPE = "plain";
}

const temp_folder = await fs.mkdtemp(path.join(os.tmpdir(), "build-"));

const build_directory = process.env.BUILD_DIRECTORY || "build";
const package_directory = process.env.PACKAGE_DIRECTORY || "dist";

const { displayName, dependencies, devDependencies } = await fs.readJSON(path.join(process.cwd(), "package.json"));

let application_name = process.env.APP_NAME || displayName;
const version = process.env.NWJS_VERSION || (dependencies?.nw || devDependencies?.nw).replace("^", "").replace("-sdk", "");

const config = {
  "Application name": application_name,
  "Current working directory": process.cwd(),
  "Build directory": build_directory,
  "Package directory": package_directory,
  "NW.js version": version,
  "Package type": process.env.PACKAGE_TYPE,
};

console.info("Running on these settings:");
console.table(config);

await $`cd ${temp_folder} && npm install nw@${version}`;

if (process.env.NWJS_FFMPEG === "PATCH") {
  const { findpath } = await import(
    os.platform() === "win32"
      ? `file:///${path.join(temp_folder, "node_modules/nw/index.js")}`
      : path.join(temp_folder, "node_modules/nw/index.js")
  );

  await patch_nwjs_codecs(findpath());
}

await fs.ensureDir(package_directory);

switch (os.platform()) {
  case "win32": {
    const app_directory = path.join(".", package_directory, application_name);

    await $`Robocopy ${path.join(temp_folder, "node_modules/nw/nwjs")} ${app_directory} *.* /E /MOVE`;

    if (process.env.PACKAGE_TYPE === "plain") {
      await $`Robocopy ${build_directory} ${app_directory} *.* /E`;
    } else {
      const nw = path.join(app_directory, "nw.exe");
      const package_nw = path.join(app_directory, "package.nw");
      const package_zip = path.join(temp_folder, "package.zip");

      let with_dirs = false;
      for await (const item of await fs.opendir(build_directory)) {
        if (item.isDirectory()) {
          const dirpath = path.join(build_directory, item.name);
          await $`powershell Compress-Archive ${dirpath} ${dirpath}.zip`;
          await $`powershell Remove-Item ${dirpath} -Recurse`;
          with_dirs = true;
        }
      }

      if (with_dirs) {
        const manifest = await fs.readJSON(path.join(build_directory, "package.json"));

        async function archive_expander() {
          const fs = globalThis.require("node:fs/promises");
          const path = globalThis.require("node:path");
          const { execSync } = globalThis.require("node:child_process");
          const manifest = globalThis.require("./package.json");

          for await (const item of await fs.opendir(".")) {
            if (path.extname(item.name) === ".zip") {
              execSync(`powershell Expand-Archive ${item.name} -DestinationPath .`);
              execSync(`powershell Remove-Item ${item.name}`);
            }
          }

          manifest.main = "___NWTS-TOOLS_RESTORE_ORIGINAL_MAIN___";
          fs.writeFile("./package.json", JSON.stringify(manifest));
          nw.Window.get().reload();
        }

        const expander_path = "nwts-tools_archive_expander.js";
        const script = `(${archive_expander})()`.replace("___NWTS-TOOLS_RESTORE_ORIGINAL_MAIN___", manifest.main);
        await fs.writeFile(path.join(build_directory, expander_path), script);

        manifest.main = expander_path;

      }

      await $`cd ${build_directory} && powershell Compress-Archive ".\\*" ${package_zip}`;
      await $`move ${package_zip} ${package_nw}`;

      if (process.env.PACKAGE_TYPE === "zip+exe") {
        await $`copy /b ${nw}+${package_nw} ${path.join(app_directory, `${application_name}.exe`)}`;
        await $`del ${nw} ${package_nw}`;
      }
    }

    break;
  }

  case "darwin": {
    await $`mv ${path.join(temp_folder, "/node_modules/nw/nwjs/nwjs.app/")} ${path.join(package_directory, application_name + ".app")}`;

    const resources = `${package_directory}/${application_name}.app/Contents/Resources`;

    if (process.env.PACKAGE_TYPE === "plain") {
      await $`cp -R ${build_directory} ${path.join(resources, "/app.nw")}`;
    } else {
      await $`cd ${build_directory} && zip -r ${path.join("..", resources, "app.nw")} .`;
    }

    break;
  }

  case "linux": {
    await $`mv ${path.join(temp_folder, "/node_modules/nw/nwjs/")} ${path.join(package_directory, application_name)}`;

    if (process.env.PACKAGE_TYPE === "plain") {
      await $`cp -R ${build_directory} ${path.join(package_directory, application_name, "package.nw")}`;
    } else {
      await $`cd ${build_directory} && zip -r ${path.join("..", package_directory, application_name, "package.nw")} .`;
      if (process.env.PACKAGE_TYPE === "zip+exe") {
        await $`cd ${path.join(package_directory, application_name)} && cat nw package.nw > ${application_name} && chmod +x ${application_name}`;
        await $`cd ${path.join(package_directory, application_name)} && rm nw package.nw`;
      }
    }

    break;
  }
}

await fs.unlink(temp_folder).catch(ignore);
