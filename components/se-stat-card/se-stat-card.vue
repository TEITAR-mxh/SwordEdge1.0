<template>
  <!-- 统计卡片组件 -->
  <view
    class="se-stat-card"
    :class="[
      `se-stat-card--${type}`,
      hover && 'se-stat-card--hover'
    ]"
    @tap="handleClick"
  >
    <!-- 图标 -->
    <view class="se-stat-card__icon">
      <view :class="`icon-${icon}`"></view>
    </view>

    <!-- 内容 -->
    <view class="se-stat-card__content">
      <view class="se-stat-card__value">{{ value }}</view>
      <view class="se-stat-card__label">{{ label }}</view>
    </view>

    <!-- 趋势指示器 -->
    <view v-if="trend" class="se-stat-card__trend" :class="`se-stat-card__trend--${trend}`">
      <view :class="trend === 'up' ? 'icon-arrow-up' : 'icon-arrow-down'"></view>
      <text v-if="trendValue">{{ trendValue }}</text>
    </view>
  </view>
</template>

<script setup>
// Props 定义
const props = defineProps({
  // 图标名称
  icon: {
    type: String,
    required: true
  },
  // 数值
  value: {
    type: [String, Number],
    required: true
  },
  // 标签
  label: {
    type: String,
    required: true
  },
  // 卡片类型：default | primary | success | warning | danger
  type: {
    type: String,
    default: 'default'
  },
  // 趋势：up | down | null
  trend: {
    type: String,
    default: null,
    validator: (value) => !value || ['up', 'down'].includes(value)
  },
  // 趋势数值
  trendValue: {
    type: String,
    default: ''
  },
  // 是否启用悬停效果
  hover: {
    type: Boolean,
    default: true
  }
})

// Emits 定义
const emit = defineEmits(['click'])

// 点击事件
const handleClick = () => {
  emit('click')
}
</script>

<style lang="scss" scoped>
.se-stat-card {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(71, 85, 105, 0.2);
  border-radius: 24rpx;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transform: translateY(0);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4rpx;
    height: 100%;
    background: currentColor;
    opacity: 0.6;
  }

  &--hover {
    &:hover {
      transform: translateY(-4rpx);
      box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
      border-color: rgba(59, 130, 246, 0.4);
    }
    
    &:active {
      transform: translateY(0) scale(0.98);
    }
  }

  /* 卡片类型颜色 */
  &--default {
    color: #3b82f6;
    
    &:hover {
      background: rgba(17, 24, 39, 0.9);
    }
  }

  &--primary {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
    border-color: rgba(59, 130, 246, 0.2);
    
    &:hover {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.5);
    }
  }

  &--success {
    color: #10b981;
    background: rgba(16, 185, 129, 0.05);
    border-color: rgba(16, 185, 129, 0.2);
    
    &:hover {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.5);
    }
  }

  &--warning {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.05);
    border-color: rgba(245, 158, 11, 0.2);
    
    &:hover {
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.5);
    }
  }

  &--danger {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
    border-color: rgba(239, 68, 68, 0.2);
    
    &:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.5);
    }
  }
  
  &__icon {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 16rpx;
    margin-right: 24rpx;
    transition: all 0.3s ease;

    [class^="icon-"] {
      width: 40rpx;
      height: 40rpx;
      background: currentColor;
      transition: all 0.3s ease;
    }
    
    &:hover {
      transform: scale(1.1);
    }
  }
  
  &__content {
    flex: 1;
  }
  
  &__value {
    font-size: 40rpx;
    font-weight: 700;
    color: #e2e8f0;
    line-height: 1.2;
    margin-bottom: 4rpx;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all 0.3s ease;
    
    &:hover {
      color: currentColor;
    }
  }
  
  &__label {
    font-size: 24rpx;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all 0.3s ease;
  }
  
  &__trend {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 24rpx;
    font-weight: 600;
    padding: 8rpx 16rpx;
    border-radius: 8rpx;
    transition: all 0.3s ease;

    &--up {
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      
      &:hover {
        background: rgba(16, 185, 129, 0.2);
        transform: scale(1.05);
      }
    }

    &--down {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      
      &:hover {
        background: rgba(239, 68, 68, 0.2);
        transform: scale(1.05);
      }
    }

    .iconfont {
      font-size: 20rpx;
    }
  }
}
</style>
