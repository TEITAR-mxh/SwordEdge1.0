"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "se-progress",
  props: {
    // 进度百分比（0-100）
    percent: {
      type: Number,
      default: 0,
      validator: (value) => value >= 0 && value <= 100
    },
    // 进度条类型：default | success | warning | danger
    type: {
      type: String,
      default: "default"
    },
    // 标签文本
    label: {
      type: String,
      default: ""
    },
    // 是否显示进度信息
    showInfo: {
      type: Boolean,
      default: true
    },
    // 是否显示条纹
    striped: {
      type: Boolean,
      default: false
    },
    // 是否激活动画
    active: {
      type: Boolean,
      default: false
    },
    // 进度条高度
    height: {
      type: String,
      default: "16rpx"
    },
    // 进度条圆角
    radius: {
      type: String,
      default: "8rpx"
    }
  },
  setup(__props) {
    const props = __props;
    const currentPercent = common_vendor.ref(0);
    common_vendor.watch(() => props.percent, (newVal) => {
      const step = newVal > currentPercent.value ? 1 : -1;
      const timer = setInterval(() => {
        if (currentPercent.value === newVal) {
          clearInterval(timer);
        } else {
          currentPercent.value += step;
        }
      }, 10);
    }, { immediate: true });
    const trackStyle = common_vendor.computed(() => ({
      height: props.height,
      borderRadius: props.radius
    }));
    const fillStyle = common_vendor.computed(() => ({
      width: `${currentPercent.value}%`,
      borderRadius: props.radius
    }));
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.showInfo
      }, __props.showInfo ? {
        b: common_vendor.t(__props.label),
        c: common_vendor.t(currentPercent.value)
      } : {}, {
        d: __props.active && __props.striped
      }, __props.active && __props.striped ? {} : {}, {
        e: common_vendor.n(`se-progress__fill--${__props.type}`),
        f: common_vendor.n(__props.active && "se-progress__fill--active"),
        g: common_vendor.s(fillStyle.value),
        h: common_vendor.s(trackStyle.value)
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-d2626bb0"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/se-progress/se-progress.js.map
