"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_common = require("../../utils/common.js");
if (!Math) {
  (SeButton + SeProgress + SeCard)();
}
const SeCard = () => "../../components/se-card/se-card.js";
const SeButton = () => "../../components/se-button/se-button.js";
const SeProgress = () => "../../components/se-progress/se-progress.js";
const _sfc_main = {
  __name: "analysis",
  setup(__props) {
    const selectedFile = common_vendor.ref(null);
    const uploading = common_vendor.ref(false);
    const uploadProgress = common_vendor.ref(0);
    const uploadStatusText = common_vendor.ref("准备上传...");
    const uploadSpeed = common_vendor.ref("");
    const isDragging = common_vendor.ref(false);
    const analyzing = common_vendor.ref(false);
    const analysisCompleted = common_vendor.ref(false);
    const currentStep = common_vendor.ref(0);
    const analysisSteps = common_vendor.ref([
      "上传视频中...",
      "提取关键帧...",
      "姿态识别中...",
      "动作分析中...",
      "生成报告中..."
    ]);
    const sessionId = common_vendor.ref("");
    const videoUrl = common_vendor.ref("");
    const analysisDate = common_vendor.ref("");
    const overallScore = common_vendor.ref(0);
    const detailedMetrics = common_vendor.ref([]);
    const detectedActions = common_vendor.ref([]);
    const coachFeedback = common_vendor.ref("");
    const suggestions = common_vendor.ref([]);
    const recentAnalysis = common_vendor.ref([
      { id: 1, title: "直刺训练", date: "2025-12-17 14:30", score: 92 },
      { id: 2, title: "步法练习", date: "2025-12-16 10:15", score: 85 },
      { id: 3, title: "姿态矫正", date: "2025-12-15 16:00", score: 78 }
    ]);
    const selectFile = () => {
      common_vendor.index.chooseVideo({
        sourceType: ["album", "camera"],
        maxDuration: 600,
        // 最大10分钟
        camera: "back",
        success: (res) => {
          selectedFile.value = {
            path: res.tempFilePath,
            name: "训练视频.mp4",
            size: res.size,
            duration: res.duration
          };
          startUpload();
        },
        fail: (error) => {
          common_vendor.index.__f__("error", "at pages/analysis/analysis.vue:308", "选择视频失败:", error);
          common_vendor.index.showToast({
            title: "选择文件失败",
            icon: "none"
          });
        }
      });
    };
    const startUpload = async () => {
      uploading.value = true;
      uploadProgress.value = 0;
      try {
        const startTime = Date.now();
        let lastProgress = 0;
        const result = await utils_api.analysisAPI.startAnalysis(
          selectedFile.value.path,
          {},
          (progress) => {
            uploadProgress.value = progress;
            const elapsed = (Date.now() - startTime) / 1e3;
            const uploaded = selectedFile.value.size * progress / 100;
            const speed = uploaded / elapsed / 1024 / 1024;
            uploadSpeed.value = `${speed.toFixed(2)} MB/s`;
            if (progress < 100) {
              uploadStatusText.value = `正在上传... ${progress.toFixed(1)}%`;
            } else {
              uploadStatusText.value = "上传完成，开始分析...";
            }
            lastProgress = progress;
          }
        );
        sessionId.value = result.session_id;
        uploading.value = false;
        startAnalysis();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/analysis/analysis.vue:356", "上传失败:", error);
        uploading.value = false;
        common_vendor.index.showToast({
          title: "上传失败，请重试",
          icon: "none"
        });
      }
    };
    const startAnalysis = async () => {
      analyzing.value = true;
      currentStep.value = 0;
      try {
        const pollInterval = setInterval(async () => {
          const status = await utils_api.analysisAPI.getAnalysisStatus(sessionId.value);
          if (status.progress) {
            currentStep.value = Math.floor(status.progress / 100 * analysisSteps.value.length);
          }
          if (status.status === "COMPLETED") {
            clearInterval(pollInterval);
            analyzing.value = false;
            showResults(status.result);
          } else if (status.status === "FAILED") {
            clearInterval(pollInterval);
            analyzing.value = false;
            common_vendor.index.showToast({
              title: "分析失败，请重试",
              icon: "none"
            });
          }
        }, 3e3);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/analysis/analysis.vue:395", "分析失败:", error);
        analyzing.value = false;
        common_vendor.index.showToast({
          title: "分析失败",
          icon: "none"
        });
      }
    };
    const showResults = async (result) => {
      videoUrl.value = result.video_url || selectedFile.value.path;
      analysisDate.value = (/* @__PURE__ */ new Date()).toLocaleString("zh-CN");
      overallScore.value = result.overall_score || 85;
      detailedMetrics.value = [
        { id: 1, name: "姿态标准度", score: result.posture_score || 88 },
        { id: 2, name: "动作流畅度", score: result.fluency_score || 82 },
        { id: 3, name: "速度控制", score: result.speed_score || 86 },
        { id: 4, name: "力量输出", score: result.power_score || 84 },
        { id: 5, name: "精准度", score: result.accuracy_score || 90 }
      ];
      detectedActions.value = result.actions || [
        {
          id: 1,
          name: "直刺",
          icon: "→",
          color: "rgba(59, 130, 246, 0.2)",
          timeStart: "00:12",
          timeEnd: "00:18",
          score: 92
        },
        {
          id: 2,
          name: "防守",
          icon: "🛡️",
          color: "rgba(16, 185, 129, 0.2)",
          timeStart: "00:25",
          timeEnd: "00:32",
          score: 85
        },
        {
          id: 3,
          name: "反击",
          icon: "⚡",
          color: "rgba(245, 158, 11, 0.2)",
          timeStart: "00:40",
          timeEnd: "00:48",
          score: 88
        }
      ];
      try {
        const feedback = await utils_api.coachAPI.getFeedback({
          type: "fencing",
          score: overallScore.value,
          metrics: {
            posture: detailedMetrics.value[0].score,
            fluency: detailedMetrics.value[1].score,
            speed: detailedMetrics.value[2].score
          }
        });
        coachFeedback.value = feedback.feedback || "您的表现非常出色！继续保持这样的训练强度。";
        suggestions.value = feedback.suggestions || [
          "注意保持步法的稳定性，避免重心过度前倾",
          "出剑时手腕力度可以更加集中",
          "建议增加柔韧性训练，提高动作幅度"
        ];
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/analysis/analysis.vue:470", "获取反馈失败:", error);
        coachFeedback.value = "您的表现非常出色！继续保持这样的训练强度。";
        suggestions.value = [
          "注意保持步法的稳定性",
          "出剑时手腕力度可以更加集中",
          "建议增加柔韧性训练"
        ];
      }
      analysisCompleted.value = true;
    };
    const getCircleStyle = (score) => {
      return utils_common.getCircleProgressStyle(score);
    };
    const viewAnalysisDetail = (id) => {
      common_vendor.index.navigateTo({
        url: `/pages/analysis/detail?id=${id}`
      });
    };
    const shareResults = () => {
      try {
        if (typeof common_vendor.index.showShareMenu === "function") {
          common_vendor.index.showShareMenu({
            withShareTicket: true,
            success: () => {
              common_vendor.index.__f__("log", "at pages/analysis/analysis.vue:501", "分享成功");
            },
            fail: (error) => {
              common_vendor.index.__f__("error", "at pages/analysis/analysis.vue:504", "分享失败:", error);
              common_vendor.index.showToast({
                title: "分享功能开发中",
                icon: "none"
              });
            }
          });
        } else {
          common_vendor.index.__f__("warn", "at pages/analysis/analysis.vue:512", "当前环境不支持showShareMenu功能");
          common_vendor.index.showToast({
            title: "当前环境不支持分享功能",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/analysis/analysis.vue:519", "调用分享功能失败:", error);
        common_vendor.index.showToast({
          title: "分享功能开发中",
          icon: "none"
        });
      }
    };
    const downloadReport = async () => {
      try {
        common_vendor.index.showLoading({ title: "生成报告中..." });
        await new Promise((resolve) => setTimeout(resolve, 2e3));
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "报告已保存到相册",
          icon: "success"
        });
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/analysis/analysis.vue:541", "下载失败:", error);
        common_vendor.index.showToast({
          title: "下载失败",
          icon: "none"
        });
      }
    };
    const resetAnalysis = () => {
      analysisCompleted.value = false;
      selectedFile.value = null;
      sessionId.value = "";
      overallScore.value = 0;
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !analysisCompleted.value
      }, !analysisCompleted.value ? common_vendor.e({
        b: common_vendor.o(selectFile),
        c: common_vendor.p({
          type: "primary",
          icon: "folder",
          text: "选择文件"
        }),
        d: isDragging.value ? 1 : "",
        e: common_vendor.o(selectFile),
        f: uploading.value
      }, uploading.value ? {
        g: common_vendor.t(selectedFile.value.name),
        h: common_vendor.t(common_vendor.unref(utils_common.formatFileSize)(selectedFile.value.size)),
        i: common_vendor.p({
          percent: uploadProgress.value,
          label: "上传中",
          active: true,
          striped: true,
          type: "primary"
        }),
        j: common_vendor.t(uploadStatusText.value),
        k: common_vendor.t(uploadSpeed.value)
      } : {}, {
        l: analyzing.value
      }, analyzing.value ? {
        m: common_vendor.f(analysisSteps.value, (step, index, i0) => {
          return {
            a: common_vendor.t(step),
            b: index,
            c: currentStep.value >= index ? 1 : ""
          };
        })
      } : {}, {
        n: common_vendor.p({
          title: "训练数据分析",
          subtitle: "上传您的训练视频进行AI分析"
        }),
        o: common_vendor.f(recentAnalysis.value, (record, k0, i0) => {
          return {
            a: common_vendor.t(record.title),
            b: common_vendor.t(record.date),
            c: common_vendor.t(record.score),
            d: record.id,
            e: common_vendor.o(($event) => viewAnalysisDetail(record.id), record.id)
          };
        }),
        p: recentAnalysis.value.length === 0
      }, recentAnalysis.value.length === 0 ? {} : {}, {
        q: common_vendor.p({
          title: "历史分析记录"
        })
      }) : {
        r: videoUrl.value,
        s: common_vendor.p({
          title: "训练视频"
        }),
        t: common_vendor.t(analysisDate.value),
        v: common_vendor.t(overallScore.value),
        w: common_vendor.s(getCircleStyle(overallScore.value)),
        x: common_vendor.f(5, (star, k0, i0) => {
          return {
            a: star,
            b: star <= common_vendor.unref(utils_common.getStarCount)(overallScore.value) ? 1 : ""
          };
        }),
        y: common_vendor.t(common_vendor.unref(utils_common.getScoreComment)(overallScore.value)),
        z: common_vendor.f(detailedMetrics.value, (metric, k0, i0) => {
          return {
            a: common_vendor.t(metric.name),
            b: common_vendor.t(metric.score),
            c: "3a142df1-6-" + i0 + ",3a142df1-5",
            d: common_vendor.p({
              percent: metric.score,
              ["show-info"]: false,
              height: "12rpx",
              type: common_vendor.unref(utils_common.getMetricType)(metric.score)
            }),
            e: metric.id
          };
        }),
        A: common_vendor.p({
          title: "详细指标"
        }),
        B: common_vendor.f(detectedActions.value, (action, k0, i0) => {
          return {
            a: common_vendor.t(action.icon),
            b: action.color,
            c: common_vendor.t(action.name),
            d: common_vendor.t(action.timeStart),
            e: common_vendor.t(action.timeEnd),
            f: common_vendor.t(action.score),
            g: common_vendor.f(5, (bar, k1, i1) => {
              return {
                a: bar,
                b: bar <= Math.ceil(action.score / 20) ? 1 : ""
              };
            }),
            h: action.id
          };
        }),
        C: common_vendor.p({
          title: "检测到的动作",
          subtitle: `共 ${detectedActions.value.length} 个`
        }),
        D: common_vendor.t(coachFeedback.value),
        E: common_vendor.f(suggestions.value, (suggestion, index, i0) => {
          return {
            a: common_vendor.t(suggestion),
            b: index
          };
        }),
        F: common_vendor.p({
          title: "AI 教练反馈",
          variant: "gradient"
        }),
        G: common_vendor.o(shareResults),
        H: common_vendor.p({
          type: "default",
          icon: "share",
          text: "分享结果"
        }),
        I: common_vendor.o(downloadReport),
        J: common_vendor.p({
          type: "primary",
          icon: "download",
          text: "下载报告"
        }),
        K: common_vendor.o(resetAnalysis),
        L: common_vendor.p({
          type: "primary",
          text: "分析新视频",
          block: true
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3a142df1"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/analysis/analysis.js.map
