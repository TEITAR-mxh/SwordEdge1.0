"use strict";
const utils_request = require("./request.js");
const authAPI = {
  // 登录
  login: (data) => utils_request.post("/api/login", data),
  // 注册
  register: (data) => utils_request.post("/api/register", data),
  // 登出
  logout: () => utils_request.post("/api/logout"),
  // 获取用户信息
  getUserInfo: () => utils_request.get("/api/user/info"),
  // 更新用户信息
  updateUserInfo: (data) => utils_request.post("/api/user/update", data)
};
const analysisAPI = {
  /**
   * 启动视频分析任务
   * @param {String} filePath - 视频文件路径
   * @param {Object} formData - 额外表单数据
   * @param {Function} onProgress - 上传进度回调
   */
  startAnalysis: (filePath, formData = {}, onProgress) => {
    return utils_request.uploadFile("/api/start_analysis", filePath, formData, onProgress);
  },
  /**
   * 查询分析任务状态
   * @param {String} sessionId - 任务会话ID
   */
  getAnalysisStatus: (sessionId) => {
    return utils_request.get(`/api/analysis_status/${sessionId}`);
  },
  /**
   * 生成骨架检测视频
   * @param {String} sessionId - 任务会话ID
   */
  generateSkeletonVideo: (sessionId) => {
    return utils_request.post("/api/generate_skeleton_video", { session_id: sessionId });
  },
  /**
   * 分析单帧图像
   * @param {String} filePath - 图片文件路径
   */
  analyzeFrame: (filePath) => {
    return utils_request.uploadFile("/api/analyze_frame", filePath, { name: "frame" });
  }
};
const coachAPI = {
  /**
   * 获取 AI 教练反馈
   * @param {Object} data - 分析结果数据
   * @param {String} data.type - 分析类型（如 'fencing', 'posture'）
   * @param {Number} data.score - 综合评分
   * @param {Object} data.metrics - 详细指标
   */
  getFeedback: (data) => {
    return utils_request.post("/api/get_coach_feedback", data);
  }
};
const trainingAPI = {
  // 获取训练记录列表
  getTrainingList: (params) => utils_request.get("/api/training/list", params),
  // 获取训练记录详情
  getTrainingDetail: (id) => utils_request.get(`/api/training/detail/${id}`),
  // 删除训练记录
  deleteTraining: (id) => utils_request.post(`/api/training/delete/${id}`),
  // 获取训练统计数据
  getTrainingStats: () => utils_request.get("/api/training/stats")
};
const planAPI = {
  // 获取训练计划列表
  getPlanList: () => utils_request.get("/api/plans/list"),
  // 获取计划详情
  getPlanDetail: (id) => utils_request.get(`/api/plans/detail/${id}`),
  // 创建自定义计划
  createPlan: (data) => utils_request.post("/api/plans/create", data),
  // 更新计划进度
  updatePlanProgress: (id, data) => utils_request.post(`/api/plans/progress/${id}`, data)
};
const monitorAPI = {
  // 获取实时监控数据（WebSocket 或轮询）
  getRealtimeData: () => utils_request.get("/api/monitor/realtime"),
  // 开始实时监控
  startMonitor: () => utils_request.post("/api/monitor/start"),
  // 停止实时监控
  stopMonitor: () => utils_request.post("/api/monitor/stop")
};
const settingsAPI = {
  // 获取系统设置
  getSettings: () => utils_request.get("/api/settings"),
  // 更新系统设置
  updateSettings: (data) => utils_request.post("/api/settings/update", data),
  // 导出数据
  exportData: () => utils_request.get("/api/settings/export")
};
exports.analysisAPI = analysisAPI;
exports.authAPI = authAPI;
exports.coachAPI = coachAPI;
exports.monitorAPI = monitorAPI;
exports.planAPI = planAPI;
exports.settingsAPI = settingsAPI;
exports.trainingAPI = trainingAPI;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/api.js.map
