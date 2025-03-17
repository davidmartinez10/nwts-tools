declare global {
  namespace NWJS_Helpers {
  interface win {
    cWindow: { tabs: chrome.tabs.Tab[] }
  }
  }
}

export {};
