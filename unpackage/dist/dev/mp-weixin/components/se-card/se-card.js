"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "se-card",
  props: {
    // 标题
    title: {
      type: String,
      default: ""
    },
    // 副标题
    subtitle: {
      type: String,
      default: ""
    },
    // 卡片变体：default | primary | gradient
    variant: {
      type: String,
      default: "default"
    },
    // 是否显示阴影
    shadow: {
      type: Boolean,
      default: true
    },
    // 是否启用悬停效果
    hover: {
      type: Boolean,
      default: false
    },
    // 内边距
    padding: {
      type: String,
      default: "32rpx"
    },
    // 圆角
    radius: {
      type: String,
      default: "24rpx"
    }
  },
  emits: ["click"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const cardStyle = common_vendor.computed(() => ({
      borderRadius: props.radius
    }));
    const bodyStyle = common_vendor.computed(() => ({
      padding: props.padding
    }));
    const handleClick = () => {
      emit("click");
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.title || _ctx.$slots.header
      }, __props.title || _ctx.$slots.header ? common_vendor.e({
        b: common_vendor.t(__props.title),
        c: __props.subtitle
      }, __props.subtitle ? {
        d: common_vendor.t(__props.subtitle)
      } : {}) : {}, {
        e: common_vendor.s(bodyStyle.value),
        f: _ctx.$slots.footer
      }, _ctx.$slots.footer ? {} : {}, {
        g: common_vendor.n(`se-card--${__props.variant}`),
        h: common_vendor.n(__props.hover && "se-card--hover"),
        i: common_vendor.n(__props.shadow && "se-card--shadow"),
        j: common_vendor.s(cardStyle.value),
        k: common_vendor.o(handleClick)
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1756abd5"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/se-card/se-card.js.map
