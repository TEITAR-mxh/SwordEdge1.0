"use strict";
const getCircleProgressStyle = (score) => {
  const deg = score / 100 * 360;
  let color = "#3b82f6";
  if (score >= 90)
    color = "#10b981";
  else if (score >= 80)
    color = "#3b82f6";
  else if (score >= 70)
    color = "#f59e0b";
  else
    color = "#ef4444";
  return {
    background: `conic-gradient(${color} ${deg}deg, rgba(71, 85, 105, 0.2) ${deg}deg)`
  };
};
const getStarCount = (score) => {
  if (score >= 95)
    return 5;
  if (score >= 85)
    return 4;
  if (score >= 75)
    return 3;
  if (score >= 65)
    return 2;
  return 1;
};
const getScoreComment = (score) => {
  if (score >= 90)
    return "表现优秀，继续保持！";
  if (score >= 80)
    return "表现良好，再接再厉！";
  if (score >= 70)
    return "表现一般，还需努力！";
  return "需要加强训练";
};
const getMetricType = (score) => {
  if (score >= 85)
    return "success";
  if (score >= 70)
    return "default";
  if (score >= 60)
    return "warning";
  return "danger";
};
const getConfidenceType = (confidence) => {
  if (confidence >= 90)
    return "success";
  if (confidence >= 70)
    return "default";
  if (confidence >= 50)
    return "warning";
  return "danger";
};
const formatFileSize = (bytes) => {
  if (bytes < 1024)
    return bytes + " B";
  if (bytes < 1024 * 1024)
    return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
};
exports.formatFileSize = formatFileSize;
exports.getCircleProgressStyle = getCircleProgressStyle;
exports.getConfidenceType = getConfidenceType;
exports.getMetricType = getMetricType;
exports.getScoreComment = getScoreComment;
exports.getStarCount = getStarCount;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/common.js.map
