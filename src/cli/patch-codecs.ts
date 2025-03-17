#!/usr/bin/env node
import {patch_nwjs_codecs} from "../lib/patch-nwjs-codecs";

async function patch_codecs() {
  const nw = await import("nw");
  await            patch_nwjs_codecs(nw.findpath());
}

patch_codecs()
  .then(function onfulfilled() { process.exit(0); })
  .catch(function onrejected(reason) {
    console.error(reason);
    process.exit(1);
  });
