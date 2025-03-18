#!/usr/bin/env node
import fs from "fs";
import path from "path";
import os from "os";

import semver from "semver";

import {patch_nwjs_codecs} from "../lib/patch-nwjs-codecs";
import {escape_path, proper_spawn} from "../lib/proper-spawn";

async function nwts_package() {

  console.clear();
  console.log("\x1b[32m" +
              "nwts-package" +
              "\n\x1b[0m");

  if (! process.env.PACKAGE_TYPE
      || ! ["zip", "zip+exe"].includes(process.env.PACKAGE_TYPE)) {
    process.env.PACKAGE_TYPE = "plain";
  }

  let temp_folder = await fs.promises.mkdtemp(path.join(os.tmpdir(), "build-"));

  const build_directory   = process.env.BUILD_DIRECTORY || "build";
  const package_directory = process.env.PACKAGE_DIRECTORY || "dist";

  const { displayName, dependencies, devDependencies } = JSON.parse(
    await fs.promises.readFile(path.join(process.cwd(), "package.json"),
                               { encoding: "utf8" }));

  let application_name = process.env.APP_NAME || displayName;

  const version
    = semver.valid(process.env.NWJS_VERSION)
      || semver.coerce(dependencies?.nw || devDependencies?.nw)!.version;

  const config = {
    "Application name": application_name,
    "Current working directory": process.cwd(),
    "Build directory": build_directory,
    "Package directory": package_directory,
    "NW.js version": version,
    "Package type": process.env.PACKAGE_TYPE,
  };

  console.log("Running on these settings:");
  console.table(config);

  let temp_nwjs = "";

  const nw = await import("nw");
  //@ts-ignore
  if (nw.get) {
    const os_map = {
      win32: "win",
      darwin: "osx",
      linux: "linux",
    };

    await fs.promises.unlink("./nwjs").catch(Boolean);
    //@ts-ignore
    await nw.get({
      version: semver.coerce(version)?.version || "latest",
      flavor: version.includes("sdk") ? "sdk" : "normal",
      //@ts-ignore
      platform: os_map[os.platform()],
      arch: os.arch(),
      cacheDir: temp_folder,
      ffmpeg: process.env.NWJS_FFMPEG === "PATCH",
      downloadUrl: "https://dl.nwjs.io",
      cache: false
    });

    temp_nwjs = await fs.promises.realpath("./nwjs");
  } else {
    await proper_spawn(`npm install nw@${version}`, temp_folder);
    if (process.env.NWJS_FFMPEG === "PATCH") {
      const nwjs = path.join(temp_folder, "node_modules/nw");
      const { main }
      = JSON.parse(await fs.promises.readFile(path.join(nwjs, "package.json"),
                                              { encoding: "utf8" }));
      const absolute_path = path.join(nwjs, main);
      const { findpath }
      = await import(os.platform() === "win32" ? `file:///${absolute_path}`
                                               : absolute_path) as
        typeof import("nw");
      await   patch_nwjs_codecs(findpath(), version);
    }
    temp_nwjs = path.join(temp_folder, "node_modules/nw/nwjs");
  }

  if (fs.existsSync(package_directory)) {
    await fs.promises.rm(package_directory, { recursive: true, force: true })
      .catch(Boolean);
  }
  await fs.promises.mkdir(package_directory);

  switch (os.platform()) {
  case "win32": {
    const app_directory = path.join(".", package_directory, application_name);

    await proper_spawn(`Robocopy ${escape_path(temp_nwjs)} ${
      escape_path(app_directory)} *.* /E /MOVE`);

    if (process.env.PACKAGE_TYPE === "plain") {
      await proper_spawn(`Robocopy ${escape_path(build_directory)} ${
        escape_path(app_directory)} *.* /E`);
    } else {
      const nw          = path.join(app_directory, "nw.exe");
      const package_nw  = path.join(app_directory, "package.nw");
      const package_zip = path.join(temp_nwjs, "package.zip");

      let with_dirs = false;
      for await (const item of await fs.promises.opendir(build_directory)) {
        if (item.isDirectory()) {
          const dirpath = path.join(build_directory, item.name);
          await proper_spawn(`powershell Compress-Archive ${
            escape_path(dirpath)} ${escape_path(`${dirpath}.zip`)}`);
          await proper_spawn(
            `powershell Remove-Item ${escape_path(dirpath)} -Recurse`);
          with_dirs = true;
        }
      }

      if (with_dirs) {
        const manifest = JSON.parse(
          await fs.promises.readFile(path.join(build_directory, "package.json"),
                                     { encoding: "utf8" }));

        async function archive_expander(main: string) {
          //@ts-ignore
          const fs = nw.require("fs").promises;
          //@ts-ignore
          const path = nw.require("path");
          //@ts-ignore
          const { execSync } = nw.require("child_process");
          //@ts-ignore
          const manifest = nw.require("./package.json");

          for await (const item of await fs.opendir(".")) {
            console.log(item);
            if (path.extname(item.name) === ".zip") {
              execSync(
                `powershell Expand-Archive "${item.name}" -DestinationPath .`);
              execSync(`powershell Remove-Item "${item.name}"`);
            }
          }

          manifest.main = main;
          if (manifest.window) { manifest.window.show = false; }
          await fs.writeFile("./package.json", JSON.stringify(manifest));
          //@ts-ignore
          if (nw.require("./package.json").main === main) {
            //@ts-ignore
            location.href = `${location.origin}/${main}`;
          }
        }

        const expander_path = "nwts-tools_archive_expander.html";
        const script
          = `"use strict";\n((${archive_expander})("${manifest.main}"));`;
        const html
          = `<html><head><script>${script}</script></head><body></body></html>`;
        await fs.promises.writeFile(path.join(build_directory, expander_path),
                                    html);

        manifest.main = expander_path;
        if (manifest.window) { manifest.window.show = true; }
        await fs.promises.writeFile(path.join(build_directory, "package.json"),
                                    JSON.stringify(manifest));
      }

      await proper_spawn(`powershell Compress-Archive ".\\\*" ${
                           escape_path(package_zip)}`,
                         build_directory);
      await proper_spawn(
        `move ${escape_path(package_zip)} ${escape_path(package_nw)}`);

      if (process.env.PACKAGE_TYPE === "zip+exe") {
        await proper_spawn(`copy /b nw.exe+package.nw ".${path.sep}${
                             application_name}.exe"`,
                           app_directory, "cmd.exe");
        await proper_spawn(`del ${escape_path(nw)}`);
        await proper_spawn(`del ${escape_path(package_nw)}`);
      }
    }

    break;
  }

  case "darwin": {
    await proper_spawn(`mv ${escape_path(temp_nwjs, "nwjs.app")} ${
      escape_path(package_directory, application_name + ".app")}`);

    const resources
      = `${package_directory}/${application_name}.app/Contents/Resources`;

    if (process.env.PACKAGE_TYPE === "plain") {
      await proper_spawn(`cp -R ${escape_path(build_directory)} ${
        escape_path(resources, "/app.nw")}`);
    } else {
      await proper_spawn(`cd ${escape_path(build_directory)} && zip -r ${
        escape_path("..", resources, "app.nw")} .`);
    }

    break;
  }

  case "linux": {
    await proper_spawn(`mv ${escape_path(temp_nwjs)} ${
      escape_path(package_directory, application_name)}`);

    if (process.env.PACKAGE_TYPE === "plain") {
      await proper_spawn(`cp -R ${escape_path(build_directory)} ${
        escape_path(package_directory, application_name, "package.nw")}`);
    } else {
      await proper_spawn(`cd ${escape_path(build_directory)} && zip -r ${
        escape_path("..", package_directory, application_name,
                    "package.nw")} .`);
      if (process.env.PACKAGE_TYPE === "zip+exe") {
        await proper_spawn(`cd ${
          escape_path(package_directory,
                      application_name)} && cat nw package.nw > ${
          escape_path(
            application_name)} && chmod +x ${escape_path(application_name)}`);
        await proper_spawn(`cd ${
          escape_path(package_directory,
                      application_name)} && rm nw package.nw`);
      }
    }

    break;
  }
  }
  await fs.promises.unlink("./nwjs").catch(Boolean);
  await fs.promises.unlink(temp_folder).catch(Boolean);
}

nwts_package()
  .then(function onfulfilled() {
    console.log("The entire program was packaged succesfully.");
    process.exit(0);
  })
  .catch(function onrejected(reason) {
    console.error(reason);
    process.exit(1);
  });
