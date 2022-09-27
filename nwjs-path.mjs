import path from "node:path/posix";
import os from "node:os";

export async function get_nwjs_path() {
  try {
    const absolute_path = path.join(process.cwd(), "node_modules/nw/index.js");
    const { findpath } = await import(
      os.platform() === "win32"
        ? `file:///${absolute_path}`
        : absolute_path
    );
    return findpath();
  } catch (e) {
    console.error(e);
    console.info("\nnw may be missing as a dependency in your project.\n");
    process.exit(1);
  }
}
