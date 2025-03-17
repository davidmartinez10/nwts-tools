import type node_wasi from "wasi";

export default nw.require("wasi") as typeof node_wasi;
