type IntString = `${number}`;

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | undefined;
      EXECUTION_MODE?: "DEBUG" | undefined;
      LAUNCHER_PORT?: IntString;
      DEBUG_PORT?: IntString | undefined;

      // *nwts-package*
      // Refer to: https://nwjs.readthedocs.io/en/latest/For%20Users/Package%20and%20Distribute/
      BUILD_DIRECTORY?: string; // default: "build"
      PACKAGE_DIRECTORY?: string; // default: "dist"
      PACKAGE_TYPE?: "plain" | "zip" | "zip+exe"; // default: "plain"; "zip+exe" isn't available on Mac and it falls back to "zip"
      NWJS_VERSION?: string; // defaults to the version set in your package.json/devDependencies.nw, minus '-sdk'

      // Check your 'nw' version matches one of the prebuilt binaries here:
      // https://github.com/nwjs-ffmpeg-prebuilt/nwjs-ffmpeg-prebuilt/releases
      NWJS_FFMPEG?: "PATCH";
    }
  }
}

export { };
