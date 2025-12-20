<template>
  <view class="page-plans app-background">
    <!-- 当前训练计划 -->
    <se-card title="当前训练计划" v-if="currentPlan">
      <view class="current-plan">
        <view class="plan-badge">{{ currentPlan.badge }}</view>
        <text class="plan-title">{{ currentPlan.title }}</text>
        <text class="plan-desc">{{ currentPlan.description }}</text>

        <view class="plan-progress">
          <view class="progress-header">
            <text class="progress-label">训练进度</text>
            <text class="progress-value">第{{ currentPlan.currentWeek }}周 / {{currentPlan.totalWeeks }}周</text>
          </view>
          <se-progress
            :percent="(currentPlan.currentWeek / currentPlan.totalWeeks) * 100"
            :show-info="false"
            type="success"
            :active="true"
          />
        </view>

        <view class="plan-stats">
          <view class="stat-item">
            <text class="stat-value">{{ currentPlan.completed }}</text>
            <text class="stat-label">已完成</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ currentPlan.total }}</text>
            <text class="stat-label">总任务</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ currentPlan.remaining }}</text>
            <text class="stat-label">剩余</text>
          </view>
        </view>

        <se-button
          type="primary"
          icon="play"
          text="继续训练"
          block
          @click="continuePlan"
        />
      </view>
    </se-card>

    <!-- 今日任务 -->
    <se-card title="今日任务" :subtitle="`${completedToday}/${dailyTasks.length} 已完成`" class="mt-4">
      <view class="tasks-list">
        <view
          v-for="task in dailyTasks"
          :key="task.id"
          class="task-item"
          :class="{ 'task-item--completed': task.completed }"
          @tap="toggleTask(task.id)"
        >
          <view class="task-checkbox" :class="{ 'task-checkbox--checked': task.completed }">
            <text v-if="task.completed" class="checkbox-icon">✓</text>
          </view>
          <view class="task-content">
            <text class="task-name">{{ task.name }}</text>
            <view class="task-meta">
              <text class="task-duration">{{ task.duration }}</text>
              <text class="task-difficulty" :class="`difficulty-${task.difficulty}`">
                {{ task.difficultyText }}
              </text>
            </view>
          </view>
          <text class="task-points">+{{ task.points }}</text>
        </view>

        <view v-if="dailyTasks.length === 0" class="empty-tasks">
          <text class="empty-icon">✅</text>
          <text class="empty-text">今日无训练任务</text>
        </view>
      </view>

      <view v-if="completedToday === dailyTasks.length && dailyTasks.length > 0" class="completion-reward">
        <text class="reward-icon">🎉</text>
        <text class="reward-text">恭喜完成今日所有任务！</text>
        <text class="reward-points">获得 {{ totalPoints }} 经验值</text>
      </view>
    </se-card>

    <!-- 推荐训练计划 -->
    <view class="section-header mt-4">
      <text class="section-title">推荐计划</text>
      <text class="section-more" @tap="viewAllPlans">全部 ></text>
    </view>

    <view class="plans-grid">
      <se-card
        v-for="plan in recommendedPlans"
        :key="plan.id"
        class="plan-card"
        :hover="true"
        @click="viewPlanDetail(plan)"
      >
        <view class="plan-header">
          <text class="plan-badge-small" :class="`badge-${plan.level}`">
            {{ plan.levelText }}
          </text>
          <text v-if="plan.hot" class="plan-hot">🔥</text>
        </view>

        <text class="plan-card-title">{{ plan.title }}</text>
        <text class="plan-card-desc">{{ plan.description }}</text>

        <view class="plan-info">
          <view class="info-item">
            <text class="info-icon">📅</text>
            <text class="info-text">{{ plan.duration }}</text>
          </view>
          <view class="info-item">
            <text class="info-icon">👥</text>
            <text class="info-text">{{ plan.participants }}人参与</text>
          </view>
        </view>

        <view class="plan-footer">
          <view class="plan-rating">
            <text class="rating-star">★</text>
            <text class="rating-value">{{ plan.rating }}</text>
          </view>
          <se-button
            type="primary"
            size="small"
            text="选择"
            @click.stop="selectPlan(plan)"
          />
        </view>
      </se-card>
    </view>

    <!-- 我的计划 -->
    <se-card title="我的计划" class="mt-4">
      <view class="my-plans-list">
        <view
          v-for="plan in myPlans"
          :key="plan.id"
          class="my-plan-item"
          @tap="viewPlanDetail(plan)"
        >
          <view class="my-plan-left">
            <view class="plan-icon" :style="{ background: plan.color }">
              <text>{{ plan.icon }}</text>
            </view>
            <view class="plan-info-col">
              <text class="plan-name">{{ plan.title }}</text>
              <text class="plan-progress-text">进度: {{ plan.progress }}%</text>
            </view>
          </view>

          <view class="my-plan-right">
            <view class="progress-circle" :style="getCircleProgress(plan.progress)">
              <text class="progress-percent">{{ plan.progress }}%</text>
            </view>
          </view>
        </view>

        <view v-if="myPlans.length === 0" class="empty-plans">
          <text class="empty-icon">📋</text>
          <text class="empty-text">暂无训练计划</text>
          <se-button
            type="primary"
            size="small"
            text="选择计划"
            @click="scrollToRecommended"
          />
        </view>
      </view>
    </se-card>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { planAPI } from '@/utils/api.js'
import { getCircleProgressStyle } from '@/utils/common.js'
import SeCard from '@/components/se-card/se-card.vue'
import SeButton from '@/components/se-button/se-button.vue'
import SeProgress from '@/components/se-progress/se-progress.vue'

// 当前训练计划
const currentPlan = ref({
  id: 1,
  badge: '进行中',
  title: '基础击剑入门',
  description: '适合初学者的系统化训练计划',
  currentWeek: 2,
  totalWeeks: 4,
  completed: 12,
  total: 24,
  remaining: 12
})

// 今日任务
const dailyTasks = ref([
  {
    id: 1,
    name: '直刺基础练习',
    duration: '10分钟',
    difficulty: 'easy',
    difficultyText: '简单',
    points: 50,
    completed: true
  },
  {
    id: 2,
    name: '步法移动训练',
    duration: '15分钟',
    difficulty: 'medium',
    difficultyText: '中等',
    points: 80,
    completed: true
  },
  {
    id: 3,
    name: '姿态矫正练习',
    duration: '20分钟',
    difficulty: 'medium',
    difficultyText: '中等',
    points: 100,
    completed: false
  }
])

// 推荐计划
const recommendedPlans = ref([
  {
    id: 2,
    title: '进阶步法训练',
    description: '提升移动速度和灵活性',
    level: 'intermediate',
    levelText: '中级',
    duration: '6周',
    participants: 1250,
    rating: 4.8,
    hot: true
  },
  {
    id: 3,
    title: '实战技巧强化',
    description: '提高实战应用能力',
    level: 'advanced',
    levelText: '高级',
    duration: '8周',
    participants: 890,
    rating: 4.9,
    hot: false
  },
  {
    id: 4,
    title: '力量与耐力提升',
    description: '增强体能和持久力',
    level: 'beginner',
    levelText: '初级',
    duration: '4周',
    participants: 2100,
    rating: 4.6,
    hot: true
  }
])

// 我的计划
const myPlans = ref([
  {
    id: 1,
    title: '基础击剑入门',
    icon: '⚔️',
    color: 'rgba(59, 130, 246, 0.2)',
    progress: 50
  },
  {
    id: 5,
    title: '柔韧性训练',
    icon: '🧘',
    color: 'rgba(16, 185, 129, 0.2)',
    progress: 25
  }
])

// 计算属性
const completedToday = computed(() => {
  return dailyTasks.value.filter(task => task.completed).length
})

const totalPoints = computed(() => {
  return dailyTasks.value
    .filter(task => task.completed)
    .reduce((sum, task) => sum + task.points, 0)
})

// 切换任务完成状态
const toggleTask = async (taskId) => {
  const task = dailyTasks.value.find(t => t.id === taskId)
  if (task) {
    task.completed = !task.completed

    // 震动反馈
    uni.vibrateShort()

    // 如果完成，显示动画提示
    if (task.completed) {
      uni.showToast({
        title: `完成任务 +${task.points}`,
        icon: 'success',
        duration: 1500
      })
    }
  }
}

// 继续当前计划
const continuePlan = () => {
  uni.switchTab({
    url: '/pages/monitor/monitor'
  })
}

// 查看计划详情
const viewPlanDetail = (plan) => {
  uni.navigateTo({
    url: `/pages/plans/detail?id=${plan.id}`
  })
}

// 选择训练计划
const selectPlan = async (plan) => {
  try {
    const result = await uni.showModal({
      title: '选择训练计划',
      content: `确定要开始「${plan.title}」训练计划吗？`,
      confirmText: '确定',
      cancelText: '取消'
    })

    if (result.confirm) {
      uni.showLoading({ title: '加载中...' })

      // 调用 API 选择计划
      await planAPI.createPlan({
        planId: plan.id,
        startDate: new Date().toISOString()
      })

      uni.hideLoading()

      uni.showToast({
        title: '计划已添加',
        icon: 'success'
      })

      // 刷新数据
      // loadMyPlans()
    }
  } catch (error) {
    uni.hideLoading()
    console.error('选择计划失败:', error)
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
  }
}

// 查看所有计划
const viewAllPlans = () => {
  uni.navigateTo({
    url: '/pages/plans/list'
  })
}

// 滚动到推荐计划
const scrollToRecommended = () => {
  // 实现滚动逻辑
}

// 获取圆形进度样式
const getCircleProgress = (progress) => {
  return getCircleProgressStyle(progress)
}
</script>

<style lang="scss" scoped>
.page-plans {
  min-height: 100vh;
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}

/* 当前计划 */
.current-plan {
  width: 100%;
}

.plan-badge {
  display: inline-block;
  padding: 8rpx 20rpx;
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  font-size: 22rpx;
  font-weight: 600;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}

.plan-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 12rpx;
}

.plan-desc {
  display: block;
  font-size: 26rpx;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 32rpx;
}

.plan-progress {
  margin-bottom: 32rpx;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.progress-label {
  font-size: 26rpx;
  color: #94a3b8;
}

.progress-value {
  font-size: 26rpx;
  font-weight: 600;
  color: #3b82f6;
}

.plan-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 32rpx;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 16rpx;
  margin-bottom: 32rpx;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 22rpx;
  color: #94a3b8;
}

.stat-divider {
  width: 1px;
  height: 48rpx;
  background: rgba(71, 85, 105, 0.5);
}

/* 任务列表 */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(71, 85, 105, 0.3);
  border-radius: 16rpx;
  transition: all 0.3s ease;
  transform: translateY(0);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2rpx);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
  }

  &--completed {
    opacity: 0.6;
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.3);

    .task-name {
      text-decoration: line-through;
      color: #64748b;
    }
  }

  &:active {
    transform: scale(0.98) translateY(-2rpx);
  }
}

.task-checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2px solid rgba(71, 85, 105, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;

  &--checked {
    background: linear-gradient(135deg, #10b981, #059669);
    border-color: #10b981;
  }
}

.checkbox-icon {
  font-size: 24rpx;
  color: #ffffff;
  font-weight: 700;
}

.task-content {
  flex: 1;
}

.task-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 8rpx;
}

.task-meta {
  display: flex;
  gap: 16rpx;
}

.task-duration {
  font-size: 22rpx;
  color: #64748b;
}

.task-difficulty {
  font-size: 22rpx;
  padding: 2rpx 12rpx;
  border-radius: 6rpx;

  &.difficulty-easy {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  &.difficulty-medium {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }

  &.difficulty-hard {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
}

.task-points {
  font-size: 28rpx;
  font-weight: 700;
  color: #3b82f6;
}

.empty-tasks {
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

.completion-reward {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx;
  margin-top: 24rpx;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 16rpx;
}

.reward-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.reward-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #10b981;
  margin-bottom: 8rpx;
}

.reward-points {
  font-size: 24rpx;
  color: #94a3b8;
}

/* 推荐计划 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #e2e8f0;
}

.section-more {
  font-size: 24rpx;
  color: #3b82f6;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.plan-card {
  height: 100%;
  animation: planCardFadeIn 0.5s ease forwards;
  opacity: 0;
  transform: translateY(20rpx);
  transition: all 0.3s ease;
  
  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
  
  &:hover {
    transform: translateY(-4rpx);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
  }
}

@keyframes planCardFadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.plan-badge-small {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  font-weight: 600;

  &.badge-beginner {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  &.badge-intermediate {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }

  &.badge-advanced {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
}

.plan-hot {
  font-size: 24rpx;
}

.plan-card-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 8rpx;
}

.plan-card-desc {
  display: block;
  font-size: 22rpx;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 16rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.plan-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.info-icon {
  font-size: 20rpx;
}

.info-text {
  font-size: 20rpx;
  color: #64748b;
}

.plan-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1px solid rgba(71, 85, 105, 0.3);
}

.plan-rating {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.rating-star {
  font-size: 20rpx;
  color: #fbbf24;
}

.rating-value {
  font-size: 22rpx;
  font-weight: 600;
  color: #e2e8f0;
}

/* 我的计划 */
.my-plans-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.my-plan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(71, 85, 105, 0.3);
  border-radius: 16rpx;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
  }
}

.my-plan-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
}

.plan-icon {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  border-radius: 12rpx;
}

.plan-info-col {
  display: flex;
  flex-direction: column;
}

.plan-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 8rpx;
}

.plan-progress-text {
  font-size: 22rpx;
  color: #64748b;
}

.my-plan-right {
  flex-shrink: 0;
}

.progress-circle {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-percent {
  font-size: 20rpx;
  font-weight: 700;
  color: #e2e8f0;
}

.empty-plans {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 32rpx;
}
</style>
