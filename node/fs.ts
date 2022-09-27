import type * as node_fs from "node:fs";
import type * as node_fspromises from "node:fs/promises";

export const promises = require("node:fs/promises") as typeof node_fspromises;

export default require("node:fs") as typeof node_fs;