/// <reference path="types/nwjs.d.ts" />
import os from "node:os";
import path from "node:path/posix";

export async function get_nwjs_path() {
  try {
    const absolute_path = path.join(process.cwd(), "node_modules/nw/index.js");
    /** @type {import("nw")} */
    const { findpath } = await import(
      os.platform() === "win32" ? `file:///${absolute_path}` : absolute_path);
    return findpath();
  } catch (e) {
    console.error(e);
    console.info("\nnw may be missing as a dependency in your project.\n");
    process.exit(1);
  }
}
