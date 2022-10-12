# NW.ts-Tools
A simple toolkit for running, compiling, patching and packaging NW.js apps.

## Usage
```bash
# Add NW.ts-Tools as a dependency.
npm i -D nwts-tools
```
You should also have `nw` installed as a **dependency** or **devDependency**.

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

### compile
This script runs `nwjc` on every Javascript file inside the directory specified in the BUILD_DIRECTORY variable, creating a `.bin` file for each one of them and replacing the original script's contents with the corresponding call to `nw.Window.get().evalNWBin()`. Read more here: [Protect JavaScript Source Code](https://nwjs.readthedocs.io/en/latest/For%20Users/Advanced/Protect%20JavaScript%20Source%20Code/).
```bash
# Run from your project's root directory:
BUILD_DIRECTORY=build npx nwts-compile
```

### run
Used mainly for builing the application, launching it and attaching the debugger in one step.
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

# Dependencies
## Windows
- `Powershell`
## MacOS and Linux
- `zip`, required for `nwts-package` when `PACKAGE_TYPE` is set to `zip`.
- `unzip`, required for `nwts-patch-codecs` and for `nwts-package` when `NWJS_FFMPEG` is set to `PATCH`.

---

Check out this `Solid.js` project starter that takes full advantage of `NW.ts-Tools` features:

[NW.ts Solid Starter](https://github.com/davidmartinez10/nwts-solid-starter.git)
