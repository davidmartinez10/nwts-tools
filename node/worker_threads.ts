import type * as node_worker_threads from "node:worker_threads";

export default require("node:worker_threads") as typeof node_worker_threads;