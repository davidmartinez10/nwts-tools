# NW.ts-Tools
A toolkit for running, patching and packaging NW.js apps.

## Usage
```bash
# Add NW.ts-Tools as a dependency.
# This package relies on your project having "nw" as a dependency.
npm i -D nwts-tools
```

### patch-codecs
Replaces the `FFmpeg` library originally included with `NW.js`. Credits to [nwjs-ffmpeg-prebuilt](https://github.com/nwjs-ffmpeg-prebuilt/nwjs-ffmpeg-prebuilt) for the prebuilt binaries. Use this patch only for free and open-source projects. Licensing restrictions apply for closed-source software.

More information: [FFmpeg License and Legal Considerations](https://www.ffmpeg.org/legal.html).
```bash
# Run from your project's root directory:
npx nwts-patch-codecs
```

### package
This script downloads a fresh copy from `nw` (the same version as you specified in your `package.json` minus `-sdk`) and packages it alongside your already built application.
```bash
# Run from your project's root directory:
npx nwts-package

# Or, modified by environment variables:
PACKAGE_TYPE=zip NWJS_FFMPEG=PATCH NWJS_VERSION=0.55.0-sdk npx nwts-package
```
Environment variables used by these scripts are enumerated inside `types/env.d.ts`.

### run
Used mainly build the app, launch it and attach the debugger in one step.
```bash
npx nwts-run
```

### Typed Node.js built-in modules
NW.js imports built-in modules with the `require()` function. Here is provided a collection of typed exports. Some examples:
```typescript
import util from "nwts-tools/node/util";
import fs from "nwts-tools/node/fs";
import child_process, { promises } from "nwts-tools/node/child_process";
import http from "nwts-tools/node/http";
import os from "nwts-tools/node/os";
import path from "nwts-tools/node/path";
```

Check out this `Solid.js` project starter that takes full advantage of `NW.ts-Tools` features:

[NW.ts Solid Starter](https://github.com/davidmartinez10/nwts-solid-starter.git)
