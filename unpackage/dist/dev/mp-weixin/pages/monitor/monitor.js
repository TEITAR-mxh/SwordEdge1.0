"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_request = require("../../utils/request.js");
const utils_common = require("../../utils/common.js");
if (!Math) {
  (SeButton + SeCard + SeProgress)();
}
const SeCard = () => "../../components/se-card/se-card.js";
const SeButton = () => "../../components/se-button/se-button.js";
const SeProgress = () => "../../components/se-progress/se-progress.js";
const _sfc_main = {
  __name: "monitor",
  setup(__props) {
    const cameraEnabled = common_vendor.ref(false);
    const frameSize = common_vendor.ref("medium");
    const showSkeleton = common_vendor.ref(true);
    const isMonitoring = common_vendor.ref(false);
    const currentFPS = common_vendor.ref(0);
    const realtimeScore = common_vendor.ref(0);
    const scoreTrend = common_vendor.ref("stable");
    const scoreTrendText = common_vendor.ref("稳定");
    const keyMetrics = common_vendor.ref([
      { id: 1, icon: "角度", label: "姿态角度", value: "0°", status: "normal" },
      { id: 2, icon: "速度", label: "出剑速度", value: "0 m/s", status: "normal" },
      { id: 3, icon: "精准", label: "精准度", value: "0%", status: "normal" },
      { id: 4, icon: "力量", label: "力量指数", value: "0", status: "normal" }
    ]);
    const recognitionCount = common_vendor.ref(0);
    const recognizedActions = common_vendor.ref([]);
    let wsClient = null;
    common_vendor.onMounted(() => {
      requestCameraPermission();
    });
    common_vendor.onUnmounted(() => {
      if (isMonitoring.value) {
        stopMonitoring();
      }
      if (wsClient) {
        wsClient.close();
      }
    });
    const requestCameraPermission = () => {
      if (typeof common_vendor.index.authorize === "function") {
        common_vendor.index.authorize({
          scope: "scope.camera",
          success: () => {
            cameraEnabled.value = true;
          },
          fail: () => {
            common_vendor.index.showModal({
              title: "需要摄像头权限",
              content: "请在设置中开启摄像头权限以使用实时监控功能",
              confirmText: "去设置",
              success: (res) => {
                if (res.confirm) {
                  common_vendor.index.openSetting();
                }
              }
            });
          }
        });
      } else {
        cameraEnabled.value = true;
      }
    };
    const enableCamera = () => {
      requestCameraPermission();
    };
    const handleCameraError = (error) => {
      common_vendor.index.__f__("error", "at pages/monitor/monitor.vue:233", "摄像头错误:", error);
      common_vendor.index.showToast({
        title: "摄像头启动失败",
        icon: "none"
      });
    };
    const startMonitoring = async () => {
      try {
        common_vendor.index.showLoading({ title: "启动监控中..." });
        await utils_api.monitorAPI.startMonitor();
        wsClient = utils_request.createWebSocket("/ws/monitor");
        await wsClient.connect();
        wsClient.onMessage((data) => {
          handleRealtimeData(data);
        });
        isMonitoring.value = true;
        currentFPS.value = 30;
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "监控已启动",
          icon: "success"
        });
        startDataSimulation();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/monitor/monitor.vue:270", "启动监控失败:", error);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "启动失败",
          icon: "none"
        });
      }
    };
    const stopMonitoring = async () => {
      try {
        await utils_api.monitorAPI.stopMonitor();
        if (wsClient) {
          wsClient.close();
        }
        isMonitoring.value = false;
        currentFPS.value = 0;
        common_vendor.index.showToast({
          title: "监控已停止",
          icon: "success"
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/monitor/monitor.vue:297", "停止监控失败:", error);
      }
    };
    const handleRealtimeData = (data) => {
      if (data.score !== void 0) {
        const oldScore = realtimeScore.value;
        realtimeScore.value = data.score;
        if (data.score > oldScore + 2) {
          scoreTrend.value = "up";
          scoreTrendText.value = "上升";
        } else if (data.score < oldScore - 2) {
          scoreTrend.value = "down";
          scoreTrendText.value = "下降";
        } else {
          scoreTrend.value = "stable";
          scoreTrendText.value = "稳定";
        }
      }
      if (data.metrics) {
        keyMetrics.value = data.metrics;
      }
      if (data.action) {
        recognizedActions.value.unshift({
          id: Date.now(),
          time: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
          name: data.action.name,
          confidence: data.action.confidence
        });
        if (recognizedActions.value.length > 20) {
          recognizedActions.value.pop();
        }
        recognitionCount.value = recognizedActions.value.length;
      }
      if (data.fps) {
        currentFPS.value = data.fps;
      }
    };
    const captureFrame = () => {
      const ctx = common_vendor.index.createCameraContext();
      ctx.takePhoto({
        quality: "high",
        success: async (res) => {
          try {
            common_vendor.index.showLoading({ title: "分析中..." });
            const result = await utils_api.analysisAPI.analyzeFrame(res.tempImagePath);
            common_vendor.index.hideLoading();
            common_vendor.index.showModal({
              title: "分析结果",
              content: `评分: ${result.score}
姿态: ${result.posture}`,
              showCancel: false
            });
          } catch (error) {
            common_vendor.index.hideLoading();
            common_vendor.index.__f__("error", "at pages/monitor/monitor.vue:373", "截图分析失败:", error);
            common_vendor.index.showToast({
              title: "分析失败",
              icon: "none"
            });
          }
        },
        fail: (error) => {
          common_vendor.index.__f__("error", "at pages/monitor/monitor.vue:381", "截图失败:", error);
          common_vendor.index.showToast({
            title: "截图失败",
            icon: "none"
          });
        }
      });
    };
    let simulationTimer = null;
    const startDataSimulation = () => {
      simulationTimer = setInterval(() => {
        const delta = Math.floor(Math.random() * 5) - 2;
        realtimeScore.value = Math.max(0, Math.min(100, realtimeScore.value + delta));
        keyMetrics.value[0].value = `${Math.floor(Math.random() * 180)}°`;
        keyMetrics.value[1].value = `${(Math.random() * 5).toFixed(1)} m/s`;
        keyMetrics.value[2].value = `${Math.floor(Math.random() * 100)}%`;
        keyMetrics.value[3].value = `${Math.floor(Math.random() * 100)}`;
        if (Math.random() > 0.7) {
          const actions = ["前刺", "后撤", "防守", "进攻", "步法移动"];
          recognizedActions.value.unshift({
            id: Date.now(),
            time: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
            name: actions[Math.floor(Math.random() * actions.length)],
            confidence: 70 + Math.floor(Math.random() * 30)
          });
          if (recognizedActions.value.length > 20) {
            recognizedActions.value.pop();
          }
          recognitionCount.value = recognizedActions.value.length;
        }
      }, 2e3);
    };
    common_vendor.onUnmounted(() => {
      if (simulationTimer) {
        clearInterval(simulationTimer);
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: cameraEnabled.value
      }, cameraEnabled.value ? common_vendor.e({
        b: showSkeleton.value
      }, showSkeleton.value ? {} : {}, {
        c: frameSize.value,
        d: common_vendor.o(handleCameraError)
      }) : {
        e: common_vendor.o(enableCamera),
        f: common_vendor.p({
          type: "primary",
          text: "启用摄像头"
        })
      }, {
        g: isMonitoring.value ? 1 : "",
        h: common_vendor.t(isMonitoring.value ? "监控中" : "未监控"),
        i: common_vendor.t(currentFPS.value),
        j: common_vendor.t(realtimeScore.value),
        k: common_vendor.t(scoreTrend.value === "up" ? "↑" : scoreTrend.value === "down" ? "↓" : "−"),
        l: common_vendor.n(scoreTrend.value),
        m: common_vendor.t(scoreTrendText.value),
        n: common_vendor.p({
          variant: "primary"
        }),
        o: common_vendor.f(keyMetrics.value, (metric, k0, i0) => {
          return {
            a: common_vendor.t(metric.icon),
            b: common_vendor.t(metric.value),
            c: common_vendor.t(metric.label),
            d: metric.id,
            e: common_vendor.n(`metric-${metric.status}`)
          };
        }),
        p: common_vendor.t(recognitionCount.value),
        q: common_vendor.f(recognizedActions.value, (action, k0, i0) => {
          return {
            a: common_vendor.t(action.time),
            b: common_vendor.t(action.name),
            c: "8e8d1ccc-2-" + i0,
            d: common_vendor.p({
              percent: action.confidence,
              ["show-info"]: false,
              height: "8rpx",
              type: common_vendor.unref(utils_common.getConfidenceType)(action.confidence)
            }),
            e: common_vendor.t(action.confidence),
            f: action.id
          };
        }),
        r: recognizedActions.value.length === 0
      }, recognizedActions.value.length === 0 ? {} : {}, {
        s: !isMonitoring.value
      }, !isMonitoring.value ? {
        t: common_vendor.o(startMonitoring),
        v: common_vendor.p({
          type: "success",
          size: "large",
          icon: "play",
          text: "开始监控",
          block: true
        })
      } : {
        w: common_vendor.o(stopMonitoring),
        x: common_vendor.p({
          type: "danger",
          size: "large",
          icon: "pause",
          text: "停止"
        }),
        y: common_vendor.o(captureFrame),
        z: common_vendor.p({
          type: "primary",
          size: "large",
          icon: "camera",
          text: "截图"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-8e8d1ccc"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/monitor/monitor.js.map
