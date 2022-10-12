import type node_cluster from "node:cluster";

export default require("node:cluster") as typeof node_cluster;
