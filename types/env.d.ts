declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      EXECUTION_MODE?: "DEBUG";
      LAUNCHER_PORT?: string;
      DEBUG_PORT?: string;
      // nwts-package
      BUILD_DIRECTORY?: string; // default: "build"
      PACKAGE_DIRECTORY?: string; // default: "dist"
      NWJS_FFMPEG?: "PATCH";
      PACKAGE_TYPE?: "normal" | "zip";
      // & nwts-patch-codecs
      NWJS_VERSION?: string;
    }
  }
}

export { };
