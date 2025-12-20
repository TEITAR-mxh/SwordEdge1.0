"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_common = require("../../utils/common.js");
if (!Math) {
  (SeStatCard + SeCard + SeButton)();
}
const SeCard = () => "../../components/se-card/se-card.js";
const SeStatCard = () => "../../components/se-stat-card/se-stat-card.js";
const SeButton = () => "../../components/se-button/se-button.js";
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userName = common_vendor.ref("剑客");
    const userAvatar = common_vendor.ref("/static/images/avatar-default.png");
    const dailyMotivation = common_vendor.ref("千锤百炼，铸就不凡。今天也要全力以赴！");
    const quickActions = common_vendor.ref([
      {
        id: 1,
        iconClass: "icon-video",
        label: "视频分析",
        gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        // 主色调渐变
        action: "analysis"
      },
      {
        id: 2,
        iconClass: "icon-monitor",
        label: "实时监控",
        gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        // 成功色渐变
        action: "monitor"
      },
      {
        id: 3,
        iconClass: "icon-clipboard",
        label: "训练计划",
        gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        // 警告色渐变
        action: "plans"
      },
      {
        id: 4,
        iconClass: "icon-target",
        label: "技能提升",
        gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        // 危险色渐变
        action: "skills"
      }
    ]);
    const trainingStats = common_vendor.ref([
      {
        id: 1,
        icon: "trophy",
        value: "89",
        label: "综合评分",
        type: "success",
        trend: "up",
        trendValue: "+5"
      },
      {
        id: 2,
        icon: "fire",
        value: "12",
        label: "连续训练",
        type: "warning",
        trend: null,
        trendValue: ""
      },
      {
        id: 3,
        icon: "clock",
        value: "45h",
        label: "累计时长",
        type: "primary",
        trend: "up",
        trendValue: "+8h"
      },
      {
        id: 4,
        icon: "chart",
        value: "156",
        label: "训练次数",
        type: "info",
        trend: "up",
        trendValue: "+12"
      }
    ]);
    const recentRecords = common_vendor.ref([
      {
        id: 1,
        type: "击剑训练",
        date: "2025-12-17 14:30",
        score: 92,
        duration: "45分钟",
        status: "excellent",
        statusText: "优秀"
      },
      {
        id: 2,
        type: "步法练习",
        date: "2025-12-16 10:15",
        score: 85,
        duration: "30分钟",
        status: "good",
        statusText: "良好"
      },
      {
        id: 3,
        type: "姿态矫正",
        date: "2025-12-15 16:00",
        score: 78,
        duration: "25分钟",
        status: "normal",
        statusText: "一般"
      }
    ]);
    const recommendPlans = common_vendor.ref([
      {
        id: 1,
        badge: "热门",
        badgeType: "hot",
        title: "基础击剑入门",
        description: "适合初学者的系统训练计划",
        duration: "4周",
        difficulty: "初级"
      },
      {
        id: 2,
        badge: "推荐",
        badgeType: "recommend",
        title: "进阶步法训练",
        description: "提升移动速度和灵活性",
        duration: "6周",
        difficulty: "中级"
      },
      {
        id: 3,
        badge: "精选",
        badgeType: "premium",
        title: "实战技巧强化",
        description: "提高实战应用能力",
        duration: "8周",
        difficulty: "高级"
      }
    ]);
    common_vendor.onMounted(() => {
      loadUserInfo();
      loadTrainingData();
    });
    const loadUserInfo = () => {
      const userInfo = common_vendor.index.getStorageSync("userInfo");
      if (userInfo) {
        userName.value = userInfo.name || "剑客";
        userAvatar.value = "/static/images/avatar-default.png";
      }
    };
    const loadTrainingData = async () => {
      try {
        const stats = await utils_api.trainingAPI.getTrainingStats();
        if (stats) {
          common_vendor.index.__f__("log", "at pages/index/index.vue:310", "训练统计:", stats);
        }
        const records = await utils_api.trainingAPI.getTrainingList({ limit: 3 });
        if (records && records.length > 0) {
          recentRecords.value = records;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:319", "加载训练数据失败:", error);
      }
    };
    const handleQuickAction = (action) => {
      switch (action.action) {
        case "analysis":
          common_vendor.index.switchTab({ url: "/pages/analysis/analysis" });
          break;
        case "monitor":
          common_vendor.index.switchTab({ url: "/pages/monitor/monitor" });
          break;
        case "plans":
          common_vendor.index.switchTab({ url: "/pages/plans/plans" });
          break;
        case "skills":
          common_vendor.index.showToast({ title: "功能开发中", icon: "none" });
          break;
      }
    };
    const handleStatClick = (stat) => {
      common_vendor.index.__f__("log", "at pages/index/index.vue:343", "查看统计详情:", stat);
      common_vendor.index.switchTab({ url: "/pages/analysis/analysis" });
    };
    const viewRecordDetail = (record) => {
      common_vendor.index.navigateTo({
        url: `/pages/analysis/detail?id=${record.id}`
      });
    };
    const viewPlanDetail = (plan) => {
      common_vendor.index.navigateTo({
        url: `/pages/plans/detail?id=${plan.id}`
      });
    };
    const startTraining = () => {
      common_vendor.index.switchTab({ url: "/pages/monitor/monitor" });
    };
    const goToProfile = () => {
      common_vendor.index.switchTab({ url: "/pages/profile/profile" });
    };
    const goToAnalysis = () => {
      common_vendor.index.switchTab({ url: "/pages/analysis/analysis" });
    };
    const goToPlans = () => {
      common_vendor.index.switchTab({ url: "/pages/plans/plans" });
    };
    const getScoreRingStyle = (score) => {
      return utils_common.getCircleProgressStyle(score);
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(userName.value),
        b: userAvatar.value,
        c: common_vendor.o(goToProfile),
        d: common_vendor.t(dailyMotivation.value),
        e: common_vendor.f(quickActions.value, (action, k0, i0) => {
          return {
            a: common_vendor.n(action.iconClass),
            b: common_vendor.t(action.label),
            c: action.id,
            d: action.gradient,
            e: common_vendor.o(($event) => handleQuickAction(action), action.id)
          };
        }),
        f: common_vendor.o(goToAnalysis),
        g: common_vendor.f(trainingStats.value, (stat, k0, i0) => {
          return {
            a: stat.id,
            b: common_vendor.o(($event) => handleStatClick(stat), stat.id),
            c: "1cf27b2a-0-" + i0,
            d: common_vendor.p({
              icon: stat.icon,
              value: stat.value,
              label: stat.label,
              type: stat.type,
              trend: stat.trend,
              ["trend-value"]: stat.trendValue
            })
          };
        }),
        h: common_vendor.o(goToAnalysis),
        i: common_vendor.f(recentRecords.value, (record, k0, i0) => {
          return {
            a: common_vendor.t(record.type),
            b: common_vendor.t(record.date),
            c: common_vendor.t(record.score),
            d: common_vendor.s(getScoreRingStyle(record.score)),
            e: common_vendor.t(record.duration),
            f: common_vendor.t(record.statusText),
            g: common_vendor.n(`status-${record.status}`),
            h: record.id,
            i: common_vendor.o(($event) => viewRecordDetail(record), record.id),
            j: "1cf27b2a-1-" + i0
          };
        }),
        j: common_vendor.p({
          hover: true,
          padding: "24rpx"
        }),
        k: recentRecords.value.length === 0
      }, recentRecords.value.length === 0 ? {
        l: common_vendor.o(startTraining),
        m: common_vendor.p({
          type: "primary",
          text: "开始训练"
        })
      } : {}, {
        n: common_vendor.o(goToPlans),
        o: common_vendor.f(recommendPlans.value, (plan, k0, i0) => {
          return {
            a: common_vendor.t(plan.badge),
            b: common_vendor.n(`badge-${plan.badgeType}`),
            c: common_vendor.t(plan.title),
            d: common_vendor.t(plan.description),
            e: common_vendor.t(plan.duration),
            f: common_vendor.t(plan.difficulty),
            g: plan.id,
            h: common_vendor.o(($event) => viewPlanDetail(plan), plan.id),
            i: "1cf27b2a-3-" + i0
          };
        }),
        p: common_vendor.p({
          hover: true,
          variant: "gradient"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
