declare global {
  module NWJS_Helpers {
    interface win {
      cWindow: { tabs: chrome.tabs.Tab[] }
    }
  }
}

export {}
