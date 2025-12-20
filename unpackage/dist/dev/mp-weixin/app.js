"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/monitor/monitor.js";
  "./pages/analysis/analysis.js";
  "./pages/plans/plans.js";
  "./pages/profile/profile.js";
  "./pages/login/login.js";
}
const _sfc_main = {
  __name: "App",
  setup(__props) {
    common_vendor.onLaunch(() => {
      common_vendor.index.__f__("log", "at App.vue:6", "App Launch");
      checkLoginStatus();
      initTheme();
    });
    common_vendor.onShow(() => {
      common_vendor.index.__f__("log", "at App.vue:17", "App Show");
    });
    common_vendor.onHide(() => {
      common_vendor.index.__f__("log", "at App.vue:22", "App Hide");
    });
    const checkLoginStatus = () => {
      const token = common_vendor.index.getStorageSync("token");
      if (!token) {
        common_vendor.index.redirectTo({ url: "/pages/login/login" });
      }
    };
    const initTheme = () => {
      common_vendor.index.setNavigationBarColor({
        frontColor: "#ffffff",
        backgroundColor: "#0c0a15"
      });
    };
    return () => {
    };
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
