#!/usr/bin/env node
import child_process from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path/posix";
import win_path from "node:path/win32";
import os from "node:os";

import { patch_nwjs_codecs } from "../patch-nwjs-codecs.mjs";

const ignore = () => undefined;

async function make_package() {
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
  const preserve_spaces = `🇺🇦${Number.MAX_SAFE_INTEGER}🇺🇦`;
  displayName.replace(" ", preserve_spaces);

  const { nw: nw_version } = devDependencies;
  const version = process.env.NWJS_VERSION || nw_version.replace("-sdk", "");

  // Fetch runtime dependencies
  await fs.promises.writeFile(path.join(temp_folder, "package.json"), JSON.stringify({ dependencies }), { encoding: "utf8" });
  await promisify(child_process.exec)(`npm install`, { "cwd": temp_folder });

  const has_runtime_deps = Object.values(dependencies).length > 0;
  const runtime_modules = path.join(temp_folder, "runtime_modules");

  if (has_runtime_deps) await fs.promises.rename(path.join(temp_folder, "node_modules"), runtime_modules);

  await promisify(child_process.exec)(`npm install nw@${version}`, { "cwd": temp_folder });

  if (process.env.NWJS_FFMPEG === "PATCH") {
    const { findpath } = await import(
      os.platform() === "win32"
        ? `file:///${path.join(temp_folder, "node_modules/nw/index.js")}`
        : path.join(temp_folder, "node_modules/nw/index.js")
    );

    await patch_nwjs_codecs(findpath());
  }

  const commands = [];

  if (!fs.existsSync(package_directory)) {
    commands.push(`mkdir ${package_directory}`);
  }

  switch (os.platform()) {

    case "win32": {
      const app_directory = win_path.join(".", package_directory, displayName);

      commands.push(`Robocopy "${win_path.join(temp_folder, "node_modules/nw/nwjs")}" "${app_directory}" *.* /E /MOVE`);
      if (has_runtime_deps) commands.push(`Robocopy "${runtime_modules}" "${app_directory}\\node_modules" *.* /E /MOVE`);


      if (process.env.PACKAGE_TYPE === "zip") {
        const nw = win_path.join(app_directory, "nw.exe");
        const package_nw = win_path.join(app_directory, "package.nw");
        const package_zip = win_path.join(temp_folder, "package.zip");

        commands.push(`cd "${build_directory}" && powershell Compress-Archive ".\\*" "${package_zip}"`);
        commands.push(`move "${package_zip}" "${package_nw}"`);
        commands.push(`copy /b "${nw}"+"${package_nw}" "${win_path.join(app_directory, `${displayName}.exe`)}"`);
        commands.push(`del "${nw}" "${package_nw}"`);
      } else {
        commands.push(`Robocopy "${build_directory}" "${app_directory}" *.* /E`);
      }

      break;
    }

    case "darwin": {
      commands.push(`mv "${temp_folder}/node_modules/nw/nwjs/nwjs.app/" "./${package_directory}/${displayName}.app/"`);
      if (has_runtime_deps) commands.push(`mv "${runtime_modules}/" "./${build_directory}/node_modules/"`);

      const resources = `${package_directory}/${displayName}.app/Contents/Resources`;

      if (process.env.PACKAGE_TYPE === "zip") {
        commands.push(`cd "${build_directory}" && zip -r "../${resources}/app.nw" .`);
      } else {
        commands.push(`cp -R "./${build_directory}" "./${resources}/app.nw"`);
      }

      break;
    }

    case "linux": {
      commands.push(`mv "${temp_folder}/node_modules/nw/nwjs/" "./${package_directory}/${displayName}/"`);
      if (has_runtime_deps) commands.push(`mv "${runtime_modules}/" "./${build_directory}/node_modules/"`);

      if (process.env.PACKAGE_TYPE === "zip") {
        commands.push(`cd "${build_directory}" && zip -r "../${package_directory}/${displayName}/package.nw" .`);
        commands.push(`cd "./${package_directory}/${displayName}" && cat nw package.nw > "${displayName}" && chmod +x "${displayName}"`);
        commands.push(`cd "./${package_directory}/${displayName}" && rm nw package.nw`);
      } else {
        commands.push(`cp -R "./${build_directory}" "./${package_directory}/${displayName}/package.nw"`);
      }

      break;
    }
  }

  for (const command of commands) {
    const arr = command.split(" ");
    const cmd = arr.shift() || "";
    const args = arr.map(function map(element) {
      return element.replace(preserve_spaces, "\\ ");
    });

    child_process.spawnSync(cmd, args, {
      shell: true,
      cwd: process.cwd(),
      env: process.env,
      stdio: [process.stdin, process.stdout, process.stderr],
      encoding: "utf-8",
    });
  }

  await fs.promises.unlink(temp_folder).catch(ignore);
}

make_package();
