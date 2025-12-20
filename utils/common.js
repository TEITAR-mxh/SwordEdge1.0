// 公共工具函数

/**
 * 获取环形进度条样式
 * @param {number} score - 分数或进度值(0-100)
 * @returns {object} 环形进度条的样式对象
 */
export const getCircleProgressStyle = (score) => {
  const deg = (score / 100) * 360
  let color = '#3b82f6'
  
  // 根据分数确定颜色
  if (score >= 90) color = '#10b981'
  else if (score >= 80) color = '#3b82f6'
  else if (score >= 70) color = '#f59e0b'
  else color = '#ef4444'

  return {
    background: `conic-gradient(${color} ${deg}deg, rgba(71, 85, 105, 0.2) ${deg}deg)`
  }
}

/**
 * 获取评分星级数
 * @param {number} score - 分数(0-100)
 * @returns {number} 星级数(1-5)
 */
export const getStarCount = (score) => {
  if (score >= 95) return 5
  if (score >= 85) return 4
  if (score >= 75) return 3
  if (score >= 65) return 2
  return 1
}

/**
 * 获取评分评语
 * @param {number} score - 分数(0-100)
 * @returns {string} 评分评语
 */
export const getScoreComment = (score) => {
  if (score >= 90) return '表现优秀，继续保持！'
  if (score >= 80) return '表现良好，再接再厉！'
  if (score >= 70) return '表现一般，还需努力！'
  return '需要加强训练'
}

/**
 * 获取指标类型
 * @param {number} score - 分数(0-100)
 * @returns {string} 指标类型(success, default, warning, danger)
 */
export const getMetricType = (score) => {
  if (score >= 85) return 'success'
  if (score >= 70) return 'default'
  if (score >= 60) return 'warning'
  return 'danger'
}

/**
 * 获取置信度类型
 * @param {number} confidence - 置信度(0-100)
 * @returns {string} 类型(success, default, warning, danger)
 */
export const getConfidenceType = (confidence) => {
  if (confidence >= 90) return 'success'
  if (confidence >= 70) return 'default'
  if (confidence >= 50) return 'warning'
  return 'danger'
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小(字节)
 * @returns {string} 格式化后的文件大小
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}
