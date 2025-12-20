<template>
  <view class="page-index app-background">
    <!-- 顶部欢迎区 -->
    <view class="welcome-section">
      <view class="welcome-header">
        <view class="welcome-info">
          <text class="welcome-greeting">你好，{{ userName }}</text>
          <text class="welcome-subtitle">继续您的剑术训练之旅</text>
        </view>
        <view class="welcome-avatar" @tap="goToProfile">
          <image :src="userAvatar" mode="aspectFill"></image>
        </view>
      </view>

      <!-- 每日励志语录 -->
      <view class="motivation-card">
        <view class="motivation-icon-wrapper">
          <view class="icon-sparkles"></view>
        </view>
        <text class="motivation-text">{{ dailyMotivation }}</text>
      </view>
    </view>

    <!-- 快速操作 -->
    <view class="quick-actions">
      <text class="section-title">快速开始</text>
      <view class="quick-grid">
        <view
          v-for="action in quickActions"
          :key="action.id"
          class="quick-item"
          :style="{ background: action.gradient }"
          @tap="handleQuickAction(action)"
        >
          <view class="quick-icon" :class="action.iconClass"></view>
          <text class="quick-label">{{ action.label }}</text>
        </view>
      </view>
    </view>

    <!-- 训练统计概览 -->
    <view class="stats-section">
      <view class="section-header">
        <text class="section-title">训练数据</text>
        <text class="section-more" @tap="goToAnalysis">查看更多 ></text>
      </view>

      <view class="stats-grid">
        <se-stat-card
          v-for="stat in trainingStats"
          :key="stat.id"
          :icon="stat.icon"
          :value="stat.value"
          :label="stat.label"
          :type="stat.type"
          :trend="stat.trend"
          :trend-value="stat.trendValue"
          @click="handleStatClick(stat)"
        />
      </view>
    </view>

    <!-- 最近训练记录 -->
    <view class="recent-section">
      <view class="section-header">
        <text class="section-title">最近训练</text>
        <text class="section-more" @tap="goToAnalysis">全部记录 ></text>
      </view>

      <view class="recent-list">
        <se-card
          v-for="record in recentRecords"
          :key="record.id"
          :hover="true"
          padding="24rpx"
          class="recent-item"
          @click="viewRecordDetail(record)"
        >
          <view class="recent-content">
            <view class="recent-left">
              <view class="recent-type">{{ record.type }}</view>
              <view class="recent-date">{{ record.date }}</view>
            </view>
            <view class="recent-center">
              <view class="recent-score-ring" :style="getScoreRingStyle(record.score)">
                <text class="recent-score-value">{{ record.score }}</text>
              </view>
            </view>
            <view class="recent-right">
              <view class="recent-duration">{{ record.duration }}</view>
              <view class="recent-status" :class="`status-${record.status}`">
                {{ record.statusText }}
              </view>
            </view>
          </view>
        </se-card>

        <!-- 空状态 -->
        <view v-if="recentRecords.length === 0" class="empty-state">
          <view class="empty-icon icon-chart-line"></view>
          <text class="empty-text">暂无训练记录</text>
          <se-button type="primary" text="开始训练" @click="startTraining" />
        </view>
      </view>
    </view>

    <!-- 推荐训练计划 -->
    <view class="recommend-section">
      <view class="section-header">
        <text class="section-title">推荐计划</text>
        <text class="section-more" @tap="goToPlans">更多计划 ></text>
      </view>

      <scroll-view scroll-x class="recommend-scroll">
        <view class="recommend-list">
          <se-card
            v-for="plan in recommendPlans"
            :key="plan.id"
            :hover="true"
            variant="gradient"
            class="recommend-item"
            @click="viewPlanDetail(plan)"
          >
            <view class="plan-badge" :class="`badge-${plan.badgeType}`">{{ plan.badge }}</view>
            <view class="plan-title">{{ plan.title }}</view>
            <view class="plan-desc">{{ plan.description }}</view>
            <view class="plan-footer">
              <text class="plan-duration">{{ plan.duration }}</text>
              <text class="plan-difficulty">{{ plan.difficulty }}</text>
            </view>
          </se-card>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { trainingAPI } from '@/utils/api.js'
import { getCircleProgressStyle } from '@/utils/common.js'
import SeCard from '@/components/se-card/se-card.vue'
import SeStatCard from '@/components/se-stat-card/se-stat-card.vue'
import SeButton from '@/components/se-button/se-button.vue'

// 用户信息
const userName = ref('剑客')
const userAvatar = ref('/static/images/avatar-default.png')

// 每日励志语录
const dailyMotivation = ref('千锤百炼，铸就不凡。今天也要全力以赴！')

// 快速操作
const quickActions = ref([
  {
    id: 1,
    iconClass: 'icon-video',
    label: '视频分析',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // 主色调渐变
    action: 'analysis'
  },
  {
    id: 2,
    iconClass: 'icon-monitor',
    label: '实时监控',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // 成功色渐变
    action: 'monitor'
  },
  {
    id: 3,
    iconClass: 'icon-clipboard',
    label: '训练计划',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // 警告色渐变
    action: 'plans'
  },
  {
    id: 4,
    iconClass: 'icon-target',
    label: '技能提升',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', // 危险色渐变
    action: 'skills'
  }
])

// 训练统计
const trainingStats = ref([
  {
    id: 1,
    icon: 'trophy',
    value: '89',
    label: '综合评分',
    type: 'success',
    trend: 'up',
    trendValue: '+5'
  },
  {
    id: 2,
    icon: 'fire',
    value: '12',
    label: '连续训练',
    type: 'warning',
    trend: null,
    trendValue: ''
  },
  {
    id: 3,
    icon: 'clock',
    value: '45h',
    label: '累计时长',
    type: 'primary',
    trend: 'up',
    trendValue: '+8h'
  },
  {
    id: 4,
    icon: 'chart',
    value: '156',
    label: '训练次数',
    type: 'info',
    trend: 'up',
    trendValue: '+12'
  }
])

// 最近训练记录
const recentRecords = ref([
  {
    id: 1,
    type: '击剑训练',
    date: '2025-12-17 14:30',
    score: 92,
    duration: '45分钟',
    status: 'excellent',
    statusText: '优秀'
  },
  {
    id: 2,
    type: '步法练习',
    date: '2025-12-16 10:15',
    score: 85,
    duration: '30分钟',
    status: 'good',
    statusText: '良好'
  },
  {
    id: 3,
    type: '姿态矫正',
    date: '2025-12-15 16:00',
    score: 78,
    duration: '25分钟',
    status: 'normal',
    statusText: '一般'
  }
])

// 推荐训练计划
const recommendPlans = ref([
  {
    id: 1,
    badge: '热门',
    badgeType: 'hot',
    title: '基础击剑入门',
    description: '适合初学者的系统训练计划',
    duration: '4周',
    difficulty: '初级'
  },
  {
    id: 2,
    badge: '推荐',
    badgeType: 'recommend',
    title: '进阶步法训练',
    description: '提升移动速度和灵活性',
    duration: '6周',
    difficulty: '中级'
  },
  {
    id: 3,
    badge: '精选',
    badgeType: 'premium',
    title: '实战技巧强化',
    description: '提高实战应用能力',
    duration: '8周',
    difficulty: '高级'
  }
])

// 页面加载
onMounted(() => {
  loadUserInfo()
  loadTrainingData()
})

// 加载用户信息
const loadUserInfo = () => {
  const userInfo = uni.getStorageSync('userInfo')
  if (userInfo) {
    userName.value = userInfo.name || '剑客'
    // 优先使用本地存储的头像，否则使用默认头像
    userAvatar.value = userInfo.avatar || '/static/images/avatar-default.png'
  }
}

// 加载训练数据
const loadTrainingData = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    
    // 获取训练统计
    const stats = await trainingAPI.getTrainingStats({}, { showLoading: false })
    if (stats) {
      // 更新统计数据
      console.log('训练统计:', stats)
    }

    // 获取最近训练记录
    const records = await trainingAPI.getTrainingList({ limit: 3 }, { showLoading: false })
    if (records && records.length > 0) {
      recentRecords.value = records
    }
  } catch (error) {
    console.error('加载训练数据失败:', error)
    
    // 使用模拟数据作为备用
    console.log('使用模拟数据')
    
    // 模拟训练统计数据
    trainingStats.value = [
      { id: 1, icon: 'trophy', value: '89', label: '综合评分', type: 'success', trend: 'up', trendValue: '+5' },
      { id: 2, icon: 'fire', value: '12', label: '连续训练', type: 'warning', trend: null, trendValue: '' },
      { id: 3, icon: 'clock', value: '45h', label: '累计时长', type: 'primary', trend: 'up', trendValue: '+8h' },
      { id: 4, icon: 'chart', value: '156', label: '训练次数', type: 'info', trend: 'up', trendValue: '+12' }
    ]
    
    // 模拟最近训练记录
    recentRecords.value = [
      { id: 1, type: '击剑训练', date: '2025-12-17 14:30', score: 92, duration: '45分钟', status: 'excellent', statusText: '优秀' },
      { id: 2, type: '步法练习', date: '2025-12-16 10:15', score: 85, duration: '30分钟', status: 'good', statusText: '良好' },
      { id: 3, type: '姿态矫正', date: '2025-12-15 16:00', score: 78, duration: '25分钟', status: 'normal', statusText: '一般' }
    ]
  } finally {
    uni.hideLoading()
  }
}

// 快速操作点击
const handleQuickAction = (action) => {
  switch (action.action) {
    case 'analysis':
      uni.switchTab({ url: '/pages/analysis/analysis' })
      break
    case 'monitor':
      uni.switchTab({ url: '/pages/monitor/monitor' })
      break
    case 'plans':
      uni.switchTab({ url: '/pages/plans/plans' })
      break
    case 'skills':
      uni.showToast({ title: '功能开发中', icon: 'none' })
      break
  }
}

// 统计卡片点击
const handleStatClick = (stat) => {
  console.log('查看统计详情:', stat)
  uni.switchTab({ url: '/pages/analysis/analysis' })
}

// 查看训练记录详情
const viewRecordDetail = (record) => {
  uni.navigateTo({
    url: `/pages/analysis/detail?id=${record.id}`
  })
}

// 查看训练计划详情
const viewPlanDetail = (plan) => {
  uni.navigateTo({
    url: `/pages/plans/detail?id=${plan.id}`
  })
}

// 开始训练
const startTraining = () => {
  uni.switchTab({ url: '/pages/monitor/monitor' })
}

// 跳转到个人中心
const goToProfile = () => {
  uni.switchTab({ url: '/pages/profile/profile' })
}

// 跳转到训练分析
const goToAnalysis = () => {
  uni.switchTab({ url: '/pages/analysis/analysis' })
}

// 跳转到训练计划
const goToPlans = () => {
  uni.switchTab({ url: '/pages/plans/plans' })
}

// 获取分数环形进度样式
const getScoreRingStyle = (score) => {
  return getCircleProgressStyle(score)
}
</script>

<style lang="scss" scoped>
.page-index {
  min-height: 100vh;
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}

/* 欢迎区 */
.welcome-section {
  margin-bottom: 32rpx;
}

.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.welcome-info {
  flex: 1;
}

.welcome-greeting {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: $text-primary; /* #e2e8f0 */
  margin-bottom: 8rpx;
}

.welcome-subtitle {
  display: block;
  font-size: 24rpx;
  color: $text-secondary; /* #94a3b8 */
}

.welcome-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba($primary-color, 0.3); /* #3b82f6 with opacity */

  image {
    width: 100%;
    height: 100%;
  }
}

.motivation-card {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  background: rgba($bg-card, 0.8); /* #111827 with opacity */
  backdrop-filter: blur(8px);
  border: 1px solid $border-color;
  border-radius: $radius-lg;
}

.motivation-icon-wrapper {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
}

.icon-sparkles {
  width: 32rpx;
  height: 32rpx;
  background: $gradient-primary;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 22l-.394-1.433a2.25 2.25 0 00-1.423-1.423L13.25 18.75l1.433-.394a2.25 2.25 0 001.423-1.423L16.5 15.5l.394 1.433a2.25 2.25 0 001.423 1.423l1.433.394-1.433.394a2.25 2.25 0 00-1.423 1.423z'/%3E%3C/svg%3E");
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 22l-.394-1.433a2.25 2.25 0 00-1.423-1.423L13.25 18.75l1.433-.394a2.25 2.25 0 001.423-1.423L16.5 15.5l.394 1.433a2.25 2.25 0 001.423 1.423l1.433.394-1.433.394a2.25 2.25 0 00-1.423 1.423z'/%3E%3C/svg%3E");
  mask-size: contain;
  -webkit-mask-size: contain;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
}

.motivation-text {
  flex: 1;
  font-size: 26rpx;
  color: $text-secondary; /* #cbd5e1 */
  line-height: 1.6;
}

/* 快速操作 */
.quick-actions {
  margin-bottom: 40rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary; /* #e2e8f0 */
  margin-bottom: 24rpx;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  border-radius: 16rpx;
  transition: all 0.3s ease;
  transform: translateY(0);
  opacity: 1;
  animation: quickItemFadeIn 0.6s ease forwards;

  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
  &:nth-child(4) { animation-delay: 0.4s; }

  &:hover {
    transform: translateY(-4rpx);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: scale(0.95) translateY(-4rpx);
  }
}

.quick-icon {
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 12rpx;
  background: rgba(255, 255, 255, 0.9);
  mask-size: contain;
  -webkit-mask-size: contain;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-position: center;
}

.icon-video {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z'/%3E%3C/svg%3E");
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z'/%3E%3C/svg%3E");
}

.icon-monitor {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z' clip-rule='evenodd'/%3E%3Cpath fill-rule='evenodd' d='M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z' clip-rule='evenodd'/%3E%3C/svg%3E");
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z' clip-rule='evenodd'/%3E%3Cpath fill-rule='evenodd' d='M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z' clip-rule='evenodd'/%3E%3C/svg%3E");
}

.icon-clipboard {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z' clip-rule='evenodd'/%3E%3Cpath fill-rule='evenodd' d='M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.586 4.594a.75.75 0 00-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.116-.062l3-3.75z' clip-rule='evenodd'/%3E%3C/svg%3E");
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z' clip-rule='evenodd'/%3E%3Cpath fill-rule='evenodd' d='M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.586 4.594a.75.75 0 00-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.116-.062l3-3.75z' clip-rule='evenodd'/%3E%3C/svg%3E");
}

.icon-target {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.6 45.6 0 012.006-.343v.256zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 01-2.863 3.207 6.72 6.72 0 00.857-3.294z' clip-rule='evenodd'/%3E%3C/svg%3E");
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.6 45.6 0 012.006-.343v.256zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 01-2.863 3.207 6.72 6.72 0 00.857-3.294z' clip-rule='evenodd'/%3E%3C/svg%3E");
}

.quick-label {
  font-size: 22rpx;
  color: #ffffff;
  font-weight: 500;
}

/* 统计区 */
.stats-section {
  margin-bottom: 40rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  opacity: 0;
  animation: sectionSlideIn 0.6s ease forwards 0.5s;
}

.section-more {
  font-size: 24rpx;
  color: $primary-color; /* #3b82f6 */
  transition: all 0.3s ease;
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  
  &:active {
    background: rgba(59, 130, 246, 0.1);
    transform: scale(0.95);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

/* 动画效果 */
@keyframes quickItemFadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes sectionSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardSlideUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 最近训练 */
.recent-section {
  margin-bottom: 40rpx;
  animation: sectionSlideIn 0.6s ease forwards 0.7s;
  opacity: 0;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.recent-item {
  margin-bottom: 0 !important;
  animation: cardSlideUp 0.5s ease forwards;
  opacity: 0;
  
  &:nth-child(1) { animation-delay: 0.8s; }
  &:nth-child(2) { animation-delay: 0.9s; }
  &:nth-child(3) { animation-delay: 1s; }
  
  &:hover {
    transform: translateY(-2rpx);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: scale(0.98) translateY(-2rpx);
  }
}

.recent-content {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.recent-left {
  flex: 1;
}

.recent-type {
  font-size: 28rpx;
  font-weight: 600;
  color: $text-primary; /* #e2e8f0 */
  margin-bottom: 8rpx;
}

.recent-date {
  font-size: 22rpx;
  color: $text-muted; /* #64748b */
}

.recent-center {
  display: flex;
  align-items: center;
}

.recent-score-ring {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recent-score-value {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-primary; /* #e2e8f0 */
}

.recent-right {
  text-align: right;
}

.recent-duration {
  font-size: 24rpx;
  color: $text-secondary; /* #94a3b8 */
  margin-bottom: 8rpx;
}

.recent-status {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: $radius-sm;
  font-weight: 500;

  &.status-excellent {
    color: $success-color; /* #10b981 */
    background: rgba($success-color, 0.1);
  }

  &.status-good {
    color: $primary-color; /* #3b82f6 */
    background: rgba($primary-color, 0.1);
  }

  &.status-normal {
    color: $warning-color; /* #f59e0b */
    background: rgba($warning-color, 0.1);
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 32rpx;
}

.empty-icon {
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 16rpx;
  background: linear-gradient(135deg, #64748b, #94a3b8);
  mask-size: contain;
  -webkit-mask-size: contain;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
}

.icon-chart-line {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z' clip-rule='evenodd'/%3E%3Cpath fill-rule='evenodd' d='M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z' clip-rule='evenodd'/%3E%3C/svg%3E");
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z' clip-rule='evenodd'/%3E%3Cpath fill-rule='evenodd' d='M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z' clip-rule='evenodd'/%3E%3C/svg%3E");
}

.empty-text {
  font-size: 26rpx;
  color: #64748b;
  margin-bottom: 32rpx;
}

/* 推荐计划 */
.recommend-section {
  margin-bottom: 40rpx;
  animation: sectionSlideIn 0.6s ease forwards 1.1s;
  opacity: 0;
}

.recommend-scroll {
  width: 100%;
  white-space: nowrap;
}

.recommend-list {
  display: inline-flex;
  gap: 16rpx;
}

.recommend-item {
  display: inline-block;
  width: 280rpx;
  vertical-align: top;
  animation: cardSlideUp 0.5s ease forwards;
  opacity: 0;
  
  &:nth-child(1) { animation-delay: 1.2s; }
  &:nth-child(2) { animation-delay: 1.3s; }
  &:nth-child(3) { animation-delay: 1.4s; }
  
  &:hover {
    transform: translateY(-4rpx);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: scale(0.98) translateY(-4rpx);
  }
}

.plan-badge {
  font-size: 20rpx;
  color: #ffffff;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  display: inline-block;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.badge-hot {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
}

.badge-recommend {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
}

.badge-premium {
  background: linear-gradient(135deg, #10b981, #06b6d4);
}

.plan-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 12rpx;
}

.plan-desc {
  font-size: 22rpx;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 16rpx;
  white-space: normal;
}

.plan-footer {
  display: flex;
  justify-content: space-between;
  font-size: 20rpx;
  color: #64748b;
}
</style>
