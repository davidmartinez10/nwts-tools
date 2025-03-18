import child_process from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import semver from "semver";
import stream from "stream";
import {promisify} from "util";

import {escape_path, proper_spawn} from "./proper-spawn";

// IMPORTANT: Take a look at https://www.ffmpeg.org/legal.html.

export async function patch_nwjs_codecs(nw_path: string, version?: string) {
  const { got }                           = await import("got");
  const { dependencies, devDependencies } = JSON.parse(String(
    await fs.promises.readFile(path.join(process.cwd(), "package.json"))));

  if (! version || ! semver.valid(version)) {
    version = semver.coerce(dependencies?.nw || devDependencies?.nw)!.version;
  }

  const os_map = {
    win32: "win",
    darwin: "darwin",
    linux: "linux",
  };

  const url = String(child_process.execSync(
    `npx -y nwjs-ffmpeg-prebuilt -v ${version} -a ${os.arch()} -p ${
      //@ts-ignore
      os_map[os.platform()]} --get-download-url`));

  const     temp_folder
    = await fs.promises.mkdtemp(path.join(os.tmpdir(), "nwjs-ffmpeg-"));

  const ffmpeg_zip = path.join(temp_folder, "ffmpeg.zip");
  await promisify(stream.pipeline)(got.stream(url),
                                   fs.createWriteStream(ffmpeg_zip));

  switch (os.platform()) {
  case "darwin":
    nw_path    = nw_path.replace("MacOS/nwjs",
                                 "Frameworks/nwjs Framework.framework/Versions");
    const stat = await fs.promises.lstat(path.join(nw_path, "Current"));
    if (stat.isSymbolicLink()) {
      nw_path += "/Current";
    } else if (stat.isFile()) {
      nw_path += `/${
        (await fs.promises.readFile(path.join(nw_path, "Current"),
                                    { encoding: "utf-8" }))
          .trim()}`;
    }
    break;
  case "win32": nw_path = nw_path.replace("nw.exe", ""); break;
  case "linux": nw_path = nw_path.replace("nw/nwjs/nw", "nw/nwjs/lib"); break;
  }

  await proper_spawn(
    os.platform() === "win32"
      ? `powershell Expand-Archive ${
          escape_path(
            ffmpeg_zip)} -DestinationPath ${escape_path(nw_path)} -Force`
      : `unzip -o ${escape_path(ffmpeg_zip)} -d ${escape_path(nw_path)}`);
  await fs.promises.unlink(temp_folder).catch(Boolean);
}
