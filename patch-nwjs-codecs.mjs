import fs from "fs";
import { promisify } from "util";
import stream from "stream";
import path from "path";
import child_process from "child_process";
import os from "os";

import got from "got";

const ignore = () => undefined;

// IMPORTANT: Take a look at https://www.ffmpeg.org/legal.html.

/**
 * @param {string} nw_path
 */
export async function patch_nwjs_codecs(nw_path) {
  const { dependencies, devDependencies } = JSON.parse(
    String(await fs.promises.readFile(path.join(process.cwd(), "package.json")))
  );

  const nw = dependencies?.nw || devDependencies?.nw;
  const version = nw.replace("-sdk", "");

  const url = String(child_process.execSync(
    `npx -y nwjs-ffmpeg-prebuilt -v ${version} --get-download-url`
  ));

  const temp_folder = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "nwjs-ffmpeg-")
  );

  const ffmpeg_zip = path.join(temp_folder, "ffmpeg.zip");
  await promisify(stream.pipeline)(got.stream(url), fs.createWriteStream(ffmpeg_zip));

  switch (os.platform()) {
    case "darwin":
      nw_path = nw_path.replace("MacOS/nwjs", "Frameworks/nwjs Framework.framework/Versions/Current");
      break;
    case "win32":
      nw_path = nw_path.replace("nw.exe", "");
      break;
    case "linux":
      nw_path = nw_path.replace("nw/nwjs/nw", "nw/nwjs/lib");
      break;
  }

  child_process.execSync(
    os.platform() === "win32"
      ? `powershell Expand-Archive ${ffmpeg_zip} -DestinationPath ${nw_path} -Force`
      : `unzip -o ${JSON.stringify(ffmpeg_zip)} -d ${JSON.stringify(nw_path)}`,
    { stdio: "inherit" }
  );

  await fs.promises.unlink(temp_folder).catch(ignore);
}
