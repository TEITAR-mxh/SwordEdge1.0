"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_common = require("../../utils/common.js");
if (!Math) {
  (SeProgress + SeButton + SeCard)();
}
const SeCard = () => "../../components/se-card/se-card.js";
const SeButton = () => "../../components/se-button/se-button.js";
const SeProgress = () => "../../components/se-progress/se-progress.js";
const _sfc_main = {
  __name: "plans",
  setup(__props) {
    const currentPlan = common_vendor.ref({
      id: 1,
      badge: "进行中",
      title: "基础击剑入门",
      description: "适合初学者的系统化训练计划",
      currentWeek: 2,
      totalWeeks: 4,
      completed: 12,
      total: 24,
      remaining: 12
    });
    const dailyTasks = common_vendor.ref([
      {
        id: 1,
        name: "直刺基础练习",
        duration: "10分钟",
        difficulty: "easy",
        difficultyText: "简单",
        points: 50,
        completed: true
      },
      {
        id: 2,
        name: "步法移动训练",
        duration: "15分钟",
        difficulty: "medium",
        difficultyText: "中等",
        points: 80,
        completed: true
      },
      {
        id: 3,
        name: "姿态矫正练习",
        duration: "20分钟",
        difficulty: "medium",
        difficultyText: "中等",
        points: 100,
        completed: false
      }
    ]);
    const recommendedPlans = common_vendor.ref([
      {
        id: 2,
        title: "进阶步法训练",
        description: "提升移动速度和灵活性",
        level: "intermediate",
        levelText: "中级",
        duration: "6周",
        participants: 1250,
        rating: 4.8,
        hot: true
      },
      {
        id: 3,
        title: "实战技巧强化",
        description: "提高实战应用能力",
        level: "advanced",
        levelText: "高级",
        duration: "8周",
        participants: 890,
        rating: 4.9,
        hot: false
      },
      {
        id: 4,
        title: "力量与耐力提升",
        description: "增强体能和持久力",
        level: "beginner",
        levelText: "初级",
        duration: "4周",
        participants: 2100,
        rating: 4.6,
        hot: true
      }
    ]);
    const myPlans = common_vendor.ref([
      {
        id: 1,
        title: "基础击剑入门",
        icon: "⚔️",
        color: "rgba(59, 130, 246, 0.2)",
        progress: 50
      },
      {
        id: 5,
        title: "柔韧性训练",
        icon: "🧘",
        color: "rgba(16, 185, 129, 0.2)",
        progress: 25
      }
    ]);
    const completedToday = common_vendor.computed(() => {
      return dailyTasks.value.filter((task) => task.completed).length;
    });
    const totalPoints = common_vendor.computed(() => {
      return dailyTasks.value.filter((task) => task.completed).reduce((sum, task) => sum + task.points, 0);
    });
    const toggleTask = async (taskId) => {
      const task = dailyTasks.value.find((t) => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
        common_vendor.index.vibrateShort();
        if (task.completed) {
          common_vendor.index.showToast({
            title: `完成任务 +${task.points}`,
            icon: "success",
            duration: 1500
          });
        }
      }
    };
    const continuePlan = () => {
      common_vendor.index.switchTab({
        url: "/pages/monitor/monitor"
      });
    };
    const viewPlanDetail = (plan) => {
      common_vendor.index.navigateTo({
        url: `/pages/plans/detail?id=${plan.id}`
      });
    };
    const selectPlan = async (plan) => {
      try {
        const result = await common_vendor.index.showModal({
          title: "选择训练计划",
          content: `确定要开始「${plan.title}」训练计划吗？`,
          confirmText: "确定",
          cancelText: "取消"
        });
        if (result.confirm) {
          common_vendor.index.showLoading({ title: "加载中..." });
          await utils_api.planAPI.createPlan({
            planId: plan.id,
            startDate: (/* @__PURE__ */ new Date()).toISOString()
          });
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "计划已添加",
            icon: "success"
          });
        }
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/plans/plans.vue:362", "选择计划失败:", error);
        common_vendor.index.showToast({
          title: "操作失败",
          icon: "none"
        });
      }
    };
    const viewAllPlans = () => {
      common_vendor.index.navigateTo({
        url: "/pages/plans/list"
      });
    };
    const scrollToRecommended = () => {
    };
    const getCircleProgress = (progress) => {
      return utils_common.getCircleProgressStyle(progress);
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: currentPlan.value
      }, currentPlan.value ? {
        b: common_vendor.t(currentPlan.value.badge),
        c: common_vendor.t(currentPlan.value.title),
        d: common_vendor.t(currentPlan.value.description),
        e: common_vendor.t(currentPlan.value.currentWeek),
        f: common_vendor.t(currentPlan.value.totalWeeks),
        g: common_vendor.p({
          percent: currentPlan.value.currentWeek / currentPlan.value.totalWeeks * 100,
          ["show-info"]: false,
          type: "success",
          active: true
        }),
        h: common_vendor.t(currentPlan.value.completed),
        i: common_vendor.t(currentPlan.value.total),
        j: common_vendor.t(currentPlan.value.remaining),
        k: common_vendor.o(continuePlan),
        l: common_vendor.p({
          type: "primary",
          icon: "play",
          text: "继续训练",
          block: true
        }),
        m: common_vendor.p({
          title: "当前训练计划"
        })
      } : {}, {
        n: common_vendor.f(dailyTasks.value, (task, k0, i0) => {
          return common_vendor.e({
            a: task.completed
          }, task.completed ? {} : {}, {
            b: task.completed ? 1 : "",
            c: common_vendor.t(task.name),
            d: common_vendor.t(task.duration),
            e: common_vendor.t(task.difficultyText),
            f: common_vendor.n(`difficulty-${task.difficulty}`),
            g: common_vendor.t(task.points),
            h: task.id,
            i: task.completed ? 1 : "",
            j: common_vendor.o(($event) => toggleTask(task.id), task.id)
          });
        }),
        o: dailyTasks.value.length === 0
      }, dailyTasks.value.length === 0 ? {} : {}, {
        p: completedToday.value === dailyTasks.value.length && dailyTasks.value.length > 0
      }, completedToday.value === dailyTasks.value.length && dailyTasks.value.length > 0 ? {
        q: common_vendor.t(totalPoints.value)
      } : {}, {
        r: common_vendor.p({
          title: "今日任务",
          subtitle: `${completedToday.value}/${dailyTasks.value.length} 已完成`
        }),
        s: common_vendor.o(viewAllPlans),
        t: common_vendor.f(recommendedPlans.value, (plan, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(plan.levelText),
            b: common_vendor.n(`badge-${plan.level}`),
            c: plan.hot
          }, plan.hot ? {} : {}, {
            d: common_vendor.t(plan.title),
            e: common_vendor.t(plan.description),
            f: common_vendor.t(plan.duration),
            g: common_vendor.t(plan.participants),
            h: common_vendor.t(plan.rating),
            i: common_vendor.o(($event) => selectPlan(plan), plan.id),
            j: "80c07444-5-" + i0 + "," + ("80c07444-4-" + i0),
            k: plan.id,
            l: common_vendor.o(($event) => viewPlanDetail(plan), plan.id),
            m: "80c07444-4-" + i0
          });
        }),
        v: common_vendor.p({
          type: "primary",
          size: "small",
          text: "选择"
        }),
        w: common_vendor.p({
          hover: true
        }),
        x: common_vendor.f(myPlans.value, (plan, k0, i0) => {
          return {
            a: common_vendor.t(plan.icon),
            b: plan.color,
            c: common_vendor.t(plan.title),
            d: common_vendor.t(plan.progress),
            e: common_vendor.t(plan.progress),
            f: common_vendor.s(getCircleProgress(plan.progress)),
            g: plan.id,
            h: common_vendor.o(($event) => viewPlanDetail(plan), plan.id)
          };
        }),
        y: myPlans.value.length === 0
      }, myPlans.value.length === 0 ? {
        z: common_vendor.o(scrollToRecommended),
        A: common_vendor.p({
          type: "primary",
          size: "small",
          text: "选择计划"
        })
      } : {}, {
        B: common_vendor.p({
          title: "我的计划"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-80c07444"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/plans/plans.js.map
