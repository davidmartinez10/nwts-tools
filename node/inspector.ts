import type node_inspector from "node:inspector";

export default nw.require("node:inspector") as typeof node_inspector;
