import type node_trace_events from "node:trace_events";

export default require("node:trace_events") as typeof node_trace_events;
