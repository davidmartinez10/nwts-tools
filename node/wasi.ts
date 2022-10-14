import type node_wasi from "node:wasi";

export default nw.require("node:wasi") as typeof node_wasi;
