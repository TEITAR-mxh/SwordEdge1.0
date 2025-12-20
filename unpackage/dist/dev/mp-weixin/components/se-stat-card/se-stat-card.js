"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "se-stat-card",
  props: {
    // 图标名称
    icon: {
      type: String,
      required: true
    },
    // 数值
    value: {
      type: [String, Number],
      required: true
    },
    // 标签
    label: {
      type: String,
      required: true
    },
    // 卡片类型：default | primary | success | warning | danger
    type: {
      type: String,
      default: "default"
    },
    // 趋势：up | down | null
    trend: {
      type: String,
      default: null,
      validator: (value) => !value || ["up", "down"].includes(value)
    },
    // 趋势数值
    trendValue: {
      type: String,
      default: ""
    },
    // 是否启用悬停效果
    hover: {
      type: Boolean,
      default: true
    }
  },
  emits: ["click"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const handleClick = () => {
      emit("click");
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.n(`icon-${__props.icon}`),
        b: common_vendor.t(__props.value),
        c: common_vendor.t(__props.label),
        d: __props.trend
      }, __props.trend ? common_vendor.e({
        e: common_vendor.n(__props.trend === "up" ? "icon-arrow-up" : "icon-arrow-down"),
        f: __props.trendValue
      }, __props.trendValue ? {
        g: common_vendor.t(__props.trendValue)
      } : {}, {
        h: common_vendor.n(`se-stat-card__trend--${__props.trend}`)
      }) : {}, {
        i: common_vendor.n(`se-stat-card--${__props.type}`),
        j: common_vendor.n(__props.hover && "se-stat-card--hover"),
        k: common_vendor.o(handleClick)
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-51f25dbe"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/se-stat-card/se-stat-card.js.map
