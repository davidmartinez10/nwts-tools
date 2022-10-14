import type node_worker_threads from "node:worker_threads";

export default nw.require("node:worker_threads") as typeof node_worker_threads;
