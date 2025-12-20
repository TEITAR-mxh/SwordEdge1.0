<template>
  <view class="page-plan-detail app-background">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 主内容 -->
    <view v-else-if="planDetail" class="detail-content">
      <!-- 计划头部 -->
      <view class="plan-header">
        <view class="plan-cover" :style="{ background: planDetail.coverGradient }">
          <text class="plan-badge">{{ planDetail.levelText }}</text>
          <text class="plan-title">{{ planDetail.title }}</text>
          <text class="plan-subtitle">{{ planDetail.subtitle }}</text>
        </view>
      </view>

      <!-- 计划信息 -->
      <se-card class="info-card">
        <view class="info-grid">
          <view class="info-item">
            <text class="info-icon">📅</text>
            <text class="info-label">时长</text>
            <text class="info-value">{{ planDetail.duration }}</text>
          </view>
          <view class="info-item">
            <text class="info-icon">🎯</text>
            <text class="info-label">难度</text>
            <text class="info-value">{{ planDetail.difficultyText }}</text>
          </view>
          <view class="info-item">
            <text class="info-icon">👥</text>
            <text class="info-label">参与</text>
            <text class="info-value">{{ planDetail.participants }}</text>
          </view>
          <view class="info-item">
            <text class="info-icon">⭐</text>
            <text class="info-label">评分</text>
            <text class="info-value">{{ planDetail.rating }}</text>
          </view>
        </view>
      </se-card>

      <!-- 计划描述 -->
      <se-card title="计划介绍" class="mt-4">
        <text class="plan-description">{{ planDetail.description }}</text>

        <view v-if="planDetail.goals?.length" class="goals-section">
          <text class="goals-title">训练目标</text>
          <view
            v-for="(goal, index) in planDetail.goals"
            :key="index"
            class="goal-item"
          >
            <text class="goal-bullet">•</text>
            <text class="goal-text">{{ goal }}</text>
          </view>
        </view>
      </se-card>

      <!-- 课程大纲 -->
      <se-card title="课程大纲" :subtitle="`共 ${planDetail.weeks?.length || 0} 周`" class="mt-4">
        <view class="weeks-list">
          <view
            v-for="(week, weekIndex) in planDetail.weeks"
            :key="weekIndex"
            class="week-item"
          >
            <view class="week-header" @tap="toggleWeek(weekIndex)">
              <view class="week-title-row">
                <text class="week-number">第 {{ weekIndex + 1 }} 周</text>
                <text class="week-title">{{ week.title }}</text>
              </view>
              <text class="week-arrow" :class="{ 'week-arrow--expanded': expandedWeeks.includes(weekIndex) }">›</text>
            </view>

            <view v-if="expandedWeeks.includes(weekIndex)" class="week-content">
              <view
                v-for="(lesson, lessonIndex) in week.lessons"
                :key="lessonIndex"
                class="lesson-item"
              >
                <view class="lesson-icon">
                  <text>{{ lesson.icon }}</text>
                </view>
                <view class="lesson-info">
                  <text class="lesson-name">{{ lesson.name }}</text>
                  <text class="lesson-duration">{{ lesson.duration }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </se-card>

      <!-- 用户评价 -->
      <se-card v-if="planDetail.reviews?.length" title="用户评价" class="mt-4">
        <view class="reviews-list">
          <view
            v-for="(review, index) in planDetail.reviews"
            :key="index"
            class="review-item"
          >
            <view class="review-header">
              <image :src="review.avatar" class="review-avatar" mode="aspectFill"></image>
              <view class="review-user-info">
                <text class="review-username">{{ review.username }}</text>
                <view class="review-rating">
                  <text
                    v-for="star in 5"
                    :key="star"
                    class="review-star"
                    :class="{ 'review-star--filled': star <= review.rating }"
                  >★</text>
                </view>
              </view>
              <text class="review-date">{{ formatDate(review.date) }}</text>
            </view>
            <text class="review-content">{{ review.content }}</text>
          </view>
        </view>
      </se-card>

      <!-- 底部操作按钮 -->
      <view class="action-section safe-area-inset-bottom">
        <se-button
          v-if="!planDetail.enrolled"
          type="primary"
          size="large"
          text="开始训练"
          block
          :loading="enrolling"
          @click="enrollPlan"
        />
        <se-button
          v-else
          type="success"
          size="large"
          text="继续训练"
          block
          @click="continuePlan"
        />
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-container">
      <text class="error-icon">❌</text>
      <text class="error-text">{{ errorMessage || '加载失败' }}</text>
      <se-button type="primary" text="重新加载" @click="loadPlanDetail" />
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { planAPI } from '@/utils/api.js'
import SeCard from '@/components/se-card/se-card.vue'
import SeButton from '@/components/se-button/se-button.vue'

// 页面参数
const planId = ref('')

// 数据状态
const loading = ref(true)
const enrolling = ref(false)
const planDetail = ref(null)
const errorMessage = ref('')
const expandedWeeks = ref([])

// 页面加载
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  planId.value = currentPage.options.id

  if (planId.value) {
    loadPlanDetail()
  } else {
    errorMessage.value = '缺少计划ID'
    loading.value = false
  }
})

// 加载计划详情
const loadPlanDetail = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await planAPI.getPlanDetail(planId.value)
    planDetail.value = result
  } catch (error) {
    console.error('加载计划详情失败:', error)
    errorMessage.value = error.message || '加载失败，请重试'
  } finally {
    loading.value = false
  }
}

// 展开/折叠周次
const toggleWeek = (weekIndex) => {
  const index = expandedWeeks.value.indexOf(weekIndex)
  if (index > -1) {
    expandedWeeks.value.splice(index, 1)
  } else {
    expandedWeeks.value.push(weekIndex)
  }
}

// 报名计划
const enrollPlan = async () => {
  try {
    const result = await uni.showModal({
      title: '开始训练',
      content: `确定要开始「${planDetail.value.title}」训练计划吗？`,
      confirmText: '确定',
      cancelText: '取消'
    })

    if (!result.confirm) return

    enrolling.value = true
    uni.showLoading({ title: '加载中...' })

    await planAPI.createPlan({
      planId: planId.value,
      startDate: new Date().toISOString()
    })

    uni.hideLoading()
    uni.showToast({
      title: '报名成功',
      icon: 'success',
      duration: 1500
    })

    // 更新状态
    planDetail.value.enrolled = true

    // 延迟跳转
    setTimeout(() => {
      uni.switchTab({ url: '/pages/plans/plans' })
    }, 1500)

  } catch (error) {
    uni.hideLoading()
    console.error('报名失败:', error)
    uni.showToast({
      title: error.message || '报名失败',
      icon: 'none'
    })
  } finally {
    enrolling.value = false
  }
}

// 继续训练
const continuePlan = () => {
  uni.switchTab({ url: '/pages/monitor/monitor' })
}

// 工具函数
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}
</script>

<style lang="scss" scoped>
.page-plan-detail {
  min-height: 100vh;
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

/* 计划头部 */
.plan-header {
  margin-bottom: 32rpx;
}

.plan-cover {
  padding: 80rpx 48rpx;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(118, 75, 162, 0.3));
  border-bottom-left-radius: 48rpx;
  border-bottom-right-radius: 48rpx;
  text-align: center;
}

.plan-badge {
  display: inline-block;
  padding: 8rpx 24rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12rpx;
  font-size: 22rpx;
  color: #ffffff;
  margin-bottom: 16rpx;
}

.plan-title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12rpx;
}

.plan-subtitle {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 信息卡片 */
.info-card {
  margin: 0 32rpx;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.info-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.info-label {
  font-size: 22rpx;
  color: #64748b;
  margin-bottom: 8rpx;
}

.info-value {
  font-size: 26rpx;
  font-weight: 600;
  color: #e2e8f0;
}

/* 计划描述 */
.plan-description {
  font-size: 28rpx;
  color: #cbd5e1;
  line-height: 1.8;
}

.goals-section {
  margin-top: 32rpx;
  padding-top: 32rpx;
  border-top: 1px solid rgba(71, 85, 105, 0.2);
}

.goals-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 16rpx;
}

.goal-item {
  display: flex;
  gap: 12rpx;
  margin-bottom: 12rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.goal-bullet {
  font-size: 32rpx;
  color: #3b82f6;
  line-height: 1.4;
}

.goal-text {
  flex: 1;
  font-size: 26rpx;
  color: #94a3b8;
  line-height: 1.6;
}

/* 课程大纲 */
.weeks-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.week-item {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(71, 85, 105, 0.3);
  border-radius: 16rpx;
  overflow: hidden;
}

.week-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  cursor: pointer;

  &:active {
    background: rgba(30, 41, 59, 0.7);
  }
}

.week-title-row {
  flex: 1;
}

.week-number {
  font-size: 24rpx;
  color: #3b82f6;
  font-weight: 600;
  margin-right: 16rpx;
}

.week-title {
  font-size: 28rpx;
  color: #e2e8f0;
  font-weight: 600;
}

.week-arrow {
  font-size: 40rpx;
  color: #64748b;
  transition: transform 0.3s ease;

  &--expanded {
    transform: rotate(90deg);
  }
}

.week-content {
  padding: 0 24rpx 24rpx;
}

.lesson-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx;
  background: rgba(17, 24, 39, 0.5);
  border-radius: 12rpx;
  margin-bottom: 12rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.lesson-icon {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 12rpx;
  font-size: 28rpx;
}

.lesson-info {
  flex: 1;
}

.lesson-name {
  display: block;
  font-size: 26rpx;
  color: #e2e8f0;
  margin-bottom: 4rpx;
}

.lesson-duration {
  font-size: 22rpx;
  color: #64748b;
}

/* 用户评价 */
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.review-item {
  padding-bottom: 24rpx;
  border-bottom: 1px solid rgba(71, 85, 105, 0.2);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.review-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.review-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
}

.review-user-info {
  flex: 1;
}

.review-username {
  display: block;
  font-size: 26rpx;
  color: #e2e8f0;
  font-weight: 600;
  margin-bottom: 4rpx;
}

.review-rating {
  display: flex;
  gap: 4rpx;
}

.review-star {
  font-size: 20rpx;
  color: rgba(251, 191, 36, 0.3);

  &--filled {
    color: #fbbf24;
  }
}

.review-date {
  font-size: 22rpx;
  color: #64748b;
}

.review-content {
  font-size: 26rpx;
  color: #94a3b8;
  line-height: 1.6;
}

/* 操作区域 */
.action-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
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
  padding: 32rpx;
}

.error-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.error-text {
  font-size: 26rpx;
  color: #94a3b8;
  margin-bottom: 32rpx;
  text-align: center;
}
</style>
