#!/usr/bin/env node
import child_process from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path/posix";
import win_path from "node:path/win32";
import os from "node:os";

import { patch_nwjs_codecs } from "../patch-nwjs-codecs.mjs";
import { get_nwjs_path } from "../nwjs-path.mjs";

const ignore = () => undefined;

async function make_package() {
  const temp_folder = await fs.promises.mkdtemp(path.join(os.tmpdir(), "build-"));

  const build_directory = (
    process.env.BUILD_DIRECTORY
    || JSON.parse((String(await fs.promises.readFile(path.join(process.cwd(), "tsconfig.json")).catch(ignore))))?.compilerOptions?.outDir
    || "build"
  );

  let { displayName, dependencies, devDependencies } = JSON.parse(String(await fs.promises.readFile(path.join(process.cwd(), "package.json"))));
  const preserve_spaces = `🇺🇦${Number.MAX_SAFE_INTEGER}🇺🇦`;
  displayName.replace(" ", preserve_spaces);

  const nw = dependencies?.nw || devDependencies?.nw;

  await fs.promises.writeFile(`${temp_folder}/package.json`, JSON.stringify({}), { encoding: "utf8" });
  const version = process.env.NWJS_VERSION || nw.replace("-sdk", "");

  await promisify(child_process.exec)(`cd ${temp_folder} && npm install nw@${version}`);

  if (process.env.NWJS_FFMPEG === "PATCH") await patch_nwjs_codecs(await get_nwjs_path());

  const commands = ["mkdir dist"];

  switch (os.platform()) {

    case "win32": {
      const dist_directory = win_path.join("./dist", displayName);
      commands.push(
        `Robocopy "${win_path.join(temp_folder, "node_modules/nw/nwjs")}" "${dist_directory}" *.* /E`
      );

      if (process.env.PACKAGE_TYPE === "zip") {
        commands.push(`cd "${build_directory}" && powershell Compress-Archive ".\\*" "${temp_folder}\\package.zip"`);
        commands.push(`cd "${dist_directory}" && mv "${win_path.join(temp_folder, "package.zip")}" ./package.nw`);

        // Too ambitious right now:
        // commands.push(`cd "${dist_directory}" && cmd /C="copy /b '${dist_directory}\\nw.exe'+'${dist_directory}\\package.nw' '${dist_directory}\\app.exe'" && rm nw.exe && rm package.nw`);
      } else {
        commands.push(`Robocopy "${build_directory}" "${dist_directory}" *.* /E`);
      }

      break;
    }

    case "darwin": {
      commands.push(`cp -R "${temp_folder}/node_modules/nw/nwjs/nwjs.app" "./dist/${displayName}.app"`);

      if (process.env.PACKAGE_TYPE === "zip") {
        commands.push(`cd "${build_directory}" && zip -r "${`../dist/${displayName}.app/Contents/Resources/app.nw`}" .`);
      } else {
        commands.push(`cp -R "./${build_directory}" "./dist/${displayName}.app/Contents/Resources/app.nw"`);
      }

      break;
    }

    case "linux": {
      commands.push(`cp -R "${temp_folder}/node_modules/nw/nwjs" "./dist/${displayName}"`);

      if (process.env.PACKAGE_TYPE === "zip") {
        commands.push(`cd "${build_directory}" && zip -r "${`../dist/${displayName}/package.nw`}" .`);

        // Too ambitious right now:
        // commands.push(`cd "./dist/${displayName}" && cat nw package.nw > app && chmod +x app`);
      } else {
        commands.push(`cp -R "./${build_directory}" "./dist/${displayName}/package.nw"`);
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
