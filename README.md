# NW.ts-Tools
A simple toolkit for compiling, patching codecs and packaging NW.js apps.

## Usage
```bash
# Add NW.ts-Tools as a dependency.
npm i --save-dev nwts-tools
```
You should also have `nw@*-sdk` listed under **dependencies** or **devDependencies**.

### nwts-patch-codecs
Replaces the `FFmpeg` library originally included with `NW.js`. Credits to [nwjs-ffmpeg-prebuilt](https://github.com/nwjs-ffmpeg-prebuilt/nwjs-ffmpeg-prebuilt) for the prebuilt binaries. Use this patch only for free and open-source projects. Licensing for commercial usage is beyond my understanding.

More information: [FFmpeg License and Legal Considerations](https://www.ffmpeg.org/legal.html).
```bash
# Run from your project's root directory:
npx nwts-patch-codecs
```

### nwts-package
This script downloads a fresh copy from `nw` (the same version as you specified in your `package.json` minus `-sdk`) and packages it alongside your already built application.
```bash
# Run from your project's root directory:
npx nwts-package

# Or, modified by environment variables:
PACKAGE_TYPE=zip NWJS_FFMPEG=PATCH NWJS_VERSION=0.55.0-sdk npx nwts-package
```
Environment variables used by these scripts are enumerated inside `lib/types/env.d.ts`.

### nwts-compile
This script runs `nwjc` on every Javascript file inside the directory specified in the BUILD_DIRECTORY variable, creating a `.bin` file for each one of them and replacing the original script's contents with the corresponding call to `nw.Window.get().evalNWBin()`. Read more here: [Protect JavaScript Source Code](https://nwjs.readthedocs.io/en/latest/For%20Users/Advanced/Protect%20JavaScript%20Source%20Code/).
```bash
# Run from your project's root directory:
BUILD_DIRECTORY=build npx nwts-compile
```

### Generate manifest from TS
```typescript
import fs from "node:fs";
import { NWJSManifest } from "nwts-tools/lib/types/nwjs_manifest";

const manifest: NWJSManifest = {
  name: "app",
  main: "index.html",
  window: {
    width: 240,
    height: 45,
    position: "center",
    resizable: false
  },
  "chromium-args": "--force-dark-mode --disable-raf-throttling"
};

await fs.promises.writeFile("package.json", JSON.stringify(manifest));
```

### Typed Node.js built-in modules
In NW.js you can import Node.js built-in modules with the `nw.require()` function, whose return type is `any`. Here is provided a collection of typed exports from Node.js builtin modules. Some examples:
```typescript
import child_process, { promises } from "nwts-tools/lib/node/child_process";
import os from "nwts-tools/lib/node/os";
import path from "nwts-tools/lib/node/path";
```

# Dependencies
## Windows
- `Powershell`
## MacOS and Linux
- `zip`, required for `nwts-package` when `PACKAGE_TYPE` is set to `zip`.
- `unzip`, required for `nwts-patch-codecs`, and for `nwts-package` when `NWJS_FFMPEG` is set to `PATCH`.

---

Check out this boilerplate that shows how to use `NW.ts-Tools`:
[NW.ts-Tools Solid Starter](https://github.com/davidmartinez10/nwts-solid-starter)
