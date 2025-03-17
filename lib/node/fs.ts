import type node_fs from "fs";
import type node_fspromises from "fs/promises";

export const                                 promises
  = nw.require("fs/promises") as typeof node_fspromises;

export default nw.require("fs") as typeof node_fs;
