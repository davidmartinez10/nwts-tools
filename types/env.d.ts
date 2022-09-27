declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      EXECUTION_MODE?: "DEBUG";
      LAUNCHER_PORT?: string;
      DEBUG_PORT?: string;
      // nwts-package
      BUILD_DIRECTORY?: string;
      PACKAGE_DIRECTORY?: string;
      NWJS_FFMPEG?: "PATCH";
      PACKAGE_TYPE?: "normal" | "zip";
      // & nwts-patch-codecs
      NWJS_VERSION?: string;
    }
  }
}

export { };
