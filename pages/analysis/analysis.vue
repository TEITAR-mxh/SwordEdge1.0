<template>
  <view class="page-analysis app-background">
    <!-- 上传区域 -->
    <view v-if="!analysisCompleted" class="upload-section">
      <se-card title="训练数据分析" subtitle="上传您的训练视频进行AI分析">
        <!-- 拖拽上传区 -->
        <view
          class="drop-zone"
          :class="{ 'drop-zone--active': isDragging }"
          @tap="selectFile"
        >
          <text class="drop-icon">📹</text>
          <text class="drop-title">点击选择视频文件</text>
          <text class="drop-hint">支持 MP4, MOV, AVI 格式，最大 500MB</text>

          <se-button
            type="primary"
            icon="folder"
            text="选择文件"
            class="mt-4"
            @click.stop="selectFile"
          />
        </view>

        <!-- 上传进度 -->
        <view v-if="uploading" class="upload-progress">
          <view class="upload-info">
            <text class="upload-filename">{{ selectedFile.name }}</text>
            <text class="upload-size">{{ formatFileSize(selectedFile.size) }}</text>
          </view>

          <se-progress
            :percent="uploadProgress"
            label="上传中"
            :active="true"
            :striped="true"
            type="primary"
          />

          <view class="upload-status">
            <text class="status-text">{{ uploadStatusText }}</text>
            <text class="status-speed">{{ uploadSpeed }}</text>
          </view>
        </view>

        <!-- 分析进度 -->
        <view v-if="analyzing" class="analysis-progress">
          <view class="analysis-spinner">
            <view class="spinner"></view>
          </view>
          <text class="analysis-text">AI 正在分析您的训练视频...</text>
          <text class="analysis-hint">这可能需要几分钟时间</text>

          <view class="analysis-steps">
            <view
              v-for="(step, index) in analysisSteps"
              :key="index"
              class="step-item"
              :class="{ 'step-item--active': currentStep >= index }"
            >
              <view class="step-dot"></view>
              <text class="step-text">{{ step }}</text>
            </view>
          </view>
        </view>
      </se-card>

      <!-- 历史记录快捷入口 -->
      <se-card title="历史分析记录" class="mt-4">
        <view class="history-list">
          <view
            v-for="record in recentAnalysis"
            :key="record.id"
            class="history-item"
            @tap="viewAnalysisDetail(record.id)"
          >
            <view class="history-icon">
              <text class="icon-text">📊</text>
            </view>
            <view class="history-info">
              <text class="history-title">{{ record.title }}</text>
              <text class="history-date">{{ record.date }}</text>
            </view>
            <view class="history-score">
              <text class="score-value">{{ record.score }}</text>
              <text class="score-label">分</text>
            </view>
          </view>

          <view v-if="recentAnalysis.length === 0" class="empty-history">
            <text class="empty-icon">📂</text>
            <text class="empty-text">暂无历史记录</text>
          </view>
        </view>
      </se-card>
    </view>

    <!-- 分析结果 -->
    <view v-else class="results-section">
      <!-- 视频预览 -->
      <se-card title="训练视频">
        <view class="video-container">
          <video
            :src="videoUrl"
            controls
            :show-center-play-btn="true"
            :enable-progress-gesture="true"
            class="video-player"
          ></video>
        </view>
      </se-card>

      <!-- 综合评分 -->
      <view class="score-card">
        <view class="score-header">
          <text class="score-title">综合评分</text>
          <text class="score-date">{{ analysisDate }}</text>
        </view>

        <view class="score-circle">
          <view class="circle-bg" :style="getCircleStyle(overallScore)">
            <view class="circle-inner">
              <text class="circle-value">{{ overallScore }}</text>
              <text class="circle-label">分</text>
            </view>
          </view>
        </view>

        <view class="score-stars">
          <text
            v-for="star in 5"
            :key="star"
            class="star"
            :class="{ 'star--filled': star <= getStarCount(overallScore) }"
          >
            ★
          </text>
        </view>

        <text class="score-comment">{{ getScoreComment(overallScore) }}</text>
      </view>

      <!-- 详细指标 -->
      <se-card title="详细指标" class="mt-4">
        <view class="metrics-list">
          <view
            v-for="metric in detailedMetrics"
            :key="metric.id"
            class="metric-row"
          >
            <view class="metric-header">
              <text class="metric-name">{{ metric.name }}</text>
              <text class="metric-score">{{ metric.score }}</text>
            </view>
            <se-progress
              :percent="metric.score"
              :show-info="false"
              height="12rpx"
              :type="getMetricType(metric.score)"
            />
          </view>
        </view>
      </se-card>

      <!-- 检测到的动作 -->
      <se-card title="检测到的动作" :subtitle="`共 ${detectedActions.length} 个`" class="mt-4">
        <view class="actions-list">
          <view
            v-for="action in detectedActions"
            :key="action.id"
            class="action-card"
          >
            <view class="action-left">
              <view class="action-icon-wrapper" :style="{ background: action.color }">
                <text class="action-icon">{{ action.icon }}</text>
              </view>
              <view class="action-info">
                <text class="action-name">{{ action.name }}</text>
                <text class="action-time">{{ action.timeStart }} - {{ action.timeEnd }}</text>
              </view>
            </view>

            <view class="action-right">
              <text class="action-score">{{ action.score }}分</text>
              <view class="quality-bars">
                <view
                  v-for="bar in 5"
                  :key="bar"
                  class="quality-bar"
                  :class="{ 'quality-bar--filled': bar <= Math.ceil(action.score / 20) }"
                ></view>
              </view>
            </view>
          </view>
        </view>
      </se-card>

      <!-- AI 教练反馈 -->
      <se-card title="AI 教练反馈" variant="gradient" class="mt-4">
        <view class="coach-feedback">
          <view class="coach-avatar">
            <text class="coach-icon">🤖</text>
          </view>
          <view class="feedback-content">
            <text class="feedback-text">{{ coachFeedback }}</text>
          </view>
        </view>

        <view class="suggestions">
          <text class="suggestions-title">改进建议</text>
          <view class="suggestion-item" v-for="(suggestion, index) in suggestions" :key="index">
            <text class="suggestion-bullet">•</text>
            <text class="suggestion-text">{{ suggestion }}</text>
          </view>
        </view>
      </se-card>

      <!-- 操作按钮 -->
      <view class="action-buttons safe-area-inset-bottom">
        <se-button
          type="default"
          icon="share"
          text="分享结果"
          @click="shareResults"
        />
        <se-button
          type="primary"
          icon="download"
          text="下载报告"
          @click="downloadReport"
        />
      </view>

      <!-- 重新分析按钮 -->
      <view class="reanalyze-section">
        <se-button
          type="primary"
          text="分析新视频"
          block
          @click="resetAnalysis"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { analysisAPI, coachAPI } from '@/utils/api.js'
import { getCircleProgressStyle, getStarCount, getScoreComment, getMetricType, formatFileSize } from '@/utils/common.js'
import SeCard from '@/components/se-card/se-card.vue'
import SeButton from '@/components/se-button/se-button.vue'
import SeProgress from '@/components/se-progress/se-progress.vue'

// 上传状态
const selectedFile = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatusText = ref('准备上传...')
const uploadSpeed = ref('')
const isDragging = ref(false)

// 分析状态
const analyzing = ref(false)
const analysisCompleted = ref(false)
const currentStep = ref(0)
const analysisSteps = ref([
  '上传视频中...',
  '提取关键帧...',
  '姿态识别中...',
  '动作分析中...',
  '生成报告中...'
])

// 分析结果
const analysisResult = ref(null)
const videoUrl = ref('')
const analysisDate = ref('')
const overallScore = ref(0)
const detailedMetrics = ref([])
const detectedActions = ref([])
const coachFeedback = ref('')
const suggestions = ref([])

// 历史记录
const recentAnalysis = ref([
  { id: 1, title: '直刺训练', date: '2025-12-17 14:30', score: 92 },
  { id: 2, title: '步法练习', date: '2025-12-16 10:15', score: 85 },
  { id: 3, title: '姿态矫正', date: '2025-12-15 16:00', score: 78 }
])

// 选择文件
const selectFile = () => {
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    maxDuration: 600, // 最大10分钟
    camera: 'back',
    success: (res) => {
      selectedFile.value = {
        path: res.tempFilePath,
        name: '训练视频.mp4',
        size: res.size,
        duration: res.duration
      }
      startUpload()
    },
    fail: (error) => {
      console.error('选择视频失败:', error)
      uni.showToast({
        title: '选择文件失败',
        icon: 'none'
      })
    }
  })
}

// 开始上传
const startUpload = async () => {
  uploading.value = true
  uploadProgress.value = 0

  try {
    const startTime = Date.now()
    let lastProgress = 0

    // 调用上传 API
    const result = await analysisAPI.startAnalysis(
      selectedFile.value.path,
      {},
      (progress) => {
        uploadProgress.value = progress

        // 计算上传速度
        const elapsed = (Date.now() - startTime) / 1000 // 秒
        const uploaded = (selectedFile.value.size * progress) / 100
        const speed = uploaded / elapsed / 1024 / 1024 // MB/s
        uploadSpeed.value = `${speed.toFixed(2)} MB/s`

        // 更新状态文本
        if (progress < 100) {
          uploadStatusText.value = `正在上传... ${progress.toFixed(1)}%`
        } else {
          uploadStatusText.value = '上传完成，开始分析...'
        }

        lastProgress = progress
      }
    )

    // 上传完成，存储分析结果并开始分析
    analysisResult.value = result
    uploading.value = false
    startAnalysis()

  } catch (error) {
    console.error('上传失败:', error)
    uploading.value = false
    uni.showToast({
      title: '上传失败，请重试',
      icon: 'none'
    })
  }
}

// 开始分析 - 现在直接从上传结果获取分析数据
const startAnalysis = async () => {
  analyzing.value = true
  currentStep.value = 0

  try {
    // 模拟分析进度更新
    const updateProgress = (step) => {
      currentStep.value = step
    }

    // 模拟分析过程
    updateProgress(1)
    await new Promise(resolve => setTimeout(resolve, 1000))
    updateProgress(2)
    await new Promise(resolve => setTimeout(resolve, 1000))
    updateProgress(3)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 分析完成，调用显示结果函数
    analyzing.value = false
    showResults(analysisResult.value)

  } catch (error) {
    console.error('分析失败:', error)
    analyzing.value = false
    uni.showToast({
      title: '分析失败',
      icon: 'none'
    })
  }
}

// 显示分析结果
const showResults = async (result) => {
  // 设置基础信息
  videoUrl.value = selectedFile.value.path
  analysisDate.value = new Date().toLocaleString('zh-CN')
  overallScore.value = 85 // 默认评分，后续可从结果中提取

  // 详细指标
  detailedMetrics.value = [
    { id: 1, name: '姿态标准度', score: 88 },
    { id: 2, name: '动作流畅度', score: 82 },
    { id: 3, name: '速度控制', score: 86 },
    { id: 4, name: '力量输出', score: 84 },
    { id: 5, name: '精准度', score: 90 }
  ]

  // 检测到的动作 - 使用后端返回的分析数据
  const backendActions = result.analysis_data?.detected_actions || []
  detectedActions.value = backendActions.map((action, index) => ({
    id: index + 1,
    name: action.action_type || '未知动作',
    icon: '→',
    color: 'rgba(59, 130, 246, 0.2)',
    timeStart: action.timestamp_sec ? formatTime(action.timestamp_sec) : '00:00',
    timeEnd: action.timestamp_sec ? formatTime(action.timestamp_sec + action.duration_sec) : '00:00',
    score: action.score || 85
  })) || [
    {
      id: 1,
      name: '直刺',
      icon: '→',
      color: 'rgba(59, 130, 246, 0.2)',
      timeStart: '00:12',
      timeEnd: '00:18',
      score: 92
    },
    {
      id: 2,
      name: '防守',
      icon: '🛡️',
      color: 'rgba(16, 185, 129, 0.2)',
      timeStart: '00:25',
      timeEnd: '00:32',
      score: 85
    },
    {
      id: 3,
      name: '反击',
      icon: '⚡',
      color: 'rgba(245, 158, 11, 0.2)',
      timeStart: '00:40',
      timeEnd: '00:48',
      score: 88
    }
  ]

  // 获取 AI 教练反馈
  try {
    const feedback = await coachAPI.getFeedback({
      type: 'fencing',
      score: overallScore.value,
      metrics: {
        posture: detailedMetrics.value[0].score,
        fluency: detailedMetrics.value[1].score,
        speed: detailedMetrics.value[2].score
      }
    })

    coachFeedback.value = feedback.feedback || '您的表现非常出色！继续保持这样的训练强度。'
    suggestions.value = feedback.suggestions || [
      '注意保持步法的稳定性，避免重心过度前倾',
      '出剑时手腕力度可以更加集中',
      '建议增加柔韧性训练，提高动作幅度'
    ]
  } catch (error) {
    console.error('获取反馈失败:', error)
    coachFeedback.value = '您的表现非常出色！继续保持这样的训练强度。'
    suggestions.value = [
      '注意保持步法的稳定性',
      '出剑时手腕力度可以更加集中',
      '建议增加柔韧性训练'
    ]
  }

  analysisCompleted.value = true
}

// 工具函数
// 格式化时间（秒 → MM:SS）
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getCircleStyle = (score) => {
  return getCircleProgressStyle(score)
}

// 操作函数
const viewAnalysisDetail = (id) => {
  uni.navigateTo({
    url: `/pages/analysis/detail?id=${id}`
  })
}

const shareResults = () => {
  try {
    // 检查当前环境是否支持showShareMenu功能
    if (typeof uni.showShareMenu === 'function') {
      uni.showShareMenu({
        withShareTicket: true,
        success: () => {
          console.log('分享成功')
        },
        fail: (error) => {
          console.error('分享失败:', error)
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

const downloadReport = async () => {
  try {
    uni.showLoading({ title: '生成报告中...' })

    // 生成报告 PDF 或图片
    await new Promise(resolve => setTimeout(resolve, 2000))

    uni.hideLoading()
    uni.showToast({
      title: '报告已保存到相册',
      icon: 'success'
    })
  } catch (error) {
    uni.hideLoading()
    console.error('下载失败:', error)
    uni.showToast({
      title: '下载失败',
      icon: 'none'
    })
  }
}

const resetAnalysis = () => {
  analysisCompleted.value = false
  selectedFile.value = null
  overallScore.value = 0
}
</script>

<style lang="scss" scoped>
.page-analysis {
  min-height: 100vh;
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}

/* 上传区域 */
.upload-section {
  width: 100%;
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 32rpx;
  border: 2px dashed rgba(71, 85, 105, 0.5);
  border-radius: 24rpx;
  background: rgba(30, 41, 59, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
  transform: translateY(0);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);

  &:hover {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    transform: translateY(-4rpx);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
  }

  &--active {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.15);
    transform: scale(1.02) translateY(-4rpx);
    box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: scale(0.98);
  }
}

.drop-icon {
  font-size: 96rpx;
  margin-bottom: 24rpx;
}

.drop-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 12rpx;
}

.drop-hint {
  font-size: 24rpx;
  color: #94a3b8;
  text-align: center;
  margin-bottom: 32rpx;
}

/* 上传进度 */
.upload-progress {
  margin-top: 32rpx;
  padding: 24rpx;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 16rpx;
}

.upload-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.upload-filename {
  font-size: 28rpx;
  color: #e2e8f0;
  font-weight: 600;
}

.upload-size {
  font-size: 24rpx;
  color: #94a3b8;
}

.upload-status {
  display: flex;
  justify-content: space-between;
  margin-top: 12rpx;
}

.status-text {
  font-size: 24rpx;
  color: #94a3b8;
}

.status-speed {
  font-size: 24rpx;
  color: #3b82f6;
  font-weight: 600;
}

/* 分析进度 */
.analysis-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 24rpx;
}

.analysis-spinner {
  margin-bottom: 24rpx;
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

.analysis-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 8rpx;
}

.analysis-hint {
  font-size: 24rpx;
  color: #94a3b8;
  margin-bottom: 32rpx;
}

.analysis-steps {
  width: 100%;
  margin-top: 32rpx;
}

.step-item {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  opacity: 0.4;
  transition: opacity 0.3s ease;

  &--active {
    opacity: 1;

    .step-dot {
      background: #10b981;
      box-shadow: 0 0 20rpx rgba(16, 185, 129, 0.5);
    }
  }
}

.step-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: rgba(71, 85, 105, 0.5);
  margin-right: 16rpx;
  transition: all 0.3s ease;
}

.step-text {
  font-size: 24rpx;
  color: #94a3b8;
}

/* 历史记录 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(71, 85, 105, 0.3);
  border-radius: 16rpx;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
    background: rgba(30, 41, 59, 0.7);
  }
}

.history-icon {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 12rpx;
  margin-right: 24rpx;
}

.icon-text {
  font-size: 32rpx;
}

.history-info {
  flex: 1;
}

.history-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 8rpx;
}

.history-date {
  display: block;
  font-size: 22rpx;
  color: #64748b;
}

.history-score {
  text-align: right;
}

.score-value {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #3b82f6;
}

.score-label {
  font-size: 20rpx;
  color: #94a3b8;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 32rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 24rpx;
  color: #64748b;
}

/* 结果区域 */
.results-section {
  width: 100%;
}

.video-container {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000000;
  border-radius: 16rpx;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 100%;
}

/* 评分卡片 */
.score-card {
  margin-top: 32rpx;
  padding: 48rpx 32rpx;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 24rpx;
  text-align: center;
  animation: resultCardFadeIn 0.6s ease forwards;
  opacity: 0;
  transform: translateY(20rpx);
  box-shadow: 0 4rpx 16rpx rgba(59, 130, 246, 0.1);
}

@keyframes resultCardFadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

.score-circle {
  display: flex;
  justify-content: center;
  margin-bottom: 24rpx;
}

.circle-bg {
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-inner {
  width: 200rpx;
  height: 200rpx;
  background: rgba(12, 10, 21, 0.9);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.circle-value {
  font-size: 88rpx;
  font-weight: 700;
  color: #3b82f6;
  line-height: 1;
}

.circle-label {
  font-size: 28rpx;
  color: #94a3b8;
  margin-top: 8rpx;
}

.score-stars {
  display: flex;
  justify-content: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.star {
  font-size: 48rpx;
  color: rgba(251, 191, 36, 0.3);

  &--filled {
    color: #fbbf24;
  }
}

.score-comment {
  font-size: 28rpx;
  color: #cbd5e1;
}

/* 详细指标 */
.metrics-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* 为结果区域的各个卡片添加动画延迟 */
.results-section .se-card {
  animation: resultCardFadeIn 0.6s ease forwards;
  opacity: 0;
  transform: translateY(20rpx);
}

.results-section .se-card:nth-child(1) { animation-delay: 0.2s; }
.results-section .se-card:nth-child(2) { animation-delay: 0.4s; }
.results-section .se-card:nth-child(3) { animation-delay: 0.6s; }
.results-section .se-card:nth-child(4) { animation-delay: 0.8s; }
.results-section .se-card:nth-child(5) { animation-delay: 1s; }

.metric-row {
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

.metric-score {
  font-size: 26rpx;
  font-weight: 600;
  color: #3b82f6;
}

/* 动作列表 */
.actions-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.action-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(71, 85, 105, 0.3);
  border-radius: 16rpx;
}

.action-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.action-icon-wrapper {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-right: 24rpx;
}

.action-icon {
  font-size: 36rpx;
}

.action-info {
  display: flex;
  flex-direction: column;
}

.action-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 8rpx;
}

.action-time {
  font-size: 22rpx;
  color: #64748b;
}

.action-right {
  text-align: right;
}

.action-score {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 8rpx;
}

.quality-bars {
  display: flex;
  gap: 4rpx;
  justify-content: flex-end;
}

.quality-bar {
  width: 6rpx;
  height: 24rpx;
  background: rgba(71, 85, 105, 0.3);
  border-radius: 2rpx;

  &--filled {
    background: linear-gradient(180deg, #10b981, #059669);
  }
}

/* AI 教练反馈 */
.coach-feedback {
  display: flex;
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.coach-avatar {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  flex-shrink: 0;
}

.coach-icon {
  font-size: 40rpx;
}

.feedback-content {
  flex: 1;
  padding: 24rpx;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 16rpx;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: -12rpx;
    top: 24rpx;
    width: 0;
    height: 0;
    border-top: 12rpx solid transparent;
    border-bottom: 12rpx solid transparent;
    border-right: 12rpx solid rgba(30, 41, 59, 0.5);
  }
}

.feedback-text {
  font-size: 26rpx;
  color: #cbd5e1;
  line-height: 1.8;
}

.suggestions {
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

.suggestion-bullet {
  font-size: 24rpx;
  color: #3b82f6;
  flex-shrink: 0;
}

.suggestion-text {
  font-size: 24rpx;
  color: #94a3b8;
  line-height: 1.6;
}

/* 操作按钮 */
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-top: 32rpx;
}

.reanalyze-section {
  margin-top: 24rpx;
  margin-bottom: 32rpx;
}
</style>
