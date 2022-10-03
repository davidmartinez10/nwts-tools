import { Permission } from "./shared";

type Protocol = "http" | "https" | "tcp" | "udp" | "ws" | string;
type Subdomain = string;
type Domain = "localhost" | string;
type TLD = "com" | "net" | "org" | string;
type Hostname = Domain | `${Subdomain}.${Domain}.${TLD}` | `${Domain}.${TLD}`;
type Host = `${Protocol}://${Hostname}` | `${Protocol}://${Hostname}:${number}`;
type Location = Host | `${Host}/${string}`
type URLLike = Location | "<all_urls>" | string;

export type Permission =
  "activeTab" |
  "alarms" |
  "background" |
  "bookmarks" |
  "browsingData" |
  "certificateProvider" |
  "clipboardRead" |
  "clipboardWrite" |
  "contentSettings" |
  "contextMenus" |
  "cookies" |
  "debugger" |
  "declarativeContent" |
  "declarativeNetRequest" |
  "declarativeNetRequestFeedback" |
  "declarativeWebRequest" |
  "desktopCapture" |
  "documentScan" |
  "downloads" |
  "enterprise.deviceAttributes" |
  "enterprise.hardwarePlatform" |
  "enterprise.networkingAttributes" |
  "enterprise.platformKeys" |
  "experimental" |
  "fileBrowserHandler" |
  "fileSystemProvider" |
  "fontSettings" |
  "geolocation" |
  "history" |
  "identity" |
  "idle" |
  "loginState" |
  "management" |
  "nativeMessaging" |
  "notifications" |
  "pageCapture" |
  "platformKeys" |
  "power" |
  "printerProvider" |
  "printing" |
  "printingMetrics" |
  "privacy" |
  "processes" |
  "proxy" |
  "scripting" |
  "search" |
  "sessions" |
  "signedInDevices" |
  "storage" |
  "system.cpu" |
  "system.display" |
  "system.memory" |
  "system.storage" |
  "tabCapture" |
  "tabGroups" |
  "tabs" |
  "topSites" |
  "tts" |
  "ttsEngine" |
  "unlimitedStorage" |
  "vpnProvider" |
  "wallpaper" |
  "webNavigation" |
  "webRequest" |
  "webRequestBlocking" |
  "<all_urls>";

export interface NWJSManifest {
  // required
  name: string;
  main: string;

  // optional
  domain?: string;
  product_string?: string;
  nodejs?: boolean;
  "node-main"?: string;
  "bg-script"?: string;
  window: {
    id?: string;
    title?: string;
    width?: number;
    height?: number;
    icon?: string;
    position?: "center" | "mouse";
    min_width?: number;
    min_height?: number;
    max_width?: number;
    max_height?: number;
    as_desktop?: boolean;
    resizable?: boolean;
    always_on_top?: boolean;
    visible_on_all_workspaces?: boolean;
    fullscreen?: boolean;
    show_in_taskbar?: boolean;
    frame?: boolean;
    show?: boolean;
    kiosk?: boolean;
    tranparent?: boolean;
  },
  webkit?: {
    double_tap_to_zoom_enabled?: boolean;
    plugin?: boolean;
  },
  "user-agent"?: string;
  "node-remote"?: URLLike | URLLike[];
  "chromium-args"?: string;
  crash_report_url?: URLLike;
  "js-flags"?: string;
  inject_js_start?: string;
  inject_js_end?: string;
  additional_trust_anchors?: string[];
  dom_storage_quota?: string[];
  permissions?: Permission[];

  // deprecated
  "single-instance"?: boolean;
  "no-edit-menu"?: boolean;
  "toolbar"?: boolean;
};
