"use strict";
const common_vendor = require("../common/vendor.js");
const BASE_URL = "http://localhost:5001";
const TIMEOUT = 3e4;
const requestInterceptor = (config) => {
  const token = common_vendor.index.getStorageSync("token");
  if (token) {
    config.header = {
      ...config.header,
      "Authorization": `Bearer ${token}`
    };
  }
  config.header = {
    "Content-Type": "application/json",
    ...config.header
  };
  common_vendor.index.__f__("log", "at utils/request.js:32", `[Request] ${config.method} ${config.url}`, config.data || config.params);
  return config;
};
const responseInterceptor = (response) => {
  const { statusCode, data } = response;
  if (statusCode === 200 || statusCode === 201 || statusCode === 202) {
    common_vendor.index.__f__("log", "at utils/request.js:44", `[Response] Success`, data);
    return data;
  }
  const errorMsg = handleErrorStatus(statusCode, data);
  common_vendor.index.__f__("error", "at utils/request.js:50", `[Response] Error ${statusCode}:`, errorMsg);
  common_vendor.index.showToast({
    title: errorMsg,
    icon: "none",
    duration: 2e3
  });
  return Promise.reject(new Error(errorMsg));
};
const handleErrorStatus = (statusCode, data) => {
  const errorMap = {
    400: "请求参数错误",
    401: "未授权，请重新登录",
    403: "拒绝访问",
    404: "请求资源不存在",
    408: "请求超时",
    500: "服务器内部错误",
    501: "服务未实现",
    502: "网关错误",
    503: "服务不可用",
    504: "网关超时",
    505: "HTTP 版本不受支持"
  };
  if (statusCode === 401) {
    common_vendor.index.removeStorageSync("token");
    common_vendor.index.removeStorageSync("userInfo");
    common_vendor.index.redirectTo({ url: "/pages/login/login" });
  }
  return (data == null ? void 0 : data.message) || errorMap[statusCode] || `请求失败 (${statusCode})`;
};
const request = (config) => {
  config = requestInterceptor({
    url: BASE_URL + config.url,
    method: config.method || "GET",
    timeout: config.timeout || TIMEOUT,
    header: config.header || {},
    data: config.data,
    dataType: config.dataType || "json",
    responseType: config.responseType || "text"
  });
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      ...config,
      success: (res) => {
        try {
          const result = responseInterceptor(res);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/request.js:116", "[Request] Network Error:", err);
        let errorMsg = "网络连接失败";
        if (err.errMsg) {
          if (err.errMsg.includes("timeout")) {
            errorMsg = "请求超时，请检查网络";
          } else if (err.errMsg.includes("fail")) {
            errorMsg = "网络请求失败";
          }
        }
        common_vendor.index.showToast({
          title: errorMsg,
          icon: "none",
          duration: 2e3
        });
        reject(new Error(errorMsg));
      }
    });
  });
};
const get = (url, params = {}, config = {}) => {
  return request({
    url,
    method: "GET",
    data: params,
    ...config
  });
};
const post = (url, data = {}, config = {}) => {
  return request({
    url,
    method: "POST",
    data,
    ...config
  });
};
const uploadFile = (url, filePath, formData = {}, onProgress = null) => {
  const token = common_vendor.index.getStorageSync("token");
  return new Promise((resolve, reject) => {
    const uploadTask = common_vendor.index.uploadFile({
      url: BASE_URL + url,
      filePath,
      name: "video",
      // 后端接收字段名
      formData,
      header: {
        "Authorization": token ? `Bearer ${token}` : ""
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 202) {
          const data = JSON.parse(res.data);
          common_vendor.index.__f__("log", "at utils/request.js:209", "[Upload] Success:", data);
          resolve(data);
        } else {
          const errorMsg = `上传失败 (${res.statusCode})`;
          common_vendor.index.__f__("error", "at utils/request.js:213", "[Upload] Error:", errorMsg);
          common_vendor.index.showToast({ title: errorMsg, icon: "none" });
          reject(new Error(errorMsg));
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/request.js:219", "[Upload] Network Error:", err);
        common_vendor.index.showToast({ title: "上传失败", icon: "none" });
        reject(err);
      }
    });
    if (onProgress && typeof onProgress === "function") {
      uploadTask.onProgressUpdate((res) => {
        onProgress(res.progress);
      });
    }
  });
};
class WebSocketClient {
  constructor(url) {
    this.url = BASE_URL.replace("http", "ws") + url;
    this.socket = null;
    this.isConnected = false;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.messageHandlers = [];
  }
  // 连接 WebSocket
  connect() {
    return new Promise((resolve, reject) => {
      this.socket = common_vendor.index.connectSocket({
        url: this.url,
        success: () => {
          common_vendor.index.__f__("log", "at utils/request.js:293", "[WebSocket] Connecting...");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at utils/request.js:296", "[WebSocket] Connection Failed:", err);
          reject(err);
        }
      });
      this.socket.onOpen(() => {
        common_vendor.index.__f__("log", "at utils/request.js:302", "[WebSocket] Connected");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      });
      this.socket.onMessage((res) => {
        const data = JSON.parse(res.data);
        common_vendor.index.__f__("log", "at utils/request.js:310", "[WebSocket] Message:", data);
        this.messageHandlers.forEach((handler) => handler(data));
      });
      this.socket.onClose(() => {
        common_vendor.index.__f__("log", "at utils/request.js:315", "[WebSocket] Closed");
        this.isConnected = false;
        this.reconnect();
      });
      this.socket.onError((err) => {
        common_vendor.index.__f__("error", "at utils/request.js:321", "[WebSocket] Error:", err);
        this.isConnected = false;
      });
    });
  }
  // 发送消息
  send(data) {
    if (this.isConnected) {
      this.socket.send({
        data: JSON.stringify(data),
        success: () => {
          common_vendor.index.__f__("log", "at utils/request.js:333", "[WebSocket] Sent:", data);
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at utils/request.js:336", "[WebSocket] Send Failed:", err);
        }
      });
    } else {
      common_vendor.index.__f__("warn", "at utils/request.js:340", "[WebSocket] Not connected, cannot send message");
    }
  }
  // 监听消息
  onMessage(handler) {
    this.messageHandlers.push(handler);
  }
  // 断开连接
  close() {
    if (this.socket) {
      this.socket.close();
      this.isConnected = false;
      clearTimeout(this.reconnectTimer);
    }
  }
  // 自动重连
  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      common_vendor.index.__f__("log", "at utils/request.js:362", `[WebSocket] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, 3e3);
    } else {
      common_vendor.index.__f__("error", "at utils/request.js:368", "[WebSocket] Max reconnect attempts reached");
    }
  }
}
const createWebSocket = (url) => {
  return new WebSocketClient(url);
};
exports.createWebSocket = createWebSocket;
exports.get = get;
exports.post = post;
exports.uploadFile = uploadFile;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/request.js.map
