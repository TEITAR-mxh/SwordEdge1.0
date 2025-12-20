<template>
  <view class="page-monitor app-background">
    <!-- 摄像头预览区 -->
    <view class="camera-section">
      <!-- #ifdef H5 -->
      <video
        v-if="cameraEnabled"
        ref="cameraVideo"
        class="camera-preview"
        autoplay
        playsinline
        muted
      ></video>
      <!-- H5 用于绘制骨架覆盖层 -->
      <canvas v-if="cameraEnabled" ref="cameraCanvas" class="camera-preview" style="position:absolute;left:0;top:0;pointer-events:none;"></canvas>
      <!-- #endif -->
      
      <!-- #ifndef H5 -->
      <camera
        v-if="cameraEnabled"
        device-position="back"
        flash="off"
        :frame-size="frameSize"
        class="camera-preview"
        @error="handleCameraError"
      >
        <!-- 骨架overlay叠加层 -->
        <canvas
          v-if="showSkeleton"
          canvas-id="skeletonCanvas"
          class="skeleton-canvas"
        ></canvas>
      </camera>
      <!-- #endif -->

      <!-- 相机未启用时显示 -->
      <view v-else class="camera-placeholder">
        <text class="placeholder-icon">📷</text>
        <text class="placeholder-text">摄像头未启用</text>
        <se-button type="primary" text="启用摄像头" @click="enableCamera" />
      </view>

      <!-- 状态指示器 -->
      <view class="status-bar">
        <view class="status-item">
          <view class="status-dot" :class="{ active: isMonitoring }"></view>
          <text class="status-text">{{ isMonitoring ? '监控中' : '未监控' }}</text>
        </view>
        <view class="status-item">
          <text class="status-fps">{{ currentFPS }} FPS</text>
        </view>
      </view>
    </view>

    <!-- 实时数据面板 -->
    <view class="data-panel">
      <!-- 实时评分 -->
      <se-card class="score-card" variant="primary">
        <view class="score-container">
          <view class="score-circle">
            <view class="score-value">{{ realtimeScore }}</view>
            <view class="score-label">实时评分</view>
          </view>
          <view class="score-trend">
            <text class="trend-icon" :class="scoreTrend">
              {{ scoreTrend === 'up' ? '↑' : scoreTrend === 'down' ? '↓' : '−' }}
            </text>
            <text class="trend-text">{{ scoreTrendText }}</text>
          </view>
        </view>
      </se-card>

      <!-- 关键指标 -->
      <view class="metrics-grid">
        <view
          v-for="metric in keyMetrics"
          :key="metric.id"
          class="metric-item"
          :class="`metric-${metric.status}`"
        >
          <text class="metric-icon">{{ metric.icon }}</text>
          <view class="metric-info">
            <text class="metric-value">{{ metric.value }}</text>
            <text class="metric-label">{{ metric.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 控制按钮 -->
    <view class="control-section">
      <se-button
        v-if="!isMonitoring"
        type="success"
        size="large"
        icon="play"
        text="开始监控"
        block
        @click="startMonitoring"
      />
      <view v-else class="control-buttons">
        <se-button
          type="danger"
          size="large"
          icon="pause"
          text="停止"
          @click="stopMonitoring"
        />
        <se-button
          type="primary"
          size="large"
          icon="camera"
          text="截图"
          @click="captureFrame"
        />
      </view>
    </view>

    <!-- 动作识别结果 -->
    <view class="recognition-section">
      <view class="section-header">
        <text class="section-title">动作识别</text>
        <text class="section-badge">{{ recognitionCount }}</text>
      </view>

      <scroll-view scroll-y class="recognition-list">
        <view
          v-for="action in recognizedActions"
          :key="action.id"
          class="action-item"
        >
          <view class="action-time">{{ action.time }}</view>
          <view class="action-name">{{ action.name }}</view>
          <view class="action-confidence">
            <se-progress
              :percent="action.confidence"
              :show-info="false"
              height="8rpx"
              :type="getConfidenceType(action.confidence)"
            />
            <text class="confidence-value">{{ action.confidence }}%</text>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="recognizedActions.length === 0" class="empty-recognition">
          <text class="empty-icon">🎯</text>
          <text class="empty-text">等待动作识别...</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { monitorAPI, analysisAPI } from '@/utils/api.js'
import { createWebSocket } from '@/utils/request.js'
import { getConfidenceType } from '@/utils/common.js'
import SeCard from '@/components/se-card/se-card.vue'
import SeButton from '@/components/se-button/se-button.vue'
import SeProgress from '@/components/se-progress/se-progress.vue'

// 摄像头状态
const cameraEnabled = ref(false)
const frameSize = ref('medium')
const showSkeleton = ref(true)
const cameraVideo = ref(null)
const cameraCanvas = ref(null)

// 监控状态
const isMonitoring = ref(false)
const currentFPS = ref(0)
const realtimeScore = ref(0)
const scoreTrend = ref('stable')
const scoreTrendText = ref('稳定')
// 实时分析定时器句柄
let analysisTimer = null

// 关键指标
const keyMetrics = ref([
  { id: 1, icon: '角度', label: '姿态角度', value: '0°', status: 'normal' },
  { id: 2, icon: '速度', label: '出剑速度', value: '0 m/s', status: 'normal' },
  { id: 3, icon: '精准', label: '精准度', value: '0%', status: 'normal' },
  { id: 4, icon: '力量', label: '力量指数', value: '0', status: 'normal' }
])

// 动作识别
const recognitionCount = ref(0)
const recognizedActions = ref([])

// WebSocket 连接
let wsClient = null

// 页面加载
onMounted(() => {
  requestCameraPermission()
})

// 页面卸载
onUnmounted(() => {
  if (isMonitoring.value) {
    stopMonitoring()
  }
  if (wsClient) {
    wsClient.close()
  }
  
  // #ifdef H5
  // 释放摄像头流，避免内存泄漏
  if (window.cameraStream) {
    window.cameraStream.getTracks().forEach(track => {
      track.stop()
    })
    window.cameraStream = null
  }
  // #endif
})

// 请求摄像头权限
const requestCameraPermission = () => {
  // #ifdef H5
  // H5 平台需要使用 navigator.mediaDevices.getUserMedia 请求权限
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: 1280,
        height: 720
      },
      audio: false
    })
    .then(stream => {
      cameraEnabled.value = true
      // 保存摄像头流，用于后续处理
      window.cameraStream = stream
      // 将摄像头流赋值给video元素
      setTimeout(() => {
        if (cameraVideo.value) {
          try {
            cameraVideo.value.srcObject = stream
            // 在某些浏览器/环境下需要手动调用 play()
            const p = cameraVideo.value.play()
            if (p && typeof p.then === 'function') {
              p.catch(err => {
                console.warn('视频播放被阻止或不支持自动播放:', err)
              })
            }
          } catch (err) {
            console.warn('设置摄像头流到 video 元素失败:', err)
          }
        }
      }, 100)
    })
    .catch(err => {
      console.error('获取摄像头权限失败:', err)
      // 更详细的提示，包含可能的原因与解决方式
      const reason = err && err.name ? `${err.name}: ${err.message}` : (err && err.message ? err.message : '')
      uni.showModal({
        title: '需要摄像头权限',
        content: `无法访问摄像头。可能原因：未授权或浏览器阻止访问。请确保页面在 HTTPS 下并在地址栏允许摄像头访问。详情：${reason}`,
        confirmText: '知道了',
        showCancel: false
      })
    })
  } else {
    uni.showModal({
      title: '浏览器不支持',
      content: '您的浏览器不支持摄像头功能',
      confirmText: '知道了',
      showCancel: false
    })
  }
  // #endif

  // #ifndef H5
  // App 和小程序平台使用 authorize
  if (typeof uni.authorize === 'function') {
    uni.authorize({
      scope: 'scope.camera',
      success: () => {
        cameraEnabled.value = true
      },
      fail: () => {
        uni.showModal({
          title: '需要摄像头权限',
          content: '请在设置中开启摄像头权限以使用实时监控功能',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              uni.openSetting()
            }
          }
        })
      }
    })
  } else {
    // 降级处理
    cameraEnabled.value = true
  }
  // #endif
}

// 启用摄像头
const enableCamera = () => {
  requestCameraPermission()
}

// 摄像头错误处理
const handleCameraError = (error) => {
  console.error('摄像头错误:', error)
  uni.showToast({
    title: '摄像头启动失败',
    icon: 'none'
  })
}

// 开始监控
const startMonitoring = async () => {
  cameraEnabled.value = false
  cameraError.value = null
  try {
    uni.showLoading({ title: '启动监控中...' })

    // 如果已有流，先停止
    if (window.cameraStream) {
      try { window.cameraStream.getTracks().forEach(t=>t.stop()) } catch(e){}
      window.cameraStream = null
    }

    // H5: 直接打开摄像头并展示
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 }, audio: false })
        window.cameraStream = stream
        cameraEnabled.value = true
        // 赋值给 video 元素并尝试播放
        setTimeout(() => {
          if (cameraVideo.value) {
            cameraVideo.value.srcObject = stream
            try { const p = cameraVideo.value.play(); if (p && typeof p.then === 'function') p.catch(()=>{}) } catch(e){}
          }
        }, 50)
      } catch (err) {
        console.error('获取摄像头失败:', err)
        cameraError.value = err.message || String(err)
        uni.hideLoading()
        return
      }
    }

    // 通知后端启动监控（轻量）
    try { await monitorAPI.startMonitor({}, { showLoading: false }) } catch(e) { console.warn('monitorAPI.startMonitor failed', e) }

    isMonitoring.value = true
    currentFPS.value = 30

    // 初始化 WebSocket 连接（用于接收 frame 或其他实时数据）
    if (!wsClient) {
      wsClient = createWebSocket('/')
      try {
        await wsClient.connect()
        wsClient.onMessage((data) => handleRealtimeData(data))
      } catch (e) {
        console.warn('ws connect failed', e)
      }
    }

    // 每 500ms 抓取一帧并发送到后端分析（作为实时分析通道）
    if (analysisTimer) { clearInterval(analysisTimer); analysisTimer = null }
    analysisTimer = setInterval(async () => {
      try {
        if (cameraVideo.value && cameraVideo.value.readyState >= 2) {
          await sendFrameToBackend(cameraVideo.value)
        }
      } catch (e) {
        console.warn('sendFrameToBackend error', e)
      }
    }, 500)

    uni.hideLoading()
    uni.showToast({ title: '监控已启动', icon: 'success' })

  } catch (error) {
    console.error('启动监控失败:', error)
    try { uni.hideLoading() } catch(e){}
    uni.showToast({ title: '启动失败', icon: 'none' })
  }
}

// 停止监控
const stopMonitoring = async () => {
  try {
    try { await monitorAPI.stopMonitor() } catch(e){/* ignore */}

    // 停止模拟数据生成
    if (simulationTimer) { clearInterval(simulationTimer); simulationTimer = null }

    // 停止分析定时器
    if (analysisTimer) { clearInterval(analysisTimer); analysisTimer = null }

    // 停止摄像头流
    if (window.cameraStream) {
      try { window.cameraStream.getTracks().forEach(t=>t.stop()) } catch(e){}
      window.cameraStream = null
    }

    // 清理 video 元素
    if (cameraVideo.value) {
      try { cameraVideo.value.pause() } catch(e){}
      try { cameraVideo.value.srcObject = null } catch(e){}
    }

    // 断开 websocket
    if (wsClient) {
      try { wsClient.close() } catch(e){}
      wsClient = null
    }

    isMonitoring.value = false
    currentFPS.value = 0

    uni.showToast({ title: '监控已停止', icon: 'success' })

  } catch (error) {
    console.error('停止监控失败:', error)
  }
}

// 处理实时数据
const handleRealtimeData = (data) => {
  // 更新评分
  if (data.score !== undefined) {
    const oldScore = realtimeScore.value
    realtimeScore.value = data.score

    // 更新趋势
    if (data.score > oldScore + 2) {
      scoreTrend.value = 'up'
      scoreTrendText.value = '上升'
    } else if (data.score < oldScore - 2) {
      scoreTrend.value = 'down'
      scoreTrendText.value = '下降'
    } else {
      scoreTrend.value = 'stable'
      scoreTrendText.value = '稳定'
    }
  }

  // 更新关键指标
  if (data.metrics) {
    keyMetrics.value = data.metrics
  }

  // 更新动作识别
  if (data.action) {
    recognizedActions.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      name: data.action.name,
      confidence: data.action.confidence
    })

    // 限制列表长度
    if (recognizedActions.value.length > 20) {
      recognizedActions.value.pop()
    }

    recognitionCount.value = recognizedActions.value.length
  }

  // 更新 FPS
  if (data.fps) {
    currentFPS.value = data.fps
  }
}

// 截图分析
const captureFrame = () => {
  const ctx = uni.createCameraContext()

  ctx.takePhoto({
    quality: 'high',
    success: async (res) => {
      try {
        uni.showLoading({ title: '分析中...' })

        // 上传并分析截图
        const result = await analysisAPI.analyzeFrame(res.tempImagePath)

        uni.hideLoading()

        // 显示分析结果
        uni.showModal({
          title: '分析结果',
          content: `评分: ${result.score}\n姿态: ${result.posture}`,
          showCancel: false
        })

      } catch (error) {
        uni.hideLoading()
        console.error('截图分析失败:', error)
        uni.showToast({
          title: '分析失败',
          icon: 'none'
        })
      }
    },
    fail: (error) => {
      console.error('截图失败:', error)
      uni.showToast({
        title: '截图失败',
        icon: 'none'
      })
    }
  })
}

/**
 * 发送当前视频帧到后端进行单帧分析（H5）
 */
async function sendFrameToBackend(video) {
  try {
    // 创建临时 canvas 捕获当前帧
    const tmp = document.createElement('canvas')
    tmp.width = video.videoWidth || 640
    tmp.height = video.videoHeight || 480
    const tctx = tmp.getContext('2d')
    tctx.drawImage(video, 0, 0, tmp.width, tmp.height)

    const blob = await new Promise(resolve => tmp.toBlob(resolve, 'image/jpeg', 0.8))
    if (!blob) return

    const form = new FormData()
    form.append('frame', blob, 'frame.jpg')

    const resp = await fetch('http://127.0.0.1:5001/api/analyze_frame', { method: 'POST', body: form })
    if (!resp.ok) {
      console.warn('analyze_frame failed', resp.status)
      return
    }

    const data = await resp.json()
    // 兼容后端返回格式
    if (data && data.success) {
      // 更新 UI
      realtimeScore.value = Math.round(data.score || realtimeScore.value)
      if (data.metrics) {
        // 试图把后端 metrics 映射为前端 keyMetrics
        try {
          keyMetrics.value[0].value = (data.metrics['姿态角度'] || data.metrics['头部位置'] || keyMetrics.value[0].value) + '°'
          keyMetrics.value[1].value = (data.metrics['速度'] || keyMetrics.value[1].value) + ' m/s'
          keyMetrics.value[2].value = (data.metrics['姿态准确度'] || keyMetrics.value[2].value) + '%'
        } catch(e){}
      }

      // 绘制关键点（如果返回 keypoints）
      if (cameraCanvas.value && data.keypoints) {
        const canvas = cameraCanvas.value
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0,0,canvas.width,canvas.height)
        drawKeypoints(ctx, data.keypoints, canvas.width, canvas.height)
      }
    } else {
      // 未检测到人体
      if (cameraCanvas.value) {
        const ctx = cameraCanvas.value.getContext('2d')
        ctx.clearRect(0,0,cameraCanvas.value.width,cameraCanvas.value.height)
      }
    }
  } catch (e) {
    console.warn('sendFrameToBackend exception', e)
  }
}

function drawKeypoints(ctx, keypoints, width, height) {
  if (!keypoints || !ctx) return
  ctx.save()
  ctx.fillStyle = 'rgba(34,197,94,0.9)'
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 2
  for (let i=0;i<keypoints.length;i++) {
    const p = keypoints[i]
    // 如果后端使用 normalized coords (0..1)，尝试兼容
    let x = p.x, y = p.y
    if (x <= 1 && y <= 1) { x = x * width; y = y * height }
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke()
  }
  ctx.restore()
}



// 模拟数据更新（开发阶段）
let simulationTimer = null
const startDataSimulation = () => {
  simulationTimer = setInterval(() => {
    // 模拟评分变化
    const delta = Math.floor(Math.random() * 5) - 2
    realtimeScore.value = Math.max(0, Math.min(100, realtimeScore.value + delta))

    // 模拟指标更新
    keyMetrics.value[0].value = `${Math.floor(Math.random() * 180)}°`
    keyMetrics.value[1].value = `${(Math.random() * 5).toFixed(1)} m/s`
    keyMetrics.value[2].value = `${Math.floor(Math.random() * 100)}%`
    keyMetrics.value[3].value = `${Math.floor(Math.random() * 100)}`

    // 随机添加动作识别
    if (Math.random() > 0.7) {
      const actions = ['前刺', '后撤', '防守', '进攻', '步法移动']
      recognizedActions.value.unshift({
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        name: actions[Math.floor(Math.random() * actions.length)],
        confidence: 70 + Math.floor(Math.random() * 30)
      })

      if (recognizedActions.value.length > 20) {
        recognizedActions.value.pop()
      }

      recognitionCount.value = recognizedActions.value.length
    }
  }, 2000)
}
</script>

<style lang="scss" scoped>
.page-monitor {
  min-height: 100vh;
  padding-bottom: env(safe-area-inset-bottom);
}

/* 摄像头区域 */
.camera-section {
  position: relative;
  width: 100%;
  height: 500rpx;
  background: #000000;
  margin-bottom: 24rpx;
}

.camera-preview {
  width: 100%;
  height: 100%;
}

.skeleton-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.camera-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(17, 24, 39, 0.9);
}

.placeholder-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.placeholder-text {
  font-size: 28rpx;
  color: #94a3b8;
  margin-bottom: 32rpx;
}

.status-bar {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  right: 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  padding: 8rpx 16rpx;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 12rpx;
}

.status-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #ef4444;
  margin-right: 8rpx;

  &.active {
    background: #10b981;
    animation: pulse 2s infinite;
  }
}

.status-text {
  font-size: 22rpx;
  color: #ffffff;
}

.status-fps {
  font-size: 22rpx;
  color: #ffffff;
  font-weight: 600;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 数据面板 */
.data-panel {
  padding: 0 32rpx;
  margin-bottom: 24rpx;
}

.score-card {
  margin-bottom: 16rpx;
}

.score-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.score-circle {
  text-align: center;
}

.score-value {
  font-size: 64rpx;
  font-weight: 700;
  color: #3b82f6;
  line-height: 1;
  margin-bottom: 8rpx;
  transition: all 0.5s ease;
  animation: scoreUpdate 0.5s ease-out;
}

@keyframes scoreUpdate {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.score-label {
  font-size: 24rpx;
  color: #94a3b8;
}

.score-trend {
  text-align: right;
}

.trend-icon {
  font-size: 48rpx;
  font-weight: 700;

  &.up {
    color: #10b981;
  }

  &.down {
    color: #ef4444;
  }

  &.stable {
    color: #94a3b8;
  }
}

.trend-text {
  display: block;
  font-size: 22rpx;
  color: #94a3b8;
  margin-top: 8rpx;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.metric-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(71, 85, 105, 0.2);
  border-radius: 16rpx;

  &.metric-good {
    border-color: rgba(16, 185, 129, 0.3);
  }

  &.metric-warning {
    border-color: rgba(245, 158, 11, 0.3);
  }

  &.metric-danger {
    border-color: rgba(239, 68, 68, 0.3);
  }
}

.metric-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.metric-info {
  flex: 1;
}

.metric-value {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 4rpx;
  transition: all 0.3s ease;
  animation: metricUpdate 0.3s ease-out;
}

@keyframes metricUpdate {
  0% {
    opacity: 0.7;
    transform: translateX(-10rpx);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

.metric-label {
  display: block;
  font-size: 20rpx;
  color: #64748b;
}

/* 动作识别 */
.recognition-section {
  padding: 0 32rpx;
  margin-bottom: 120rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #e2e8f0;
}

.section-badge {
  font-size: 22rpx;
  color: #ffffff;
  background: #3b82f6;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.recognition-list {
  max-height: 400rpx;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx;
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(71, 85, 105, 0.2);
  border-radius: 12rpx;
  margin-bottom: 12rpx;
  animation: actionItemSlideIn 0.5s ease forwards;
  opacity: 0;
  transform: translateX(-20rpx);
  
  &:hover {
    background: rgba(17, 24, 39, 0.9);
    border-color: rgba(59, 130, 246, 0.4);
  }
}

@keyframes actionItemSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.action-time {
  font-size: 20rpx;
  color: #64748b;
  min-width: 100rpx;
}

.action-name {
  flex: 1;
  font-size: 26rpx;
  font-weight: 600;
  color: #e2e8f0;
}

.action-confidence {
  min-width: 120rpx;
  text-align: right;
}

.confidence-value {
  display: block;
  font-size: 20rpx;
  color: #94a3b8;
  margin-top: 4rpx;
}

.empty-recognition {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 32rpx;
}

.empty-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 24rpx;
  color: #64748b;
}

/* 控制按钮 */
.control-section {
  padding: 20rpx 32rpx;
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(71, 85, 105, 0.2);
  border-radius: 16rpx;
  margin: 0 32rpx 16rpx 32rpx;
}

.control-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}
</style>
