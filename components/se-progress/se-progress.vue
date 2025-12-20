<template>
  <!-- 进度条组件 -->
  <view class="se-progress">
    <!-- 进度信息 -->
    <view v-if="showInfo" class="se-progress__info">
      <text class="se-progress__label">{{ label }}</text>
      <text class="se-progress__percent">{{ currentPercent }}%</text>
    </view>

    <!-- 进度条轨道 -->
    <view class="se-progress__track" :style="trackStyle">
      <!-- 进度条填充 -->
      <view
        class="se-progress__fill"
        :class="[
          `se-progress__fill--${type}`,
          active && 'se-progress__fill--active'
        ]"
        :style="fillStyle"
      >
        <!-- 动画条纹（仅在 active 模式下显示） -->
        <view v-if="active && striped" class="se-progress__stripes"></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props 定义
const props = defineProps({
  // 进度百分比（0-100）
  percent: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 100
  },
  // 进度条类型：default | success | warning | danger
  type: {
    type: String,
    default: 'default'
  },
  // 标签文本
  label: {
    type: String,
    default: ''
  },
  // 是否显示进度信息
  showInfo: {
    type: Boolean,
    default: true
  },
  // 是否显示条纹
  striped: {
    type: Boolean,
    default: false
  },
  // 是否激活动画
  active: {
    type: Boolean,
    default: false
  },
  // 进度条高度
  height: {
    type: String,
    default: '16rpx'
  },
  // 进度条圆角
  radius: {
    type: String,
    default: '8rpx'
  }
})

// 当前百分比（用于动画过渡）
const currentPercent = ref(0)

// 监听百分比变化，实现平滑过渡
watch(() => props.percent, (newVal) => {
  const step = newVal > currentPercent.value ? 1 : -1
  const timer = setInterval(() => {
    if (currentPercent.value === newVal) {
      clearInterval(timer)
    } else {
      currentPercent.value += step
    }
  }, 10)
}, { immediate: true })

// 轨道样式
const trackStyle = computed(() => ({
  height: props.height,
  borderRadius: props.radius
}))

// 填充样式
const fillStyle = computed(() => ({
  width: `${currentPercent.value}%`,
  borderRadius: props.radius
}))
</script>

<style lang="scss" scoped>
.se-progress {
  width: 100%;

  &__info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12rpx;
  }

  &__label {
    font-size: 24rpx;
    color: #94a3b8;
  }

  &__percent {
    font-size: 24rpx;
    font-weight: 600;
    color: #3b82f6;
  }

  &__track {
    position: relative;
    width: 100%;
    background: rgba(71, 85, 105, 0.2);
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    transition: width 0.3s ease;
    position: relative;
    overflow: hidden;

    &--default {
      background: linear-gradient(90deg, #4f8ef7, #10d981);
    }

    &--success {
      background: linear-gradient(90deg, #10b981, #059669);
    }

    &--warning {
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }

    &--danger {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }

    &--active {
      animation: progress-pulse 1.5s ease-in-out infinite;
    }
  }

  &__stripes {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.15) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.15) 75%,
      transparent 75%,
      transparent
    );
    background-size: 40rpx 40rpx;
    animation: progress-stripes 1s linear infinite;
  }
}

@keyframes progress-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes progress-stripes {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 40rpx 0;
  }
}
</style>
