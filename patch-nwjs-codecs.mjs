import fs from "fs";
import { promisify } from "util";
import stream from "stream";
import path from "path";
import child_process from "child_process";
import os from "os";

import got from "got";

// IMPORTANT: Take a look at https://www.ffmpeg.org/legal.html.
export async function patch_nwjs_codecs(nw_path = "") {
  const { dependencies, devDependencies } = JSON.parse(
    String(await fs.promises.readFile(path.join(process.cwd(), "package.json")))
  );

  const nw = dependencies?.nw || devDependencies?.nw;
  const version = nw.replace("-sdk", "");

  const { stdout: url } = await promisify(child_process.exec)(
    `npx -y nwjs-ffmpeg-prebuilt -v ${version} --get-download-url`
  );

  const temp_folder = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "ffmpeg-")
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

  await promisify(child_process.exec)(
    os.platform() === "win32"
      ? `powershell Expand-Archive ${ffmpeg_zip} -DestinationPath ${nw_path}`
      : `unzip -o ${JSON.stringify(ffmpeg_zip)} -d ${JSON.stringify(nw_path)}`
  );
}