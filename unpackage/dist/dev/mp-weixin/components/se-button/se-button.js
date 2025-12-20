"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "se-button",
  props: {
    // 按钮文本
    text: {
      type: String,
      default: ""
    },
    // 按钮类型：default | primary | success | warning | danger | info
    type: {
      type: String,
      default: "default"
    },
    // 按钮尺寸：small | medium | large
    size: {
      type: String,
      default: "medium"
    },
    // 图标名称
    icon: {
      type: String,
      default: ""
    },
    // 是否为块级按钮
    block: {
      type: Boolean,
      default: false
    },
    // 是否为朴素按钮
    plain: {
      type: Boolean,
      default: false
    },
    // 是否为圆形按钮
    round: {
      type: Boolean,
      default: false
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false
    },
    // 是否加载中
    loading: {
      type: Boolean,
      default: false
    },
    // 悬停样式类名
    hoverClass: {
      type: String,
      default: "se-button--hover"
    }
  },
  emits: ["click"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const handleClick = (e) => {
      if (!props.disabled && !props.loading) {
        emit("click", e);
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.loading
      }, __props.loading ? {} : {}, {
        b: __props.icon && !__props.loading
      }, __props.icon && !__props.loading ? {
        c: common_vendor.n(`iconfont icon-${__props.icon}`)
      } : {}, {
        d: common_vendor.t(__props.text),
        e: common_vendor.n(`se-button--${__props.type}`),
        f: common_vendor.n(`se-button--${__props.size}`),
        g: common_vendor.n(__props.block && "se-button--block"),
        h: common_vendor.n(__props.plain && "se-button--plain"),
        i: common_vendor.n(__props.round && "se-button--round"),
        j: common_vendor.n(__props.disabled && "se-button--disabled"),
        k: common_vendor.n(__props.loading && "se-button--loading"),
        l: __props.disabled || __props.loading,
        m: __props.loading,
        n: __props.hoverClass,
        o: common_vendor.o(handleClick)
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c6ecab8c"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/se-button/se-button.js.map
