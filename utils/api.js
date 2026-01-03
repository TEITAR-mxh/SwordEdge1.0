/**
 * API 接口定义
 * 所有后端接口统一管理
 */
import { get, post, uploadFile } from './request.js'

// ========== 用户认证相关 ==========
export const authAPI = {
  // 登录
  login: (data) => post('/api/login', data),

  // 注册
  register: (data) => post('/api/register', data),

  // 登出
  logout: () => post('/api/logout'),

  // 获取用户信息
  getUserInfo: () => get('/api/user/info'),

  // 更新用户信息
  updateUserInfo: (data) => post('/api/user/update', data)
}

// ========== 训练分析相关 ==========
export const analysisAPI = {
  /**
   * 启动视频分析任务
   * @param {String} filePath - 视频文件路径
   * @param {Object} formData - 额外表单数据
   * @param {Function} onProgress - 上传进度回调
   */
  startAnalysis: (filePath, formData = {}, onProgress) => {
    return uploadFile('/api/start_analysis', filePath, formData, onProgress)
  },

/**
   * 获取分析任务状态
   * @param {String} sessionId - 任务会话ID
   */
  getStatus: (sessionId) => {
    return get(`/api/analysis_status/${sessionId}`)
  },
  /**
   * 生成骨架检测视频
   * @param {String} sessionId - 任务会话ID
   */
  generateSkeletonVideo: (sessionId) => {
    return post('/api/generate_skeleton_video', { session_id: sessionId })
  },

  /**
   * 分析单帧图像
   * @param {String} filePath - 图片文件路径
   */
  analyzeFrame: (filePath) => {
    return uploadFile('/api/analyze_frame', filePath, { name: 'frame' })
  }
}

// ========== AI 教练反馈相关 ==========
export const coachAPI = {
  /**
   * 获取 AI 教练反馈
   * @param {Object} data - 分析结果数据
   * @param {String} data.type - 分析类型（如 'fencing', 'posture'）
   * @param {Number} data.score - 综合评分
   * @param {Object} data.metrics - 详细指标
   */
  getFeedback: (data) => {
    return post('/api/get_coach_feedback', data)
  }
}

// ========== 训练记录相关 ==========
export const trainingAPI = {
  // 获取训练记录列表
  getTrainingList: (params = {}, config = {}) => get('/api/training/list', params, config),

  // 获取训练记录详情
  getTrainingDetail: (id, config = {}) => get(`/api/training/detail/${id}`, {}, config),

  // 删除训练记录
  deleteTraining: (id, config = {}) => post(`/api/training/delete/${id}`, {}, config),

  // 获取训练统计数据
  getTrainingStats: (params = {}, config = {}) => get('/api/training/stats', params, config)
}

// ========== 训练计划相关 ==========
export const planAPI = {
  // 获取训练计划列表
  getPlanList: () => get('/api/plans/list'),

  // 获取计划详情
  getPlanDetail: (id) => get(`/api/plans/detail/${id}`),

  // 创建自定义计划
  createPlan: (data) => post('/api/plans/create', data),

  // 更新计划进度
  updatePlanProgress: (id, data) => post(`/api/plans/progress/${id}`, data)
}

// ========== 社区相关 ==========
export const communityAPI = {
  // 获取社区动态
  getFeedList: (params) => get('/api/community/feed', params),

  // 发布动态
  publishPost: (data) => post('/api/community/publish', data),

  // 点赞
  likePost: (id) => post(`/api/community/like/${id}`),

  // 评论
  commentPost: (id, data) => post(`/api/community/comment/${id}`, data)
}

// ========== 实时监控相关 ==========
export const monitorAPI = {
  // 获取实时监控数据（WebSocket 或轮询）
  getRealtimeData: () => get('/api/monitor/realtime'),

  // 开始实时监控
  startMonitor: (data = {}, config = {}) => post('/api/monitor/start', data, config),

  // 停止实时监控
  stopMonitor: (data = {}, config = {}) => post('/api/monitor/stop', data, config)
}

// ========== 系统设置相关 ==========
export const settingsAPI = {
  // 获取系统设置
  getSettings: () => get('/api/settings'),

  // 更新系统设置
  updateSettings: (data) => post('/api/settings/update', data),

  // 导出数据
  exportData: () => get('/api/settings/export')
}

// 统一导出
export default {
  authAPI,
  analysisAPI,
  coachAPI,
  trainingAPI,
  planAPI,
  communityAPI,
  monitorAPI,
  settingsAPI
}
