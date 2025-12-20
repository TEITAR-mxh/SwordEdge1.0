"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const _sfc_main = {
  __name: "login",
  setup(__props) {
    const form = common_vendor.ref({
      username: "",
      password: "",
      remember: false
    });
    const loading = common_vendor.ref(false);
    const errorMessage = common_vendor.ref("");
    const showPassword = common_vendor.ref(false);
    const usernameFocus = common_vendor.ref(false);
    const passwordFocus = common_vendor.ref(false);
    const validation = common_vendor.ref({
      username: { valid: true, message: "" },
      password: { valid: true, message: "" }
    });
    const validateUsername = (value) => {
      const username = value.trim();
      if (username.length < 3) {
        validation.value.username = {
          valid: false,
          message: "用户名长度不能少于3个字符"
        };
      } else if (username.length > 20) {
        validation.value.username = {
          valid: false,
          message: "用户名长度不能超过20个字符"
        };
      } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        validation.value.username = {
          valid: false,
          message: "用户名只能包含字母、数字和下划线"
        };
      } else {
        validation.value.username = { valid: true, message: "" };
      }
    };
    const validatePassword = (value) => {
      const password = value.trim();
      if (password.length < 6) {
        validation.value.password = {
          valid: false,
          message: "密码长度不能少于6个字符"
        };
      } else if (password.length > 20) {
        validation.value.password = {
          valid: false,
          message: "密码长度不能超过20个字符"
        };
      } else if (!/[A-Z]/.test(password)) {
        validation.value.password = {
          valid: false,
          message: "密码必须包含至少一个大写字母"
        };
      } else if (!/[a-z]/.test(password)) {
        validation.value.password = {
          valid: false,
          message: "密码必须包含至少一个小写字母"
        };
      } else if (!/[0-9]/.test(password)) {
        validation.value.password = {
          valid: false,
          message: "密码必须包含至少一个数字"
        };
      } else {
        validation.value.password = { valid: true, message: "" };
      }
    };
    const isFormValid = common_vendor.computed(() => {
      return validation.value.username.valid && validation.value.password.valid && form.value.username.length >= 3 && form.value.password.length >= 6;
    });
    const handleLogin = async () => {
      validateUsername(form.value.username);
      validatePassword(form.value.password);
      if (!isFormValid.value) {
        const firstError = Object.values(validation.value).find((v) => !v.valid);
        if (firstError) {
          errorMessage.value = firstError.message;
        }
        return;
      }
      loading.value = true;
      errorMessage.value = "";
      try {
        let result;
        try {
          result = await utils_api.authAPI.login({
            username: form.value.username,
            password: form.value.password
          });
        } catch (apiError) {
          common_vendor.index.__f__("log", "at pages/login/login.vue:251", "API 请求失败，使用模拟数据");
          result = {
            token: "mock_token_" + Date.now(),
            userInfo: {
              id: "1",
              name: form.value.username,
              avatar: "/static/images/avatar-default.png",
              bio: "中级训练者 · 连续训练12天",
              badges: [
                { id: 1, icon: "🏆", text: "中级", color: "rgba(59, 130, 246, 0.2)" },
                { id: 2, icon: "🔥", text: "12天", color: "rgba(245, 158, 11, 0.2)" },
                { id: 3, icon: "⭐", text: "Lv.5", color: "rgba(16, 185, 129, 0.2)" }
              ]
            }
          };
        }
        common_vendor.index.setStorageSync("token", result.token);
        common_vendor.index.setStorageSync("userInfo", result.userInfo);
        if (form.value.remember) {
          common_vendor.index.setStorageSync("rememberedUsername", form.value.username);
        } else {
          common_vendor.index.removeStorageSync("rememberedUsername");
        }
        loading.value = false;
        common_vendor.index.showToast({
          title: "登录成功",
          icon: "success",
          duration: 1500
        });
        setTimeout(() => {
          common_vendor.index.switchTab({
            url: "/pages/index/index"
          });
        }, 1500);
      } catch (error) {
        loading.value = false;
        common_vendor.index.__f__("error", "at pages/login/login.vue:296", "登录失败:", error);
        errorMessage.value = error.message || "用户名或密码错误";
        setTimeout(() => {
          errorMessage.value = "";
        }, 3e3);
      }
    };
    const forgotPassword = () => {
      common_vendor.index.navigateTo({
        url: "/pages/login/forgot"
      });
    };
    const socialLogin = (platform) => {
      common_vendor.index.showToast({
        title: "功能开发中",
        icon: "none"
      });
    };
    const goToRegister = () => {
      common_vendor.index.navigateTo({
        url: "/pages/login/register"
      });
    };
    const viewAgreement = (type) => {
      common_vendor.index.navigateTo({
        url: `/pages/login/agreement?type=${type}`
      });
    };
    common_vendor.onMounted(() => {
      const rememberedUsername = common_vendor.index.getStorageSync("rememberedUsername");
      if (rememberedUsername) {
        form.value.username = rememberedUsername;
        form.value.remember = true;
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: errorMessage.value
      }, errorMessage.value ? {
        b: common_vendor.t(errorMessage.value)
      } : {}, {
        c: usernameFocus.value,
        d: common_vendor.o(($event) => usernameFocus.value = true),
        e: common_vendor.o(($event) => {
          {
            usernameFocus.value = false;
            validateUsername(form.value.username);
          }
        }),
        f: common_vendor.o([($event) => form.value.username = $event.detail.value, ($event) => validateUsername(form.value.username)]),
        g: form.value.username,
        h: !validation.value.username.valid
      }, !validation.value.username.valid ? {
        i: common_vendor.t(validation.value.username.message)
      } : {}, {
        j: showPassword.value ? "text" : "password",
        k: passwordFocus.value,
        l: common_vendor.o(($event) => passwordFocus.value = true),
        m: common_vendor.o(($event) => {
          {
            passwordFocus.value = false;
            validatePassword(form.value.password);
          }
        }),
        n: common_vendor.o([($event) => form.value.password = $event.detail.value, ($event) => validatePassword(form.value.password)]),
        o: form.value.password,
        p: common_vendor.n(showPassword.value ? "icon-eye" : "icon-eye-slash"),
        q: common_vendor.o(($event) => showPassword.value = !showPassword.value),
        r: !validation.value.password.valid
      }, !validation.value.password.valid ? {
        s: common_vendor.t(validation.value.password.message)
      } : {}, {
        t: form.value.remember
      }, form.value.remember ? {} : {}, {
        v: form.value.remember ? 1 : "",
        w: common_vendor.o(($event) => form.value.remember = !form.value.remember),
        x: common_vendor.o(forgotPassword),
        y: loading.value
      }, loading.value ? {} : {}, {
        z: loading.value,
        A: !isFormValid.value,
        B: common_vendor.o(handleLogin),
        C: common_vendor.o(($event) => socialLogin()),
        D: common_vendor.o(($event) => socialLogin()),
        E: common_vendor.o(($event) => socialLogin()),
        F: common_vendor.o(goToRegister),
        G: common_vendor.o(($event) => viewAgreement("terms")),
        H: common_vendor.o(($event) => viewAgreement("privacy"))
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e4e4508d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
