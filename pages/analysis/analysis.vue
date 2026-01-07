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
      <se-card title="训练视频">
        <view class="video-container">
          <video
            v-if="videoUrl"
            :key="videoUrl"
            :src="videoUrl"
            controls
            :autoplay="true"
            :show-center-play-btn="true"
            :enable-progress-gesture="true"
            class="video-player"
            style="width: 100%; height: 400rpx; border-radius: 12rpx;"
            @error="onVideoError"
          ></video>
          
          <view v-else class="loading-video">
            <text>正在加载 AI 处理后的视频...</text>
          </view>
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
     <se-card title="AI 教练深度诊断" variant="gradient" class="mt-4">
       <view class="coach-feedback">
         <view class="coach-avatar">
           <text class="coach-icon">🤖</text>
           <view v-if="isAiLoading" class="loading-text">正在生成专业建议...</view>
         </view>
         
         <view class="feedback-content">
           <rich-text :nodes="renderedFeedback" class="markdown-display"></rich-text>
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
import { marked } from 'marked'; 

// --- 状态变量 (由 ref 定义) ---
const coachFeedback = ref("")  // 存放原始 Markdown 文本
const isAiLoading = ref(false)

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
const suggestions = ref([])

// 历史记录
const recentAnalysis = ref([
  { id: 1, title: '直刺训练', date: '2025-12-17 14:30', score: 92 },
  { id: 2, title: '步法练习', date: '2025-12-16 10:15', score: 85 },
  { id: 3, title: '姿态矫正', date: '2025-12-15 16:00', score: 78 }
])

// --- 计算属性 ---

// 将 Markdown 转换为 rich-text 能识别的格式
const renderedFeedback = computed(() => {
  if (isAiLoading.value) return '<p style="color:#94a3b8">AI 教练正在生成诊断报告...</p>';
  if (!coachFeedback.value) return '<p style="color:#94a3b8">等待分析...</p>';
  
  // 使用 marked 将 Markdown 转为 HTML
  let html = marked(coachFeedback.value);
  
  // 如果你想彻底去掉所有符号且不使用 HTML 标签（不推荐，会失去排版）
  // 可以用正则去掉，但建议保留 HTML 结构，通过 CSS 隐藏列表符号
  return html;
});

// --- 方法函数 ---

// 选择文件
const selectFile = () => {
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    maxDuration: 600, 
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
      uni.showToast({ title: '选择文件失败', icon: 'none' })
    }
  })
}

// 开始上传
const startUpload = async () => {
  uploading.value = true
  uploadProgress.value = 0
  try {
    const startTime = Date.now()
    const result = await analysisAPI.startAnalysis(
      selectedFile.value.path,
      {},
      (progress) => {
        uploadProgress.value = progress
        const elapsed = (Date.now() - startTime) / 1000
        const uploaded = (selectedFile.value.size * progress) / 100
        const speed = uploaded / elapsed / 1024 / 1024
        uploadSpeed.value = `${speed.toFixed(2)} MB/s`
        uploadStatusText.value = progress < 100 ? `正在上传... ${progress.toFixed(1)}%` : '上传完成，开始分析...'
      }
    )
    analysisResult.value = result
    uploading.value = false
    startAnalysis()
  } catch (error) {
    console.error('上传失败:', error)
    uploading.value = false
    uni.showToast({ title: '上传失败，请重试', icon: 'none' })
  }
}

// 开始分析
const startAnalysis = async () => {
  analyzing.value = true
  currentStep.value = 0
  const sessionId = analysisResult.value.session_id 

  try {
    let isDone = false
    while (!isDone) {
      const statusRes = await analysisAPI.getStatus(sessionId) 
      if (statusRes.status === 'COMPLETED') {
        analysisResult.value = statusRes.result 
        isDone = true
      } else if (statusRes.status === 'FAILED') {
        throw new Error('后端处理失败')
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000))
        if (currentStep.value < 4) currentStep.value++
      }
    }
    analyzing.value = false
    showResults(analysisResult.value)
  } catch (error) {
    console.error('分析失败:', error)
    analyzing.value = false
    uni.showToast({ title: '分析失败', icon: 'none' })
  }
}
const getBaseUrl = () => {
  // 如果是开发环境且需要手动指定，可以保留逻辑；否则动态获取
  // if (process.env.NODE_ENV === 'development') {
  //   // 这里可以根据需要决定是否写死，或者从环境变量读取
  //   return 'http://192.168.149.139:5001'; 
  // }
  // 动态获取当前访问的域名和协议 (例如 http://192.168.1.5:5001)
  return `${window.location.protocol}//${window.location.hostname}:5001`;
};
// 显示分析结果
const showResults = async (result) => {
  console.log('--- 收到后端原始数据 ---', result);
  
  // 1. 兼容性数据源：优先取 analysis_data，如果没有，则认为 result 本身就是数据体
  const data = result.analysis_data || result; 
  
  // 打印到控制台，重点看这两个字段
    console.log('检查完整数据结构:', data);
    console.log('检查 metrics:', data.metrics);
    console.log('检查 actions:', data.detected_actions || data.actions);
  
    if (!data.metrics && (!data.detected_actions || data.detected_actions.length === 0)) {
      uni.showToast({
        title: '后端未检测到有效动作数据',
        icon: 'none',
        duration: 3000
      });
    }
  
  // 2. 视频地址处理
  const baseUrl = getBaseUrl(); 
  let rawPath = result.report_urls?.processed_video || data.processed_video || '';
  if (rawPath) {
    videoUrl.value = rawPath.startsWith('http') ? rawPath : baseUrl + (rawPath.startsWith('/') ? '' : '/') + rawPath;
  }

  // 3. 总体评分
  overallScore.value = data.overall_score || 85;

  // 4. 详细指标：尝试匹配 metrics 或 scores 字段
  const m = data.metrics || data.scores || {};
  detailedMetrics.value = [
    { id: 1, name: '姿态标准度', score: m.posture || m.posture_score || 80 },
    { id: 2, name: '动作流畅度', score: m.fluency || m.fluency_score || 80 },
    { id: 3, name: '速度控制', score: m.speed || m.speed_score || 80 },
    { id: 4, name: '力量输出', score: m.power || m.power_score || 80 },
    { id: 5, name: '精准度', score: m.accuracy || m.accuracy_score || 80 }
  ];

  // 5. 检测动作：尝试匹配 detected_actions 或 actions 字段
  const rawActions = data.detected_actions || data.actions || data.action_list || [];
  
  if (rawActions.length > 0) {
      detectedActions.value = rawActions.map((action, index) => {
		  //打印单条数据
		  console.log(`正在转换第 ${index} 个动作:`, action);
          // 这里的属性名必须跟后端完全一致，请核对：action_type 还是 label？
          return {
            id: action.id || (index + 1),
            // --- 核心修复：增加对 action.type 的读取 ---
            name: action.type || action.action_type || action.label || '未知动作', 
            icon: (action.type === '直刺' || action.action_type === '直刺') ? '⚔️' : '🛡️',
            color: 'rgba(59, 130, 246, 0.1)',
                         
            // 兼容性处理时间字段
            // 后端传的是 timestamp_sec (开始时间)
            timeStart: formatTime(action.timestamp_sec || 0),
            // 如果后端没有传持续时间，我们给个默认显示
            timeEnd: action.metrics?.["动作时长(秒)"] ? 
                    formatTime((action.timestamp_sec || 0) + parseFloat(action.metrics["动作时长(秒)"])) : 
                    action.timestamp_str || '进行中',
                         
            score: parseFloat(action.score) || 0
          };
      });
      console.log("转换后的动作列表:", detectedActions.value);
  } else {
      console.warn("后端返回的动作数组为空");
  }

  // 触发 AI 反馈
  fetchAiCoachFeedback(data);
  analysisCompleted.value = true;
};

// 获取 AI 反馈的具体实现
const fetchAiCoachFeedback = async (result) => {
  isAiLoading.value = true;
  try {
    const aiRes = await uni.request({
      url: 'http://127.0.0.1:5001/api/get_coach_feedback',
      method: 'POST',
      data: {
        type: "击剑技术动作",
        score: overallScore.value,
        metrics: result.analysis_data?.metrics || {}
      }
    });
    
    if (aiRes.data && aiRes.data.feedback) {
      coachFeedback.value = aiRes.data.feedback;
      suggestions.value = aiRes.data.suggestions || [];
    }
  } catch (e) {
    console.error("AI 接口调用失败", e);
    coachFeedback.value = '表现不错！建议出剑更加果断。';
    suggestions.value = ['注意保持步法的稳定性'];
  } finally {
    isAiLoading.value = false;
  }
}

// 视频错误处理
const onVideoError = (e) => {
  uni.showModal({
    title: '播放失败提示',
    content: '地址：' + videoUrl.value + '\n错误：' + e.detail.errMsg,
    showCancel: false
  });
};

// 工具函数
const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '00:00';
    const s = Math.floor(seconds);
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const getCircleStyle = (score) => getCircleProgressStyle(score)

// 操作函数
const viewAnalysisDetail = (id) => {
  uni.navigateTo({ url: `/pages/analysis/detail?id=${id}` })
}

const shareResults = () => {
  if (typeof uni.showShareMenu === 'function') {
    uni.showShareMenu({
      withShareTicket: true,
      fail: () => uni.showToast({ title: '分享功能开发中', icon: 'none' })
    })
  } else {
    uni.showToast({ title: '当前环境不支持分享', icon: 'none' })
  }
}

const downloadReport = async () => {
  uni.showLoading({ title: '生成报告中...' })
  await new Promise(resolve => setTimeout(resolve, 2000))
  uni.hideLoading()
  uni.showToast({ title: '报告已保存到相册', icon: 'success' })
}

const resetAnalysis = () => {
  analysisCompleted.value = false
  selectedFile.value = null
  overallScore.value = 0
  coachFeedback.value = ""
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

.markdown-display :deep(h1), 
.markdown-display :deep(h2), 
.markdown-display :deep(h3) {
  color: #3b82f6;
  font-size: 30rpx;
  font-weight: bold;
  margin: 20rpx 0 10rpx 0;
  display: block;
}

.markdown-display :deep(p) {
  font-size: 26rpx;
  line-height: 1.6;
  color: #cbd5e1;
  margin-bottom: 12rpx;
}

/* 针对列表符号的去除方案 */
.markdown-display :deep(ul) {
  padding-left: 0; // 去除缩进
  list-style-type: none; // 彻底去除 - 或 * 渲染出的圆点
}

.markdown-display :deep(li) {
  font-size: 26rpx;
  color: #cbd5e1;
  position: relative;
  padding-left: 20rpx;
  margin-bottom: 8rpx;
  
  // 用一个小蓝方块代替传统的杠或点
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 14rpx;
    width: 8rpx;
    height: 8rpx;
    background: #3b82f6;
    border-radius: 2rpx;
  }
}

.markdown-display :deep(strong) {
  color: #fbbf24; // 加粗文字用金色突出
  font-weight: bold;
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
