import type node_worker_threads from "worker_threads";

export default nw.require("worker_threads") as typeof node_worker_threads;
