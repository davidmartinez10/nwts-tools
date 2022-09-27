#!/usr/bin/env node
import { get_nwjs_path } from "../nwjs-path.mjs";
import { patch_nwjs_codecs } from "../patch-nwjs-codecs.mjs";

async function patch_codecs() {
  patch_nwjs_codecs(await get_nwjs_path());
}

patch_codecs();
