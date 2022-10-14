import type node_diagnostics_channel from "node:diagnostics_channel";

export default nw.require("node:diagnostics_channel") as
  typeof node_diagnostics_channel;
