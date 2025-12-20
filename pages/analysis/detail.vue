<template>
  <view class="page-detail app-background">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 主内容 -->
    <view v-else-if="analysisData" class="detail-content">
      <!-- 视频播放器 -->
      <view class="video-section">
        <video
          :src="analysisData.video_url"
          controls
          :show-center-play-btn="true"
          :enable-progress-gesture="true"
          class="video-player"
          @error="handleVideoError"
        ></video>
      </view>

      <!-- 综合评分卡片 -->
      <se-card class="score-card" variant="gradient">
        <view class="score-header">
          <text class="score-title">综合评分</text>
          <text class="score-date">{{ formatDate(analysisData.created_at) }}</text>
        </view>

        <view class="score-display">
          <view class="score-circle" :style="getCircleStyle(analysisData.overall_score)">
            <view class="score-inner">
              <text class="score-value">{{ analysisData.overall_score }}</text>
              <text class="score-unit">分</text>
            </view>
          </view>
        </view>

        <view class="score-rating">
          <text
            v-for="star in 5"
            :key="star"
            class="star"
            :class="{ 'star--filled': star <= getStarCount(analysisData.overall_score) }"
          >★</text>
        </view>

        <text class="score-comment">{{ getScoreComment(analysisData.overall_score) }}</text>
      </se-card>

      <!-- 详细指标 -->
      <se-card title="技术指标" class="mt-4">
        <view class="metrics-grid">
          <view
            v-for="metric in analysisData.metrics"
            :key="metric.name"
            class="metric-item"
          >
            <view class="metric-header">
              <text class="metric-name">{{ metric.name }}</text>
              <text class="metric-value">{{ metric.score }}</text>
            </view>
            <se-progress
              :percent="metric.score"
              :show-info="false"
              height="12rpx"
              :type="getProgressType(metric.score)"
            />
          </view>
        </view>
      </se-card>

      <!-- 检测到的动作 -->
      <se-card
        title="动作分析"
        :subtitle="`检测到 ${analysisData.actions?.length || 0} 个动作`"
        class="mt-4"
      >
        <view class="actions-timeline">
          <view
            v-for="(action, index) in analysisData.actions"
            :key="index"
            class="action-item"
            @tap="jumpToTime(action.start_time)"
          >
            <view class="action-timeline-dot"></view>
            <view class="action-card">
              <view class="action-header">
                <view class="action-icon" :style="{ background: action.color }">
                  <text>{{ action.icon }}</text>
                </view>
                <view class="action-info">
                  <text class="action-name">{{ action.name }}</text>
                  <text class="action-time">{{ formatTime(action.start_time) }} - {{ formatTime(action.end_time) }}</text>
                </view>
              </view>
              <view class="action-score-bar">
                <text class="action-score">{{ action.score }}分</text>
                <view class="quality-dots">
                  <view
                    v-for="dot in 5"
                    :key="dot"
                    class="quality-dot"
                    :class="{ 'quality-dot--active': dot <= Math.ceil(action.score / 20) }"
                  ></view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </se-card>

      <!-- AI 教练建议 -->
      <se-card v-if="coachFeedback" title="AI 教练建议" variant="primary" class="mt-4">
        <view class="coach-section">
          <view class="coach-avatar">
            <text class="coach-icon">🤖</text>
          </view>
          <view class="coach-bubble">
            <md-renderer :content="coachFeedback.feedback"></md-renderer>
          </view>
        </view>

        <view v-if="coachFeedback.suggestions?.length" class="suggestions-list">
          <text class="suggestions-title">改进建议</text>
          <view
            v-for="(suggestion, index) in coachFeedback.suggestions"
            :key="index"
            class="suggestion-item"
          >
            <text class="suggestion-number">{{ index + 1 }}.</text>
            <text class="suggestion-text">{{ suggestion }}</text>
          </view>
        </view>
      </se-card>

      <!-- 操作按钮 -->
      <view class="action-buttons safe-area-inset-bottom">
        <se-button
          type="default"
          icon="share"
          text="分享"
          @click="shareAnalysis"
        />
        <se-button
          type="primary"
          icon="download"
          text="下载报告"
          @click="downloadReport"
        />
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-container">
      <text class="error-icon">❌</text>
      <text class="error-text">{{ errorMessage || '加载失败' }}</text>
      <se-button type="primary" text="重新加载" @click="loadAnalysisDetail" />
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { analysisAPI, coachAPI } from '@/utils/api.js'
import SeCard from '@/components/se-card/se-card.vue'
import SeButton from '@/components/se-button/se-button.vue'
import SeProgress from '@/components/se-progress/se-progress.vue'
import MdRenderer from '@/components/md-renderer/md-renderer.vue'

// 页面参数
const analysisId = ref('')

// 数据状态
const loading = ref(true)
const analysisData = ref(null)
const coachFeedback = ref(null)
const errorMessage = ref('')

// 页面加载
onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  analysisId.value = currentPage.options.id

  if (analysisId.value) {
    loadAnalysisDetail()
  } else {
    errorMessage.value = '缺少分析ID'
    loading.value = false
  }
})

// 加载分析详情
const loadAnalysisDetail = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    // 调用 API 获取详情
    const result = await analysisAPI.getAnalysisStatus(analysisId.value)

    if (result.status === 'COMPLETED' && result.result) {
      analysisData.value = result.result

      // 加载 AI 教练反馈
      await loadCoachFeedback()
    } else {
      errorMessage.value = '分析尚未完成或已失败'
    }
  } catch (error) {
    console.error('加载详情失败:', error)
    errorMessage.value = error.message || '加载失败，请重试'
  } finally {
    loading.value = false
  }
}

// 加载教练反馈
const loadCoachFeedback = async () => {
  try {
    const feedback = await coachAPI.getFeedback({
      type: 'fencing',
      score: analysisData.value.overall_score,
      metrics: analysisData.value.metrics
    })
    coachFeedback.value = feedback
  } catch (error) {
    console.error('加载教练反馈失败:', error)
  }
}

// 视频错误处理
const handleVideoError = (e) => {
  console.error('视频播放错误:', e)
  uni.showToast({
    title: '视频加载失败',
    icon: 'none'
  })
}

// 跳转到指定时间
const jumpToTime = (time) => {
  // TODO: 实现视频跳转功能
  uni.showToast({
    title: `跳转到 ${formatTime(time)}`,
    icon: 'none'
  })
}

// 分享分析结果
const shareAnalysis = () => {
  try {
    // 检查当前环境是否支持showShareMenu功能
    if (typeof uni.showShareMenu === 'function') {
      uni.showShareMenu({
        withShareTicket: true,
        success: () => {
          console.log('分享成功')
        },
        fail: () => {
          uni.showToast({
            title: '分享功能开发中',
            icon: 'none'
          })
        }
      })
    } else {
      console.warn('当前环境不支持showShareMenu功能')
      uni.showToast({
        title: '当前环境不支持分享功能',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('调用分享功能失败:', error)
    uni.showToast({
      title: '分享功能开发中',
      icon: 'none'
    })
  }
}

// 下载报告
const downloadReport = async () => {
  try {
    uni.showLoading({ title: '生成报告中...' })

    // TODO: 调用下载报告 API
    await new Promise(resolve => setTimeout(resolve, 2000))

    uni.hideLoading()
    uni.showToast({
      title: '报告已保存',
      icon: 'success'
    })
  } catch (error) {
    uni.hideLoading()
    console.error('下载报告失败:', error)
    uni.showToast({
      title: '下载失败',
      icon: 'none'
    })
  }
}

// 工具函数
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

const formatTime = (seconds) => {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

const getCircleStyle = (score) => {
  const deg = (score / 100) * 360
  let color = '#3b82f6'
  if (score >= 90) color = '#10b981'
  else if (score >= 80) color = '#3b82f6'
  else if (score >= 70) color = '#f59e0b'
  else color = '#ef4444'

  return {
    background: `conic-gradient(${color} ${deg}deg, rgba(71, 85, 105, 0.2) ${deg}deg)`
  }
}

const getStarCount = (score) => {
  return Math.ceil(score / 20)
}

const getScoreComment = (score) => {
  if (score >= 90) return '表现卓越！'
  if (score >= 80) return '表现优秀！'
  if (score >= 70) return '表现良好'
  if (score >= 60) return '需要提升'
  return '需要加强训练'
}

const getProgressType = (score) => {
  if (score >= 85) return 'success'
  if (score >= 70) return 'default'
  if (score >= 60) return 'warning'
  return 'danger'
}
</script>

<style lang="scss" scoped>
.page-detail {
  min-height: 100vh;
  padding: 32rpx;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 24rpx;
  font-size: 28rpx;
  color: #94a3b8;
}

/* 视频区域 */
.video-section {
  margin-bottom: 32rpx;
}

.video-player {
  width: 100%;
  height: 420rpx;
  background: #000000;
  border-radius: 16rpx;
}

/* 评分卡片 */
.score-card {
  text-align: center;
}

.score-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 32rpx;
}

.score-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #e2e8f0;
}

.score-date {
  font-size: 24rpx;
  color: #94a3b8;
}

.score-display {
  display: flex;
  justify-content: center;
  margin-bottom: 24rpx;
}

.score-circle {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-inner {
  width: 160rpx;
  height: 160rpx;
  background: rgba(12, 10, 21, 0.9);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-value {
  font-size: 72rpx;
  font-weight: 700;
  color: #3b82f6;
  line-height: 1;
}

.score-unit {
  font-size: 24rpx;
  color: #94a3b8;
  margin-top: 8rpx;
}

.score-rating {
  display: flex;
  justify-content: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.star {
  font-size: 40rpx;
  color: rgba(251, 191, 36, 0.3);

  &--filled {
    color: #fbbf24;
  }
}

.score-comment {
  font-size: 28rpx;
  color: #cbd5e1;
}

/* 指标网格 */
.metrics-grid {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.metric-item {
  width: 100%;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.metric-name {
  font-size: 26rpx;
  color: #e2e8f0;
}

.metric-value {
  font-size: 26rpx;
  font-weight: 600;
  color: #3b82f6;
}

/* 动作时间线 */
.actions-timeline {
  position: relative;
  padding-left: 32rpx;
}

.action-item {
  position: relative;
  margin-bottom: 24rpx;

  &:last-child {
    margin-bottom: 0;

    .action-timeline-dot::after {
      display: none;
    }
  }
}

.action-timeline-dot {
  position: absolute;
  left: -32rpx;
  top: 16rpx;
  width: 16rpx;
  height: 16rpx;
  background: #3b82f6;
  border-radius: 50%;
  box-shadow: 0 0 0 4rpx rgba(59, 130, 246, 0.2);

  &::after {
    content: '';
    position: absolute;
    top: 24rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 2rpx;
    height: 80rpx;
    background: rgba(71, 85, 105, 0.3);
  }
}

.action-card {
  padding: 24rpx;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(71, 85, 105, 0.3);
  border-radius: 16rpx;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
  }
}

.action-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.action-icon {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  border-radius: 12rpx;
  margin-right: 16rpx;
}

.action-info {
  flex: 1;
}

.action-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 8rpx;
}

.action-time {
  display: block;
  font-size: 22rpx;
  color: #64748b;
}

.action-score-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.action-score {
  font-size: 28rpx;
  font-weight: 700;
  color: #3b82f6;
}

.quality-dots {
  display: flex;
  gap: 4rpx;
}

.quality-dot {
  width: 8rpx;
  height: 24rpx;
  background: rgba(71, 85, 105, 0.3);
  border-radius: 2rpx;

  &--active {
    background: linear-gradient(180deg, #10b981, #059669);
  }
}

/* 教练建议 */
.coach-section {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.coach-avatar {
  width: 64rpx;
  height: 64rpx;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.coach-icon {
  font-size: 36rpx;
}

.coach-bubble {
  flex: 1;
  padding: 24rpx;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 16rpx;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: -10rpx;
    top: 20rpx;
    width: 0;
    height: 0;
    border-top: 10rpx solid transparent;
    border-bottom: 10rpx solid transparent;
    border-right: 10rpx solid rgba(30, 41, 59, 0.5);
  }
}

.coach-text {
  font-size: 26rpx;
  color: #cbd5e1;
  line-height: 1.8;
}

.suggestions-list {
  padding: 24rpx;
  background: rgba(30, 41, 59, 0.3);
  border-radius: 16rpx;
}

.suggestions-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 16rpx;
}

.suggestion-item {
  display: flex;
  gap: 12rpx;
  margin-bottom: 12rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.suggestion-number {
  font-size: 24rpx;
  color: #3b82f6;
  font-weight: 600;
  flex-shrink: 0;
}

.suggestion-text {
  flex: 1;
  font-size: 24rpx;
  color: #94a3b8;
  line-height: 1.6;
}

/* 操作按钮 */
.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(71, 85, 105, 0.2);
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.error-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.error-text {
  font-size: 26rpx;
  color: #94a3b8;
  margin-bottom: 32rpx;
}
</style>
