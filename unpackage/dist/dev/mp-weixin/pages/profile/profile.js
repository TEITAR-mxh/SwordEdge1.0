"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
if (!Math) {
  SeCard();
}
const SeCard = () => "../../components/se-card/se-card.js";
const _sfc_main = {
  __name: "profile",
  setup(__props) {
    const userInfo = common_vendor.ref({
      name: "剑客001",
      avatar: "/static/images/avatar-default.png",
      bio: "中级训练者 · 连续训练12天",
      badges: [
        { id: 1, icon: "🏆", text: "中级", color: "rgba(59, 130, 246, 0.2)" },
        { id: 2, icon: "🔥", text: "12天", color: "rgba(245, 158, 11, 0.2)" },
        { id: 3, icon: "⭐", text: "Lv.5", color: "rgba(16, 185, 129, 0.2)" }
      ]
    });
    const stats = common_vendor.ref([
      { id: 1, label: "训练次数", value: "156" },
      { id: 2, label: "累计时长", value: "45h" },
      { id: 3, label: "平均评分", value: "89" },
      { id: 4, label: "经验值", value: "1250" }
    ]);
    const menuItems = common_vendor.ref([
      {
        id: 1,
        icon: "📊",
        iconBg: "rgba(59, 130, 246, 0.2)",
        title: "训练报告",
        value: "",
        action: "report"
      },
      {
        id: 2,
        icon: "🏆",
        iconBg: "rgba(245, 158, 11, 0.2)",
        title: "成就徽章",
        value: "12个",
        action: "achievements"
      },
      {
        id: 3,
        icon: "📈",
        iconBg: "rgba(16, 185, 129, 0.2)",
        title: "数据统计",
        value: "",
        action: "statistics"
      },
      {
        id: 4,
        icon: "🎯",
        iconBg: "rgba(236, 72, 153, 0.2)",
        title: "训练目标",
        value: "",
        action: "goals",
        divider: true
      },
      {
        id: 5,
        icon: "⚙️",
        iconBg: "rgba(100, 116, 139, 0.2)",
        title: "设备管理",
        value: "",
        action: "devices"
      },
      {
        id: 6,
        icon: "📱",
        iconBg: "rgba(6, 182, 212, 0.2)",
        title: "分享应用",
        value: "",
        action: "share"
      },
      {
        id: 7,
        icon: "💬",
        iconBg: "rgba(168, 85, 247, 0.2)",
        title: "意见反馈",
        value: "",
        action: "feedback"
      },
      {
        id: 8,
        icon: "ℹ️",
        iconBg: "rgba(71, 85, 105, 0.2)",
        title: "关于我们",
        value: "",
        action: "about"
      }
    ]);
    const settings = common_vendor.ref([
      {
        id: "voice",
        title: "语音指导",
        desc: "训练过程中提供语音提示",
        type: "toggle",
        value: true
      },
      {
        id: "vibration",
        title: "震动反馈",
        desc: "动作检测时震动提醒",
        type: "toggle",
        value: true
      },
      {
        id: "autoSave",
        title: "自动保存",
        desc: "自动保存训练视频",
        type: "toggle",
        value: false
      },
      {
        id: "quality",
        title: "视频质量",
        desc: "",
        type: "picker",
        options: ["标清", "高清", "超清"],
        value: 1
      }
    ]);
    const changeAvatar = () => {
      common_vendor.index.showToast({
        title: "当前版本使用默认头像",
        icon: "none"
      });
    };
    const viewStatDetail = (stat) => {
      common_vendor.index.navigateTo({
        url: `/pages/profile/statistics?type=${stat.id}`
      });
    };
    const handleMenuClick = (menu) => {
      switch (menu.action) {
        case "report":
          common_vendor.index.navigateTo({ url: "/pages/profile/report" });
          break;
        case "achievements":
          common_vendor.index.navigateTo({ url: "/pages/profile/achievements" });
          break;
        case "statistics":
          common_vendor.index.navigateTo({ url: "/pages/profile/statistics" });
          break;
        case "goals":
          common_vendor.index.navigateTo({ url: "/pages/profile/goals" });
          break;
        case "devices":
          common_vendor.index.navigateTo({ url: "/pages/profile/devices" });
          break;
        case "share":
          shareApp();
          break;
        case "feedback":
          common_vendor.index.navigateTo({ url: "/pages/profile/feedback" });
          break;
        case "about":
          common_vendor.index.navigateTo({ url: "/pages/profile/about" });
          break;
      }
    };
    const toggleSetting = async (settingId) => {
      const setting = settings.value.find((s) => s.id === settingId);
      if (setting) {
        setting.value = !setting.value;
        if (setting.value) {
          common_vendor.index.vibrateShort();
        }
        try {
          await utils_api.settingsAPI.updateSettings({
            [settingId]: setting.value
          });
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/profile/profile.vue:331", "保存设置失败:", error);
        }
      }
    };
    const handlePickerChange = async (e, settingId) => {
      const setting = settings.value.find((s) => s.id === settingId);
      if (setting) {
        setting.value = e.detail.value;
        try {
          await utils_api.settingsAPI.updateSettings({
            [settingId]: setting.value
          });
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/profile/profile.vue:348", "保存设置失败:", error);
        }
      }
    };
    const editProfile = () => {
      common_vendor.index.navigateTo({
        url: "/pages/profile/edit"
      });
    };
    const changePassword = () => {
      common_vendor.index.navigateTo({
        url: "/pages/profile/password"
      });
    };
    const exportData = async () => {
      try {
        const result = await common_vendor.index.showModal({
          title: "导出数据",
          content: "确定要导出所有训练数据吗？",
          confirmText: "确定",
          cancelText: "取消"
        });
        if (result.confirm) {
          common_vendor.index.showLoading({ title: "导出中..." });
          await utils_api.settingsAPI.exportData();
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "导出成功",
            icon: "success"
          });
        }
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/profile/profile.vue:391", "导出失败:", error);
        common_vendor.index.showToast({
          title: "导出失败",
          icon: "none"
        });
      }
    };
    const shareApp = () => {
      common_vendor.index.share({
        provider: "weixin",
        scene: "WXSceneSession",
        type: 0,
        title: "Sword Edge - 智能剑术训练系统",
        summary: "专业的剑术训练分析与指导平台",
        success: () => {
          common_vendor.index.showToast({
            title: "分享成功",
            icon: "success"
          });
        },
        fail: () => {
          common_vendor.index.showToast({
            title: "分享功能开发中",
            icon: "none"
          });
        }
      });
    };
    const logout = async () => {
      try {
        const result = await common_vendor.index.showModal({
          title: "退出登录",
          content: "确定要退出登录吗？",
          confirmText: "确定",
          cancelText: "取消"
        });
        if (result.confirm) {
          common_vendor.index.showLoading({ title: "退出中..." });
          try {
            await utils_api.authAPI.logout();
          } catch (apiError) {
            common_vendor.index.__f__("warn", "at pages/profile/profile.vue:440", "退出 API 请求失败，执行本地退出:", apiError);
          }
          common_vendor.index.removeStorageSync("token");
          common_vendor.index.removeStorageSync("userInfo");
          common_vendor.index.hideLoading();
          common_vendor.index.redirectTo({
            url: "/pages/login/login"
          });
        }
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/profile/profile.vue:456", "退出失败:", error);
        common_vendor.index.showToast({
          title: "退出失败",
          icon: "none"
        });
      }
    };
    return (_ctx, _cache) => {
      return {
        a: userInfo.value.avatar,
        b: common_vendor.o(changeAvatar),
        c: common_vendor.t(userInfo.value.name),
        d: common_vendor.f(userInfo.value.badges, (badge, k0, i0) => {
          return {
            a: common_vendor.t(badge.icon),
            b: common_vendor.t(badge.text),
            c: badge.color,
            d: badge.id
          };
        }),
        e: common_vendor.f(stats.value, (stat, k0, i0) => {
          return {
            a: common_vendor.t(stat.value),
            b: common_vendor.t(stat.label),
            c: stat.id,
            d: common_vendor.o(($event) => viewStatDetail(stat), stat.id)
          };
        }),
        f: common_vendor.f(menuItems.value, (menu, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(menu.icon),
            b: menu.iconBg,
            c: common_vendor.t(menu.title),
            d: menu.value
          }, menu.value ? {
            e: common_vendor.t(menu.value)
          } : {}, {
            f: menu.id,
            g: menu.divider ? 1 : "",
            h: common_vendor.o(($event) => handleMenuClick(menu), menu.id)
          });
        }),
        g: common_vendor.p({
          title: "功能"
        }),
        h: common_vendor.f(settings.value, (setting, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(setting.title),
            b: setting.desc
          }, setting.desc ? {
            c: common_vendor.t(setting.desc)
          } : {}, {
            d: setting.type === "toggle"
          }, setting.type === "toggle" ? {
            e: setting.value ? 1 : "",
            f: common_vendor.o(($event) => toggleSetting(setting.id), setting.id)
          } : setting.type === "picker" ? {
            h: common_vendor.t(setting.options[setting.value]),
            i: setting.options,
            j: setting.value,
            k: common_vendor.o(($event) => handlePickerChange($event, setting.id), setting.id)
          } : {}, {
            g: setting.type === "picker",
            l: setting.id
          });
        }),
        i: common_vendor.p({
          title: "设置"
        }),
        j: common_vendor.o(editProfile),
        k: common_vendor.o(changePassword),
        l: common_vendor.o(exportData),
        m: common_vendor.o(logout),
        n: common_vendor.p({
          title: "账号"
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-dd383ca2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/profile.js.map
