import type node_child_process from "child_process";
import util from "./util";

const                                          child_process
  = nw.require("child_process") as typeof node_child_process;

export const promises = {
  exec: util.promisify(child_process.exec),
  spawn: util.promisify(child_process.spawn),
};

export default child_process;
