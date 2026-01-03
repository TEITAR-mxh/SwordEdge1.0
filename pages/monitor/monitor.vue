<template>
<view class="page-monitor">
  <view class="camera-section">
    <video
      v-if="cameraEnabled"
      ref="cameraVideo"
      class="camera-preview"
      autoplay
      muted
      playsinline
      webkit-playsinline="true"
    ></video>
    
    <canvas 
      v-if="cameraEnabled" 
      ref="cameraCanvas" 
      canvas-id="cameraCanvas"
      class="camera-preview" 
      style="position:absolute; left:0; top:0; pointer-events:none; z-index:10;"
    ></canvas>
    <camera
      v-if="cameraEnabled"
      device-position="back"
      flash="off"
      :frame-size="frameSize"
      class="camera-preview"
      @error="handleCameraError"
    >
      <canvas
        v-if="showSkeleton"
        canvas-id="skeletonCanvas"
        class="skeleton-canvas"
      ></canvas>
    </camera>
    <view v-else class="camera-placeholder">
      <text class="placeholder-icon">📷</text>
      <text class="placeholder-text">摄像头未启用</text>
      <se-button type="primary" text="启用摄像头" @click="enableCamera" />
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
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
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
const cameraError = ref(null)
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

const lastLoggedAction = ref("");
let activeStream = null;
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
const requestCameraPermission = async () => {
  // #ifdef H5
  // 1. 检查浏览器环境是否支持
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const isNotHttps = window.location.protocol !== 'https:' && window.location.hostname !== 'localhost';
    uni.showModal({
      title: '环境不支持',
      content: isNotHttps ? '由于浏览器安全策略，非 HTTPS 环境无法调用摄像头，请切换至 HTTPS 访问。' : '您的浏览器不支持访问摄像头。',
      showCancel: false
    });
    return;
  }

  try {
    // 2. 停止旧的流（如果存在），防止设备占用
    if (window.cameraStream) {
      window.cameraStream.getTracks().forEach(track => track.stop());
    }

    // 3. 正式请求媒体流
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user', // 或 'environment' (后置)
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    // 4. 存储流并更新 UI 状态
    window.cameraStream = stream;
    //cameraEnabled.value = true;

    // // 5. 立即绑定到 video 元素
    // await nextTick();
    // // 兼容处理：获取 video 节点
    // const videoEl = cameraVideo.value?.$el?.querySelector('video') || cameraVideo.value;
    
    // if (videoEl) {
    //   videoEl.srcObject = stream;
    //   // 处理某些浏览器必须手动触发播放的情况
    //   videoEl.onloadedmetadata = () => {
    //     videoEl.play().catch(e => console.warn('自动播放被拦截:', e));
    //   };
    // }
    
    uni.showToast({ title: '摄像头已就绪', icon: 'success' });

  } catch (err) {
    console.error('摄像头授权失败详情:', err);
    let errorMsg = '无法访问摄像头';
    
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      errorMsg = '权限被拒绝，请在地址栏点击锁形图标重新授权';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      errorMsg = '未找到摄像头设备';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      errorMsg = '摄像头可能被其他程序（如微信、腾讯会议）占用';
    }

    uni.showModal({
      title: '授权失败',
      content: errorMsg,
      showCancel: false
    });
    cameraEnabled.value = false;
  }
  // #endif

  // #ifndef H5
  // App/小程序 保持原有的 authorize 逻辑
  uni.authorize({
    scope: 'scope.camera',
    success: () => {
      cameraEnabled.value = true;
    },
    fail: () => {
      uni.showModal({
        title: '需要摄像头权限',
        content: '请在系统设置中开启摄像头权限',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) uni.openSetting();
        }
      });
    }
  });
  // #endif
}

// 启用摄像头
const enableCamera = () => {
  startMonitoring()
}

// 摄像头错误处理
const handleCameraError = (error) => {
  console.error('摄像头错误:', error)
  uni.showToast({
    title: '摄像头启动失败',
    icon: 'none'
  })
}

// 定义一个持久化的离屏 canvas，避免频繁创建销毁导致的内存溢出
let offscreenCanvas = null;
let offscreenCtx = null;
// 开始监控
const startMonitoring = async () => {
  if (isMonitoring.value) return;
  console.log('正在启动监控系统...');
  
  uni.showLoading({ title: '算法加载中...', mask: true });

  try {
    // 1. 确保已经获取了流 (但此时流只是存在内存里，没挂载到 DOM)
    if (!window.cameraStream) {
      await requestCameraPermission();
    }

    // 2. 开启 UI 渲染 (让 v-if 生成 video 标签)
    cameraEnabled.value = true;
    await nextTick(); // 必须等待 DOM 更新

    // 3. 获取刚刚生成的 Video 元素
    const videoEl = cameraVideo.value?.$el?.querySelector('video') || 
                    cameraVideo.value?.$el || 
                    document.querySelector('.camera-section video');

    if (!videoEl) throw new Error('找不到预览视频组件');

    // 4. 【关键：重新挂载流】
    // 必须在这里把之前拿到的 stream 重新赋值给新创建的 video 元素
    videoEl.srcObject = window.cameraStream;
    videoEl.muted = true;
    videoEl.setAttribute('playsinline', 'true');

    // 5. 等待视频元数据加载，否则 play() 会报错
    await new Promise((resolve) => {
      if (videoEl.readyState >= 2) {
        resolve();
      } else {
        videoEl.onloadedmetadata = () => resolve();
        // 设置 2 秒超时防止死锁
        setTimeout(resolve, 2000);
      }
    });

    // 6. 执行播放
    try {
      await videoEl.play();
    } catch (playErr) {
      console.warn("自动播放失败，尝试通过点击事件恢复:", playErr);
      // 这里的兜底逻辑保持
      document.body.addEventListener('click', () => videoEl.play(), { once: true });
    }

    // 7. 启动分析循环
    isMonitoring.value = true;
    startAnalysisLoop(videoEl);

  } catch (err) {
    console.error('监控启动失败:', err);
    cameraEnabled.value = false; // 失败了就切回占位状态
    uni.showModal({ title: '启动失败', content: err.message, showCancel: false });
  } finally {
    uni.hideLoading();
  }
};

/**
 * 抽离出的分析循环逻辑
 */
let isProcessing = false;
const startAnalysisLoop = (videoEl) => {
  if (analysisTimer) clearInterval(analysisTimer);

  analysisTimer = setInterval(async () => {
    // 状态检查
    if (!isMonitoring.value || videoEl.paused || videoEl.ended || isProcessing) {
      return;
    }
    
    isProcessing = true; // 加锁，防止上一帧没传完下一帧就开始了
    try {
      if (videoEl.videoWidth > 0) {
        await sendFrameToBackend(videoEl);
      }
    } catch (e) {
      console.error('循环执行出错:', e);
    } finally {
      isProcessing = false; // 释放锁
    }
  }, 200); // 建议设为 200ms (5FPS)，兼顾实时性与性能
};
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
  // 1. 基础校验：如果没有动作数据，直接尝试更新评分后退出
  if (!data || !data.action || !data.action.name) {
    if (data && data.score !== undefined) realtimeScore.value = Math.round(data.score);
    return;
  }

  // 2. 预处理
  const newActionName = data.action.name.trim();
  
  // 3. 过滤：如果是系统中间提示语，直接无视（不记录、不拦截）
  const ignoreList = ["分析中", "识别中", "未知", "动态调整", "姿态识别中"];
  const shouldIgnore = ignoreList.some(word => newActionName.includes(word));
  if (shouldIgnore) return;

  // 4. 【核心去重】：如果新动作名等于上一次记录的名，说明动作没变
  if (newActionName === lastLoggedAction.value) {
    // 动作没变时，我们只更新实时数值（评分、指标），但不去碰列表数组
    if (data.score !== undefined) realtimeScore.value = Math.round(data.score);
    if (data.posture_metrics) updateMetricsUI(data.posture_metrics);
    return; // 结束函数，不执行下面的 unshift
  }

  // 5. 执行到这里，说明【动作真的变了】
  console.log("动作状态变更:", lastLoggedAction.value, "->", newActionName);
  
  // 更新状态锁
  lastLoggedAction.value = newActionName;

  // 6. 向列表添加新记录
  recognizedActions.value.unshift({
    id: Date.now(), // 唯一ID
    time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    name: newActionName,
    confidence: Math.round((data.action.confidence || 0) * 100)
  });

  // 7. 维护列表长度和计数
  if (recognizedActions.value.length > 10) {
    recognizedActions.value.pop();
  }
  recognitionCount.value = recognizedActions.value.length;

  // 8. 更新其他实时数值
  if (data.score !== undefined) realtimeScore.value = Math.round(data.score);
  if (data.posture_metrics) updateMetricsUI(data.posture_metrics);
};
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
 * 发送当前视频帧到后端
 */
async function sendFrameToBackend(videoSource) {
  try {
    // 1. 获取原生 VIDEO 标签
    const videoEl = (videoSource instanceof HTMLVideoElement) 
      ? videoSource 
      : (videoSource?.$el?.querySelector('video') || document.querySelector('video'));

    if (!videoEl || videoEl.readyState < 2) return;

    // 2. 离屏绘制
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = videoEl.videoWidth;
    captureCanvas.height = videoEl.videoHeight;
    const tctx = captureCanvas.getContext('2d', { willReadFrequently: true });
    tctx.drawImage(videoEl, 0, 0, captureCanvas.width, captureCanvas.height);

    // 3. 转换为 Blob
    const blob = await new Promise(resolve => captureCanvas.toBlob(resolve, 'image/jpeg', 0.6));
    if (!blob) return;

    const form = new FormData();
    form.append('frame', blob, 'frame.jpg');

    // 4. 请求后端
    const resp = await fetch('http://127.0.0.1:5001/api/analyze_frame', { 
      method: 'POST', 
      body: form 
    });
    
    if (!resp.ok) throw new Error(`HTTP 错误: ${resp.status}`);
    const data = await resp.json();

    // --- 重点：数据分发 ---
    if (data && data.success) {
      // A. 调用你现有的 handleRealtimeData 处理评分和动作列表
      handleRealtimeData(data);
      
      // B. 更新侧边栏/底部的详细指标 (注意后端字段是 posture_metrics)
      if (data.posture_metrics) {
        updateMetricsUI(data.posture_metrics);
      }
      
      // C. 绘制骨架
      drawSkeletonOverlay(videoEl, data.keypoints);
    } else {
      clearSkeletonCanvas();
    }
  } catch (e) {
    console.error('监控循环出错:', e);
  }
}
/**
 * 辅助函数：更新 UI 指标
 */
function updateMetricsUI(metrics) {
  if (!metrics) return;
  keyMetrics.value[0].value = (metrics['姿态角度'] || metrics['angle'] || '0') + '°';
  keyMetrics.value[1].value = (metrics['速度'] || metrics['speed'] || '0') + ' m/s';
  keyMetrics.value[2].value = (metrics['精准度'] || metrics['accuracy'] || '0') + '%';
  keyMetrics.value[3].value = (metrics['力量指数'] || metrics['power'] || '0');
}

/**
 * 辅助函数：绘制骨架
 */
function drawSkeletonOverlay(video, keypoints) {
  // 1. 获取 Canvas 节点
  let canvas = cameraCanvas.value?.$el;
  if (canvas && canvas.tagName !== 'CANVAS') {
    canvas = canvas.querySelector('canvas');
  }
  if (!canvas) {
    canvas = document.querySelector('.camera-section canvas');
  }

  if (!canvas || !canvas.getContext) return;

  // 2. 这里的 ctx 只定义一次
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // 3. 同步尺寸
  if (canvas.width !== video.videoWidth) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }

  // 4. 清除上一帧
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  

  // 6. 执行原本的绘图逻辑
  if (keypoints) {
    drawKeypoints(ctx, keypoints, canvas.width, canvas.height);
  }
}
/**
 * 辅助函数：清空画布
 */
function clearSkeletonCanvas() {
  const canvas = cameraCanvas.value?.$el || cameraCanvas.value;
  if (canvas && typeof canvas.getContext === 'function') {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}
function drawKeypoints(ctx, keypoints, width, height) {
  if (!keypoints || !ctx || keypoints.length === 0) return;
  
  ctx.save();
  
  // 1. 定义连线关系 (MediaPipe/YOLO 标准 17 点位)
  const connections = [
    [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // 上半身
    [11, 12], [5, 11], [6, 12],              // 躯干
    [11, 13], [13, 15], [12, 14], [14, 16]   // 下半身
  ];

  // 2. 绘制连线
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)'; // 绿色连线
  ctx.lineWidth = 3;
  connections.forEach(([i, j]) => {
    const kp1 = keypoints[i];
    const kp2 = keypoints[j];
    if (kp1 && kp2 && kp1.confidence > 0.5 && kp2.confidence > 0.5) {
      ctx.beginPath();
      ctx.moveTo(kp1.x * (kp1.x <= 1 ? width : 1), kp1.y * (kp1.y <= 1 ? height : 1));
      ctx.lineTo(kp2.x * (kp2.x <= 1 ? width : 1), kp2.y * (kp2.y <= 1 ? height : 1));
      ctx.stroke();
    }
  });

  // 3. 绘制关键点
  ctx.fillStyle = '#3b82f6'; // 蓝色关节点
  ctx.strokeStyle = '#ffffff';
  keypoints.forEach(p => {
    if (p.confidence > 0.5) {
      let x = p.x * (p.x <= 1 ? width : 1);
      let y = p.y * (p.y <= 1 ? height : 1);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  });

  ctx.restore();
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
  min-height: 300px;
  background: #000000;
  margin-bottom: 24rpx;
  overflow: hidden;
}



video.camera-preview {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover; /* 关键：确保画面撑满容器 */
  z-index: 1;
}

canvas.camera-preview {
  position: absolute !important;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  z-index: 10; /* 确保在视频上方 */
  pointer-events: none; /* 穿透点击事件 */
  background: transparent !important;
  background-color: transparent !important; /* 必须是透明，否则会挡住视频 */
}

.skeleton-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: transparent;
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
