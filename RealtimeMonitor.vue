<!-- 实时训练监控页面 -->
<template>
  <AppLayout active-menu="实时训练监控">
    <!-- 页面标题 -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h2 class="text-3xl sm:text-4xl text-white font-bold">实时训练监控</h2>
        <p class="text-gray-400 text-sm sm:text-base">
          {{ isMonitoring ? '监控进行中...' : '准备开始监控' }}
        </p>
      </div>
      <div class="flex items-center space-x-3">
        <!-- 语音播报开关 -->
        <button
          @click="toggleVoiceBroadcast"
          :class="[
            'px-4 py-3 rounded-lg font-bold text-white flex items-center space-x-2 transition-all',
            voiceEnabled
              ? 'bg-blue-600 hover:bg-blue-500'
              : 'bg-gray-600 hover:bg-gray-500'
          ]"
          :title="voiceEnabled ? '关闭语音播报' : '开启语音播报'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.879l2.828-2.829m0 0l2.829-2.828m-2.829 2.828L5.586 9.222" v-if="!voiceEnabled" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.879l2.828-2.829" v-else />
          </svg>
          <span class="hidden sm:inline">{{ voiceEnabled ? '语音开' : '语音关' }}</span>
        </button>

        <!-- 监控开关 -->
        <button
          @click="toggleMonitoring"
          :class="[
            'px-6 py-3 rounded-lg font-bold text-white flex items-center space-x-2 transition-all',
            isMonitoring
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-green-600 hover:bg-green-500'
          ]"
        >
          <component :is="isMonitoring ? Square : Play" class="h-5 w-5" />
          <span>{{ isMonitoring ? '停止监控' : '开始监控' }}</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 左侧：视频预览和动作列表 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 实时视频预览 -->
        <div class="video-preview bg-gray-800/50 border border-gray-700/80 p-6 rounded-2xl backdrop-blur-md">
          <div class="aspect-video bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
            <!-- 摄像头未启动 -->
            <div
              v-if="!isMonitoring"
              class="absolute inset-0 flex flex-col items-center justify-center"
            >
              <Video class="h-20 w-20 text-gray-600 mb-4" />
              <p class="text-gray-500">点击"开始监控"启动实时训练监控</p>
            </div>

            <!-- 摄像头视频流 -->
            <video
              ref="videoElement"
              v-show="isMonitoring"
              class="w-full h-full object-cover"
              autoplay
              playsinline
            ></video>

            <!-- Canvas用于绘制骨架 -->
            <canvas
              ref="canvasElement"
              v-show="isMonitoring"
              class="absolute inset-0 w-full h-full"
            ></canvas>

            <!-- 监控覆盖层 -->
            <div v-if="isMonitoring" class="absolute inset-0 pointer-events-none">
              <!-- 录制指示器 -->
              <div class="absolute top-4 left-4 flex items-center space-x-2">
                <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span class="text-white text-sm font-bold">REC</span>
              </div>

              <!-- 时间显示 -->
              <div class="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded text-white font-mono">
                {{ monitoringTime }}
              </div>

              <!-- 错误提示 -->
              <div v-if="cameraError" class="absolute inset-0 flex items-center justify-center bg-black/50">
                <div class="bg-red-900/80 text-white px-6 py-4 rounded-lg">
                  <p class="font-bold mb-2">摄像头错误</p>
                  <p class="text-sm">{{ cameraError }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 关键点检测状态 -->
        <div class="keypoints-status bg-gray-800/50 border border-gray-700/80 p-6 rounded-2xl backdrop-blur-md">
          <h3 class="text-xl text-white mb-4 flex items-center">
            <Target class="h-6 w-6 mr-2 text-green-400" />
            关键点检测状态
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div
              v-for="keypoint in keypoints"
              :key="keypoint.name"
              :class="[
                'flex items-center space-x-2 p-3 rounded-lg transition-all',
                keypoint.detected && isMonitoring
                  ? 'bg-green-900/30 border border-green-600/50'
                  : 'bg-gray-900/50 border border-gray-700'
              ]"
            >
              <div :class="[
                'w-2 h-2 rounded-full',
                keypoint.detected && isMonitoring ? 'bg-green-500' : 'bg-gray-600'
              ]"></div>
              <span :class="[
                'text-sm',
                keypoint.detected && isMonitoring ? 'text-green-300' : 'text-gray-400'
              ]">
                {{ keypoint.name }}
              </span>
              <span 
                v-if="keypoint.detected && isMonitoring"
                class="ml-auto text-xs text-green-400 font-mono"
              >
                {{ keypoint.accuracy }}%
              </span>
            </div>
          </div>
        </div>

        <!-- 三维骨架实时预览（使用Three.js） -->
        <div class="skeleton-3d-preview bg-gray-800/50 border border-gray-700/80 p-6 rounded-2xl backdrop-blur-md">
          <h3 class="text-xl text-white mb-4">三维骨架预览</h3>
          <div class="w-full h-80">
            <Skeleton3D ref="skeletonRef" style="width:100%;height:100%;display:block;" />
          </div>
        </div>
      </div>

      <!-- 右侧：实时数据面板 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 当前动作信息 -->
        <div class="current-action bg-gray-800/50 border border-gray-700/80 p-6 rounded-2xl backdrop-blur-md">
          <h3 class="text-lg text-gray-400 mb-2">当前动作</h3>
          <div class="text-3xl font-bold text-white mb-4">{{ currentAction.name }}</div>
          
          <!-- 实时评分 -->
          <div class="mb-6">
            <div class="flex justify-between items-end mb-2">
              <span class="text-sm text-gray-400">实时评分</span>
              <span class="text-5xl font-bold text-cyan-400">{{ currentAction.score }}</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-3">
              <div 
                class="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                :style="{ width: currentAction.score + '%' }"
              ></div>
            </div>
          </div>
          
          <!-- 动作质量指示器 -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-400">动作质量</span>
              <span class="text-sm font-bold text-white">{{ getQualityLabel(currentAction.quality) }}</span>
            </div>
            <div class="flex space-x-1">
              <div 
                v-for="i in 5" 
                :key="i"
                :class="[
                  'flex-1 h-2 rounded',
                  i <= getQualityLevel(currentAction.quality) 
                    ? getQualityColor(currentAction.quality)
                    : 'bg-gray-700'
                ]"
              ></div>
            </div>
          </div>
        </div>

        <!-- 姿态准确度 -->
        <div class="posture-accuracy bg-gray-800/50 border border-gray-700/80 p-6 rounded-2xl backdrop-blur-md">
          <h3 class="text-lg text-gray-400 mb-4">姿态准确度</h3>
          <div class="space-y-3">
            <div v-for="metric in postureMetrics" :key="metric.name">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-400">{{ metric.name }}</span>
                <span class="text-white font-bold">{{ metric.value }}%</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                <div 
                  :class="[
                    'h-2 rounded-full transition-all duration-300',
                    metric.value >= 80 ? 'bg-green-500' :
                    metric.value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  ]"
                  :style="{ width: metric.value + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- (已移除) 动作分段评分历史表格：按用户要求保留三维实时演示，移除此表格显示 -->
        <!-- AI实时反馈 -->
        <div v-if="isMonitoring" class="ai-feedback bg-gray-800/50 border border-gray-700/80 p-6 rounded-2xl backdrop-blur-md">
          <h3 class="text-lg text-gray-400 mb-4 flex items-center">
            <svg class="h-5 w-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI实时反馈
          </h3>

          <!-- 检测状态 -->
          <div class="mb-4">
            <div class="flex items-center space-x-2 mb-2">
              <div :class="[
                'w-2 h-2 rounded-full',
                aiStatus.detecting ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
              ]"></div>
              <span class="text-sm text-gray-300">
                {{ aiStatus.detecting ? '正在分析姿态...' : '等待检测' }}
              </span>
            </div>

            <!-- 检测到的关键点数量 -->
            <div class="text-xs text-gray-400">
              检测到关键点: <span class="text-cyan-400 font-bold">{{ aiStatus.keypointsCount }}/17</span>
            </div>
          </div>

          <!-- 动作建议 -->
          <div v-if="actionFeedback" class="space-y-2">
            <div class="text-sm font-bold text-white mb-2">💡 动作建议</div>

            <!-- 根据评分给出建议 -->
            <div v-if="currentAction.score >= 85" class="p-3 bg-green-900/30 border border-green-600/50 rounded-lg">
              <div class="text-green-400 text-sm font-bold mb-1">✓ 姿态优秀</div>
              <div class="text-gray-300 text-xs">{{ actionFeedback.excellent }}</div>
            </div>

            <div v-else-if="currentAction.score >= 70" class="p-3 bg-blue-900/30 border border-blue-600/50 rounded-lg">
              <div class="text-blue-400 text-sm font-bold mb-1">↑ 可以改进</div>
              <div class="text-gray-300 text-xs">{{ actionFeedback.good }}</div>
            </div>

            <div v-else class="p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
              <div class="text-yellow-400 text-sm font-bold mb-1">⚠ 需要调整</div>
              <div class="text-gray-300 text-xs">{{ actionFeedback.needImprovement }}</div>
            </div>
          </div>

          <!-- 关键指标提示 -->
          <div class="mt-4 space-y-2">
            <div class="text-xs text-gray-400">重点关注:</div>
            <div class="grid grid-cols-2 gap-2">
              <div v-for="tip in keyTips" :key="tip.name" class="p-2 bg-gray-900/50 rounded border border-gray-700">
                <div class="text-xs text-gray-400">{{ tip.name }}</div>
                <div :class="[
                  'text-sm font-bold',
                  tip.value >= 80 ? 'text-green-400' :
                  tip.value >= 60 ? 'text-yellow-400' : 'text-red-400'
                ]">{{ tip.value }}%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 评分变化曲线 -->
        <div class="score-chart bg-gray-800/50 border border-gray-700/80 p-6 rounded-2xl backdrop-blur-md">
          <h3 class="text-lg text-gray-400 mb-4">评分变化</h3>
          <v-chart class="h-48" :option="scoreChartOption" autoresize />
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client'
import { gsap } from 'gsap';
import { Play, Square, Video, Target } from 'lucide-vue-next';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import AppLayout from '../components/AppLayout.vue';
import Skeleton3D from '../components/Skeleton3D.vue';
import { monitorData } from '../utils/mockData.js';
import voiceManager from '../utils/voiceManager.js';

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent]);

/**
 * 视频和Canvas元素引用
 */
const videoElement = ref(null);
const canvasElement = ref(null);
const skeletonRef = ref(null);
const mediaStream = ref(null);
const cameraError = ref(null);

/**
 * 监控状态
 */
const isMonitoring = ref(false);
const monitoringTime = ref('00:00');
const monitoringStartTime = ref(null);
const monitoringInterval = ref(null);
const dataUpdateInterval = ref(null);
const analysisInterval = ref(null);


/**
 * 当前动作数据
 */
const currentAction = ref({ ...monitorData.currentAction });

/**
 * 关键点数据
 */
const keypoints = ref([...monitorData.keypoints]);

/**
 * 姿态准确度数据
 */
const postureMetrics = ref([
  { name: '头部位置', value: 0 },
  { name: '肩部水平', value: 0 },
  { name: '手臂角度', value: 0 },
  { name: '腿部姿态', value: 0 },
  { name: '整体平衡', value: 0 }
]);

/**
 * 语音播报相关状态
 */
const voiceEnabled = ref(false); // 语音播报开关
const lastBroadcastTime = ref(0); // 上次播报时间
const lastBroadcastScore = ref(0); // 上次播报的分数
const lastBroadcastAction = ref(''); // 上次播报的动作
const BROADCAST_INTERVAL = 5000; // 播报间隔（毫秒）
const SCORE_CHANGE_THRESHOLD = 10; // 分数变化阈值

/**
 * AI状态信息
 */
const aiStatus = ref({
  detecting: false,
  keypointsCount: 0
});

// 动作分段数据（来自后端JSON）

const loading = ref(true)

// WebSocket 连接状态
const socketConnected = ref(false);
// 实时帧率
const framesPerSecond = ref(0);
// 用于帧率计算
let lastFrameTime = 0;
let frameCount = 0;
let fpsInterval = null;

// 最后接收到的WitMotion数据信息
const lastReceivedActionType = ref('');
const lastReceivedScore = ref(0);

let socket = null

/**
 * 动作反馈建议
 */
const actionFeedback = ref(null);

/**
 * 关键指标提示
 */
const keyTips = computed(() => {
  const tips = [];

  // 根据姿态指标生成提示
  postureMetrics.value.forEach(metric => {
    if (metric.value < 70) {
      tips.push({
        name: metric.name,
        value: metric.value
      });
    }
  });

  // 如果所有指标都不错，显示最重要的两个
  if (tips.length === 0) {
    tips.push(
      { name: '手臂角度', value: postureMetrics.value[2]?.value || 0 },
      { name: '腿部姿态', value: postureMetrics.value[3]?.value || 0 }
    );
  }

  // 最多显示4个
  return tips.slice(0, 4);
});

/**
 * 评分历史数据
 */
const scoreHistory = ref([]);
const timeLabels = ref([]);

/**
 * 评分图表配置
 */
const scoreChartOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    formatter: '{b}<br/>评分: {c}'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '5%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: timeLabels.value,
    boundaryGap: false,
    axisLine: { lineStyle: { color: '#888' } },
    axisLabel: { show: false }
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 100,
    axisLine: { lineStyle: { color: '#888' } },
    splitLine: { lineStyle: { color: '#444' } }
  },
  series: [{
    data: scoreHistory.value,
    type: 'line',
    smooth: true,
    symbol: 'none',
    lineStyle: { color: '#22d3ee', width: 2 },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(34, 211, 238, 0.3)' },
          { offset: 1, color: 'rgba(34, 211, 238, 0.05)' }
        ]
      }
    }
  }]
}));

/**
 * 切换监控状态
 */
function toggleMonitoring() {
  if (isMonitoring.value) {
    stopMonitoring();
  } else {
    startMonitoring();
  }
}

/**
 * 开始监控
 */
async function startMonitoring() {
  cameraError.value = null;

  try {
    // 请求摄像头权限
    mediaStream.value = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    });

    // 设置视频流
    if (videoElement.value) {
      videoElement.value.srcObject = mediaStream.value;
    }

    isMonitoring.value = true;
    monitoringStartTime.value = Date.now();

    // 重置数据
    scoreHistory.value = [];
    timeLabels.value = [];
    currentAction.value.score = 0;
    currentAction.value.quality = 0;

    // 更新监控时间
    monitoringInterval.value = setInterval(updateMonitoringTime, 1000);

    // 更新评分曲线数据（每1秒更新一次图表）
    dataUpdateInterval.value = setInterval(updateMonitoringData, 1000);

    // 启动视频帧分析（每500ms分析一次，避免过载后端）
    analysisInterval.value = setInterval(analyzeFrame, 500);

    // 建立 socket.io 连接，实时接收 frame 推送并立即渲染
    try {
      const url = 'http://127.0.0.1:5001'
      socket = io(url, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      })
      socket.on('connect', () => {
        console.log('socket connected', socket.id);
        socketConnected.value = true;
        lastFrameTime = Date.now(); // 重置帧率计算时间
        frameCount = 0;
        framesPerSecond.value = 0;
        // 启动帧率更新定时器
        fpsInterval = setInterval(() => {
          if (frameCount > 0) {
            const currentTime = Date.now();
            const elapsedSeconds = (currentTime - lastFrameTime) / 1000;
            if (elapsedSeconds > 0) {
              framesPerSecond.value = Math.round(frameCount / elapsedSeconds);
            }
            frameCount = 0;
            lastFrameTime = currentTime;
          }
        }, 1000); // 每秒更新一次帧率
      })
      socket.on('disconnect', (reason) => {
        console.warn('socket disconnected, reason:', reason);
        socketConnected.value = false;
        framesPerSecond.value = 0;
        if (fpsInterval) {
          clearInterval(fpsInterval);
          fpsInterval = null;
        }
        lastReceivedActionType.value = '';
        lastReceivedScore.value = 0;
        
        // 如果是意外断开，尝试自动重连
        if (reason === 'io server disconnect' || reason === 'transport close') {
          console.log('尝试自动重连...');
          socket.connect();
        }
      })
      socket.on('connect_error', (err) => {
        console.warn('socket connect_error', err);
        // 连接错误时显示用户友好的提示
        cameraError.value = '实时数据连接失败，请检查后端服务是否正常运行';
      })
      socket.on('reconnect', (attemptNumber) => {
        console.log('socket reconnected after', attemptNumber, 'attempts');
        socketConnected.value = true;
        cameraError.value = null;
      })
      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('尝试重连，第', attemptNumber, '次');
      })
      socket.on('reconnect_error', (err) => {
        console.warn('socket reconnect_error', err);
      })
      socket.on('frame', (f) => {
        try {
          frameCount++; // 统计帧数
          console.log('socket frame received:', f); // 添加这行日志来检查完整的帧数据
          // console.log('socket frame received time=', f?.time)
          if (skeletonRef.value && skeletonRef.value.renderFrame) {
            skeletonRef.value.renderFrame(f);
            // 更新最后接收到的 WitMotion 数据信息
            if (f.action_type) {
                lastReceivedActionType.value = f.action_type;
            }
            if (f.score) {
                lastReceivedScore.value = Math.round(f.score);
            }
          } else {
            console.warn('skeletonRef not ready when frame received')
          }
        } catch (err) {
          console.warn('renderFrame (socket) error', err)
        }
      })
      socket.on('calibrate_ack', (d) => console.log('calibrate ack', d))
    } catch (e) {
      console.error('socket init failed:', e)
      cameraError.value = '无法连接到实时数据服务: ' + e.message;
    }

  } catch (error) {
    console.error('无法访问摄像头:', error);
    cameraError.value = error.name === 'NotAllowedError'
      ? '摄像头访问被拒绝，请检查浏览器权限设置'
      : '无法访问摄像头: ' + error.message;
    isMonitoring.value = false;
  }
}

/**
 * 停止监控
 */
function stopMonitoring() {
  isMonitoring.value = false;
  cameraError.value = null;

  // 停止摄像头
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop());
    mediaStream.value = null;
  }

  if (videoElement.value) {
    videoElement.value.srcObject = null;
  }

  if (monitoringInterval.value) {
    clearInterval(monitoringInterval.value);
    monitoringInterval.value = null;
  }

  if (dataUpdateInterval.value) {
    clearInterval(dataUpdateInterval.value);
    dataUpdateInterval.value = null;
  }

  if (analysisInterval.value) {
    clearInterval(analysisInterval.value);
    analysisInterval.value = null;
  }

  // 断开 socket 连接
  try {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  } catch (e) {
    console.warn('socket disconnect error', e)
  }

  // 停止帧率更新定时器
  if (fpsInterval) {
    clearInterval(fpsInterval);
    fpsInterval = null;
  }
  framesPerSecond.value = 0;
  socketConnected.value = false;

  // 清空画布
  if (canvasElement.value) {
    const ctx = canvasElement.value.getContext('2d');
    ctx.clearRect(0, 0, canvasElement.value.width, canvasElement.value.height);
  }

  // 重置关键点状态
  keypoints.value.forEach(kp => {
    kp.accuracy = 0;
  });

  // 重置姿态数据
  postureMetrics.value.forEach(pm => {
    pm.value = 0;
  });

  // 停止语音播报
  voiceManager.stop();

  // 重置语音播报状态
  lastBroadcastTime.value = 0;
  lastBroadcastScore.value = 0;
  lastBroadcastAction.value = '';

  // 重置 WitMotion 数据信息
  lastReceivedActionType.value = '';
  lastReceivedScore.value = 0;
}

/**
 * 更新监控时间
 */
function updateMonitoringTime() {
  const elapsed = Math.floor((Date.now() - monitoringStartTime.value) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  monitoringTime.value = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * 分析视频帧
 */
async function analyzeFrame() {
  if (!videoElement.value || !canvasElement.value) return;

  const video = videoElement.value;
  const canvas = canvasElement.value;
  const ctx = canvas.getContext('2d');

  // 调整canvas尺寸
  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 将视频帧发送到后端进行AI分析
  await sendFrameToBackend(video, canvas, ctx);
}

/**
 * 将视频帧发送到后端进行AI分析
 */
async function sendFrameToBackend(video, canvas, ctx) {
  try {
    // 创建临时canvas来捕获视频帧
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');

    // 绘制当前视频帧到临时canvas
    tempCtx.drawImage(video, 0, 0);

    // 将canvas转换为Blob
    const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/jpeg', 0.8));

    // 创建FormData
    const formData = new FormData();
    formData.append('frame', blob, 'frame.jpg');

    // 发送到后端API
    const response = await fetch('http://127.0.0.1:5001/analyze_frame', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      console.error('后端分析失败:', response.statusText);
      return;
    }

    const result = await response.json();

    if (result.success) {
      // 更新AI检测状态
      aiStatus.value.detecting = true;
      aiStatus.value.keypointsCount = result.keypoints?.filter(kp => kp.detected).length || 0;

      // 更新当前动作信息 - 使用平滑过渡
      currentAction.value.name = result.action_type || '未知动作';

      // 评分平滑过渡：新值权重30%，旧值权重70%
      const newScore = Math.round(result.score);
      currentAction.value.score = Math.round(currentAction.value.score * 0.7 + newScore * 0.3);
      currentAction.value.quality = currentAction.value.score;

      // 绘制骨架关键点
      drawSkeletonFromKeypoints(ctx, result.keypoints, canvas.width, canvas.height);

      // 更新关键点检测状态
      updateKeypointsStatus(result.keypoints);

      // 更新姿态指标（如果后端返回）
      if (result.posture_metrics) {
        updatePostureMetrics(result.posture_metrics);
      }

      // 更新动作反馈
      updateActionFeedback(result.action_type, currentAction.value.score, result.posture_metrics);
    } else {
      console.warn('未检测到人体或关键点');
      aiStatus.value.detecting = false;
      aiStatus.value.keypointsCount = 0;
      // 显示提示信息
      drawNoPersonDetected(ctx, canvas.width, canvas.height);
    }

  } catch (error) {
    console.error('发送帧到后端时出错:', error);
    // 如果后端连接失败，使用模拟数据
    drawSkeletonOverlay(ctx, canvas.width, canvas.height);
  }
}

/**
 * 绘制骨架覆盖层（模拟数据，用于后端连接失败时）
 */
function drawSkeletonOverlay(ctx, width, height) {
  // 模拟骨架关键点位置（将来替换为实际检测结果）
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.strokeStyle = '#3b82f6';
  ctx.fillStyle = '#3b82f6';
  ctx.lineWidth = 3;

  // 绘制简单的骨架（示例）
  const scale = Math.min(width, height) / 400;

  // 头部
  ctx.beginPath();
  ctx.arc(centerX, centerY - 60 * scale, 15 * scale, 0, Math.PI * 2);
  ctx.fill();

  // 躯干
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 45 * scale);
  ctx.lineTo(centerX, centerY + 30 * scale);
  ctx.stroke();

  // 左臂
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 30 * scale);
  ctx.lineTo(centerX - 40 * scale, centerY);
  ctx.stroke();

  // 右臂
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 30 * scale);
  ctx.lineTo(centerX + 40 * scale, centerY);
  ctx.stroke();

  // 左腿
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + 30 * scale);
  ctx.lineTo(centerX - 25 * scale, centerY + 90 * scale);
  ctx.stroke();

  // 右腿
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + 30 * scale);
  ctx.lineTo(centerX + 25 * scale, centerY + 90 * scale);
  ctx.stroke();
}

/**
 * 根据后端返回的关键点绘制骨架
 */
function drawSkeletonFromKeypoints(ctx, keypoints, width, height) {
  if (!keypoints || keypoints.length === 0) return;

  // YOLO姿态估计的17个关键点连接关系
  const skeleton = [
    { pair: [0, 1], color: '#a855f7' },    // 头部 - 紫色
    { pair: [0, 2], color: '#a855f7' },
    { pair: [1, 3], color: '#a855f7' },
    { pair: [2, 4], color: '#a855f7' },
    { pair: [5, 6], color: '#22d3ee' },    // 肩膀 - 青色
    { pair: [5, 7], color: '#10b981' },    // 左臂 - 绿色
    { pair: [7, 9], color: '#10b981' },
    { pair: [6, 8], color: '#f59e0b' },    // 右臂 - 橙色（持剑手）
    { pair: [8, 10], color: '#f59e0b' },
    { pair: [5, 11], color: '#22d3ee' },   // 躯干 - 青色
    { pair: [6, 12], color: '#22d3ee' },
    { pair: [11, 12], color: '#22d3ee' },  // 髋部 - 青色
    { pair: [11, 13], color: '#3b82f6' },  // 左腿 - 蓝色
    { pair: [13, 15], color: '#3b82f6' },
    { pair: [12, 14], color: '#ef4444' },  // 右腿 - 红色（前腿）
    { pair: [14, 16], color: '#ef4444' }
  ];

  // 绘制骨架连接线（带渐变效果）
  skeleton.forEach(({ pair: [startIdx, endIdx], color }) => {
    const start = keypoints[startIdx];
    const end = keypoints[endIdx];

    if (start && end && start.detected && end.detected) {
      // 根据置信度调整透明度
      const avgConfidence = (start.confidence + end.confidence) / 2;
      const alpha = Math.max(0.5, avgConfidence);

      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.globalAlpha = alpha;

      // 添加阴影效果
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      // 重置阴影
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  });

  // 绘制关键点
  keypoints.forEach((point, index) => {
    if (point.detected) {
      // 根据关键点类型使用不同颜色
      let pointColor = '#3b82f6';
      if (index === 0) pointColor = '#a855f7';  // 头部 - 紫色
      else if (index >= 5 && index <= 6) pointColor = '#22d3ee';  // 肩膀 - 青色
      else if ([7, 9].includes(index)) pointColor = '#10b981';  // 左臂 - 绿色
      else if ([8, 10].includes(index)) pointColor = '#f59e0b';  // 右臂 - 橙色
      else if (index >= 11 && index <= 12) pointColor = '#22d3ee';  // 髋部 - 青色
      else if ([13, 15].includes(index)) pointColor = '#3b82f6';  // 左腿 - 蓝色
      else if ([14, 16].includes(index)) pointColor = '#ef4444';  // 右腿 - 红色

      // 绘制关键点外圈（发光效果）
      ctx.fillStyle = pointColor;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
      ctx.fill();

      // 绘制关键点内圈
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // 高置信度的关键点用边框标记
      if (point.confidence > 0.8) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  });

  // 重置全局透明度
  ctx.globalAlpha = 1;
}

/**
 * 未检测到人体时显示提示
 */
function drawNoPersonDetected(ctx, width, height) {
  ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('未检测到人体，请调整位置', width / 2, height / 2);
}

/**
 * 更新关键点检测状态
 */
function updateKeypointsStatus(detectedKeypoints) {
  if (!detectedKeypoints || detectedKeypoints.length === 0) return;

  // 映射后端关键点到前端显示
  const keypointMapping = {
    '鼻子': 0, '左眼': 1, '右眼': 2, '左耳': 3, '右耳': 4,
    '左肩': 5, '右肩': 6, '左肘': 7, '右肘': 8,
    '左手腕': 9, '右手腕': 10, '左髋': 11, '右髋': 12,
    '左膝': 13, '右膝': 14, '左脚踝': 15, '右脚踝': 16
  };

  keypoints.value.forEach(kp => {
    const idx = keypointMapping[kp.name];
    if (idx !== undefined && detectedKeypoints[idx]) {
      kp.detected = detectedKeypoints[idx].detected;

      // 关键点置信度也使用平滑过渡
      const newAccuracy = Math.round(detectedKeypoints[idx].confidence * 100);
      if (kp.accuracy === 0) {
        // 首次检测，直接设置
        kp.accuracy = newAccuracy;
      } else {
        // 平滑过渡：新值权重30%，旧值权重70%
        kp.accuracy = Math.round(kp.accuracy * 0.7 + newAccuracy * 0.3);
      }
    }
  });
}

/**
 * 更新姿态准确度指标
 */
function updatePostureMetrics(metrics) {
  if (!metrics) return;

  // 更新姿态准确度数据 - 使用更强的平滑过渡
  postureMetrics.value.forEach(pm => {
    if (metrics[pm.name] !== undefined) {
      // 使用更平滑的过渡，避免数值跳跃
      // 新值权重20%，旧值权重80% - 变化更缓慢
      const newValue = metrics[pm.name];
      pm.value = Math.round(pm.value * 0.8 + newValue * 0.2);
    }
  });
}

/**
 * 更新动作反馈建议（包含语音播报）
 */
function updateActionFeedback(actionType, score, metrics) {
  // 触发智能语音播报
  if (voiceEnabled.value) {
    broadcastAnalysisResult(score, actionType, metrics);
  }

  const feedbackMap = {
    '🗡️ 进攻直刺': {
      excellent: '完美的进攻姿态！手臂伸展充分，弓步深度合适，保持这个标准。',
      good: '进攻姿态不错，可以尝试加大手臂伸展角度，前腿再深蹲一些。',
      needImprovement: '注意手臂要完全伸直，前膝弯曲角度在90-120度之间，重心前移。'
    },
    '🏹 弓步姿态': {
      excellent: '标准的弓步！前腿弯曲角度完美，后腿伸直有力。',
      good: '弓步姿态良好，注意后腿要尽量伸直，保持身体稳定。',
      needImprovement: '前膝弯曲不足或过度，标准角度应在90-120度，后腿要伸直。'
    },
    '🎯 准备出击': {
      excellent: '出击准备充分！手臂已伸展，继续前移完成进攻。',
      good: '准备出击姿态可以，配合弓步会更有力量。',
      needImprovement: '手臂伸展不够充分，或者重心未前移，需要协调配合。'
    },
    '⚡ 准备姿势': {
      excellent: '标准的准备姿势！身体平衡，重心稳定。',
      good: '准备姿势基本正确，注意保持肩膀水平，身体直立。',
      needImprovement: '注意身体平衡，保持直立，双脚距离适当。'
    },
    '⚔️ 格挡姿势': {
      excellent: '格挡位置准确！手臂高度合适。',
      good: '格挡姿势可以，注意手腕位置要高于肩膀。',
      needImprovement: '手臂抬起高度不够，格挡时手腕应高于肩膀至少30cm。'
    },
    '🛡️ 防守后撤': {
      excellent: '后撤动作流畅！重心转移及时。',
      good: '防守意识良好，可以加大重心后移幅度。',
      needImprovement: '重心后移不够明显，防守时身体要明显后倾。'
    }
  };

  // 获取当前动作的反馈
  const feedback = feedbackMap[actionType] || feedbackMap['⚡ 准备姿势'];

  // 根据姿态指标补充建议
  let additionalTips = '';
  if (metrics) {
    if (metrics['手臂角度'] < 70) {
      additionalTips += ' 手臂需要更多伸展。';
    }
    if (metrics['腿部姿态'] < 70) {
      additionalTips += ' 注意前腿弯曲角度。';
    }
    if (metrics['肩部水平'] < 70) {
      additionalTips += ' 保持肩膀水平。';
    }
  }

  actionFeedback.value = {
    excellent: feedback.excellent + additionalTips,
    good: feedback.good + additionalTips,
    needImprovement: feedback.needImprovement + additionalTips
  };
}

/**
 * 更新监控数据（用于评分曲线）
 */
function updateMonitoringData() {
  // 将当前评分添加到历史记录（已经是平滑过的值）
  scoreHistory.value.push(currentAction.value.score);
  const elapsed = Math.floor((Date.now() - monitoringStartTime.value) / 1000);
  timeLabels.value.push(`${elapsed}s`);

  // 保持最近30个数据点
  if (scoreHistory.value.length > 30) {
    scoreHistory.value.shift();
    timeLabels.value.shift();
  }
}

/**
 * 获取质量等级
 */
function getQualityLevel(quality) {
  if (quality >= 90) return 5;
  if (quality >= 80) return 4;
  if (quality >= 70) return 3;
  if (quality >= 60) return 2;
  return 1;
}

/**
 * 获取质量标签
 */
function getQualityLabel(quality) {
  if (quality >= 90) return '优秀';
  if (quality >= 80) return '良好';
  if (quality >= 70) return '中等';
  if (quality >= 60) return '及格';
  return '需改进';
}

/**
 * 获取质量颜色
 */
function getQualityColor(quality) {
  if (quality >= 90) return 'bg-green-500';
  if (quality >= 80) return 'bg-blue-500';
  if (quality >= 70) return 'bg-yellow-500';
  if (quality >= 60) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * 切换语音播报
 */
function toggleVoiceBroadcast() {
  voiceEnabled.value = !voiceEnabled.value;

  if (voiceEnabled.value) {
    console.log('✅ 语音播报已开启');
    // 测试语音播报
    voiceManager.speak('语音播报已开启，系统将自动播报训练反馈');
  } else {
    console.log('❌ 语音播报已关闭');
    // 停止当前播报
    voiceManager.stop();
  }
}

/**
 * 语音播报文本（使用统一的voiceManager）
 * @param {string} text - 要播报的文本
 * @param {boolean} force - 是否强制播报（忽略间隔限制）
 */
function speakText(text, force = false) {
  if (!voiceEnabled.value) return;

  // 检查播报间隔（除非强制播报）
  const now = Date.now();
  if (!force && now - lastBroadcastTime.value < BROADCAST_INTERVAL) {
    console.log('⏱️ 播报间隔未到，跳过');
    return;
  }

  // 使用统一的语音管理器播报
  voiceManager.speak(text);
  lastBroadcastTime.value = now;
}

/**
 * 智能播报分析结果
 * @param {number} score - 当前评分
 * @param {string} actionType - 动作类型
 * @param {object} metrics - 姿态指标
 */
function broadcastAnalysisResult(score, actionType, metrics) {
  if (!voiceEnabled.value) return;

  const now = Date.now();
  const scoreChanged = Math.abs(score - lastBroadcastScore.value) >= SCORE_CHANGE_THRESHOLD;
  const actionChanged = actionType !== lastBroadcastAction.value;
  const timeElapsed = now - lastBroadcastTime.value >= BROADCAST_INTERVAL;

  // 判断是否需要播报
  if (!timeElapsed && !scoreChanged && !actionChanged) {
    return;
  }

  // 构建播报内容
  let broadcastText = '';

  // 1. 动作识别播报
  if (actionChanged && actionType && actionType !== '未知动作') {
    broadcastText += `检测到${actionType}。`;
    lastBroadcastAction.value = actionType;
  }

  // 2. 评分播报
  if (scoreChanged || (timeElapsed && score > 0)) {
    const qualityLabel = getQualityLabel(score);
    broadcastText += `当前评分${score}分，${qualityLabel}。`;
    lastBroadcastScore.value = score;
  }

  // 3. 关键反馈播报（选择最需要改进的指标）
  if (metrics && timeElapsed) {
    const lowMetrics = [];

    if (metrics['头部位置'] !== undefined && metrics['头部位置'] < 70) {
      lowMetrics.push('注意头部位置');
    }
    if (metrics['肩部水平'] !== undefined && metrics['肩部水平'] < 70) {
      lowMetrics.push('保持肩部水平');
    }
    if (metrics['手臂角度'] !== undefined && metrics['手臂角度'] < 70) {
      lowMetrics.push('调整手臂角度');
    }
    if (metrics['腿部姿态'] !== undefined && metrics['腿部姿态'] < 70) {
      lowMetrics.push('改善腿部姿态');
    }

    if (lowMetrics.length > 0) {
      broadcastText += lowMetrics.slice(0, 2).join('，') + '。';
    } else if (score >= 80) {
      broadcastText += '姿态良好，继续保持。';
    }
  }

  // 播报
  if (broadcastText) {
    speakText(broadcastText);
  }
}

/**
 * 页面加载动画和语音初始化
 */
onMounted(() => {
  gsap.from('.video-preview, .keypoints-status', {
    duration: 0.6,
    opacity: 0,
    y: 30,
    stagger: 0.1
  });

  gsap.from('.current-action, .posture-accuracy, .score-chart', {
    duration: 0.8,
    opacity: 0,
    x: 50,
    stagger: 0.15,
    delay: 0.3
  });

  // voiceManager 已自动初始化语音
  // 无需手动初始化


});

/**
 * 清理定时器和资源
 */
onUnmounted(() => {
  // 停止所有定时器
  if (monitoringInterval.value) {
    clearInterval(monitoringInterval.value);
  }
  if (dataUpdateInterval.value) {
    clearInterval(dataUpdateInterval.value);
  }
  if (analysisInterval.value) {
    clearInterval(analysisInterval.value);
  }

  // 停止帧率更新定时器
  if (fpsInterval) {
    clearInterval(fpsInterval);
    fpsInterval = null;
  }

  // 释放摄像头资源
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop());
  }

  // 断开 socket 连接
  try {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  } catch (e) {
    console.warn('socket disconnect error', e)
  }

  // 停止语音播报
  voiceManager.stop();
});
</script>

