type IntString = `${number}`;

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** Used for naming the package and/or the executable. By default it takes displayName from your package.json. */
      APP_NAME: string;
      NODE_ENV: 'development' | 'production' | undefined;
      EXECUTION_MODE: "DEBUG" | undefined;
      LAUNCHER_PORT: number | IntString;
      DEBUG_PORT: number | IntString;

      // *nwts-package*
      // Refer to: https://nwjs.readthedocs.io/en/latest/For%20Users/Package%20and%20Distribute/

      /** The directory where you built your app before running the packager. By default takes the value of compilerOptions.outDir from your tsconfig.json, or "build" if the former is falsy. */
      BUILD_DIRECTORY: string;
      /** The output directory for the package. It defaults to "dist." */
      PACKAGE_DIRECTORY: string;
      /** NW.js' packaging options:
       * - "plain": Copies everything from BUILD_DIRECTORY to the NW.js folder. (Default)<br>
       * - "zip": It compresses everything from BUILD_DIRECTORY and saves it as package.nw (macOS: app.nw) along with NW.js binaries.
       * - "zip+exe": It takes that zip file and appends it to the NW.js executable. Not available on Mac, thus it falls back to "zip."
       */
      PACKAGE_TYPE: "plain" | "zip" | "zip+exe";
      /** By default it takes the version set in your package.json/devDependencies.nw, minus '-sdk' */
      NWJS_VERSION: string;

      /**
       * Check your "nw" version matches one of the prebuilt binaries here:
       * https://github.com/nwjs-ffmpeg-prebuilt/nwjs-ffmpeg-prebuilt/releases
       */
      NWJS_FFMPEG?: "PATCH";
    }
  }
}

export { };
