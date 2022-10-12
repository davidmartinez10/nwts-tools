#!/usr/bin/env zx
import { promisify } from "node:util";
import stream from "node:stream";
import "zx/globals";
import { get_nwjs_path } from "nwts-tools/nwjs-path.mjs";
import got from "got";

const ignore = () => void 0;

const { dependencies, devDependencies } = await fs.readJSON(path.join(process.cwd(), "package.json"));

const nw = dependencies?.nw || devDependencies?.nw;
const version = nw.replace("-sdk", "");

const { stdout: url } = await $`npx -y nwjs-ffmpeg-prebuilt -v ${version} --get-download-url`;

const temp_folder = await fs.mkdtemp(
  path.join(os.tmpdir(), "nwjs-ffmpeg-")
);

const ffmpeg_zip = path.join(temp_folder, "ffmpeg.zip");
await promisify(stream.pipeline)(got.stream(url), fs.createWriteStream(ffmpeg_zip));

let nw_path = await get_nwjs_path();

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

await $`${os.platform() === "win32"
  ? `powershell Expand-Archive ${ffmpeg_zip} -DestinationPath ${nw_path} -Force`
  : `unzip -o ${JSON.stringify(ffmpeg_zip)} -d ${JSON.stringify(nw_path)}`}`;

await fs.unlink(temp_folder).catch(ignore);
