<template>
  <!-- 通用按钮组件 -->
  <button
    class="se-button"
    :class="[
      `se-button--${type}`,
      `se-button--${size}`,
      block && 'se-button--block',
      plain && 'se-button--plain',
      round && 'se-button--round',
      disabled && 'se-button--disabled',
      loading && 'se-button--loading'
    ]"
    :disabled="disabled || loading"
    :loading="loading"
    :hover-class="hoverClass"
    @tap="handleClick"
  >
    <!-- 加载图标 -->
    <view v-if="loading" class="se-button__loading">
      <view class="se-button__spinner"></view>
    </view>

    <!-- 图标 -->
    <text v-if="icon && !loading" :class="`iconfont icon-${icon}`" class="se-button__icon"></text>

    <!-- 按钮文本 -->
    <text class="se-button__text">
      <slot>{{ text }}</slot>
    </text>
  </button>
</template>

<script setup>
// Props 定义
const props = defineProps({
  // 按钮文本
  text: {
    type: String,
    default: ''
  },
  // 按钮类型：default | primary | success | warning | danger | info
  type: {
    type: String,
    default: 'default'
  },
  // 按钮尺寸：small | medium | large
  size: {
    type: String,
    default: 'medium'
  },
  // 图标名称
  icon: {
    type: String,
    default: ''
  },
  // 是否为块级按钮
  block: {
    type: Boolean,
    default: false
  },
  // 是否为朴素按钮
  plain: {
    type: Boolean,
    default: false
  },
  // 是否为圆形按钮
  round: {
    type: Boolean,
    default: false
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否加载中
  loading: {
    type: Boolean,
    default: false
  },
  // 悬停样式类名
  hoverClass: {
    type: String,
    default: 'se-button--hover'
  }
})

// Emits 定义
const emit = defineEmits(['click'])

// 点击事件
const handleClick = (e) => {
  if (!props.disabled && !props.loading) {
    emit('click', e)
  }
}
</script>

<style lang="scss" scoped>
.se-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 32rpx;
  font-size: 28rpx;
  font-weight: 500;
  border-radius: 12rpx;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;

  /* 移除默认按钮样式 */
  &::after {
    border: none;
  }
  
  /* 按钮类型 */
  &--default {
    background: rgba(71, 85, 105, 0.3);
    color: #e2e8f0;
    border-color: rgba(71, 85, 105, 0.4);
    
    &:hover {
      background: rgba(71, 85, 105, 0.4);
      transform: translateY(-2rpx);
      box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.15);
    }
    
    &:active {
      transform: translateY(0) scale(0.98);
    }
  }

  &--primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    
    &:hover {
      transform: translateY(-2rpx);
      box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.4);
    }
    
    &:active {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 4rpx 16rpx rgba(59, 130, 246, 0.3);
    }
  }

  &--success {
    background: linear-gradient(135deg, #10b981, #059669);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    
    &:hover {
      transform: translateY(-2rpx);
      box-shadow: 0 8rpx 24rpx rgba(16, 185, 129, 0.4);
    }
    
    &:active {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 4rpx 16rpx rgba(16, 185, 129, 0.3);
    }
  }

  &--warning {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    
    &:hover {
      transform: translateY(-2rpx);
      box-shadow: 0 8rpx 24rpx rgba(245, 158, 11, 0.4);
    }
    
    &:active {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 4rpx 16rpx rgba(245, 158, 11, 0.3);
    }
  }

  &--danger {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    
    &:hover {
      transform: translateY(-2rpx);
      box-shadow: 0 8rpx 24rpx rgba(239, 68, 68, 0.4);
    }
    
    &:active {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 4rpx 16rpx rgba(239, 68, 68, 0.3);
    }
  }

  &--info {
    background: linear-gradient(135deg, #06b6d4, #0891b2);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
    
    &:hover {
      transform: translateY(-2rpx);
      box-shadow: 0 8rpx 24rpx rgba(6, 182, 212, 0.4);
    }
    
    &:active {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 4rpx 16rpx rgba(6, 182, 212, 0.3);
    }
  }
  
  /* 按钮尺寸 */
  &--small {
    padding: 12rpx 24rpx;
    font-size: 24rpx;
    border-radius: 8rpx;
  }

  &--medium {
    padding: 20rpx 32rpx;
    font-size: 28rpx;
    border-radius: 12rpx;
  }

  &--large {
    padding: 28rpx 48rpx;
    font-size: 32rpx;
    border-radius: 16rpx;
  }
  
  /* 块级按钮 */
  &--block {
    width: 100%;
    display: flex;
  }
  
  /* 朴素按钮 */
  &--plain {
    background: transparent !important;
    box-shadow: none !important;
    
    &:hover {
      opacity: 0.9;
      transform: translateY(-2rpx);
    }
    
    &:active {
      transform: translateY(0) scale(0.98);
    }

    &.se-button--primary {
      color: #3b82f6;
      border-color: #3b82f6;
      
      &:hover {
        background: rgba(59, 130, 246, 0.1) !important;
      }
    }

    &.se-button--success {
      color: #10b981;
      border-color: #10b981;
      
      &:hover {
        background: rgba(16, 185, 129, 0.1) !important;
      }
    }

    &.se-button--warning {
      color: #f59e0b;
      border-color: #f59e0b;
      
      &:hover {
        background: rgba(245, 158, 11, 0.1) !important;
      }
    }

    &.se-button--danger {
      color: #ef4444;
      border-color: #ef4444;
      
      &:hover {
        background: rgba(239, 68, 68, 0.1) !important;
      }
    }
  }
  
  /* 圆形按钮 */
  &--round {
    border-radius: 9999rpx;
  }
  
  /* 禁用状态 */
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
  
  /* 加载状态 */
  &--loading {
    pointer-events: none;
  }
  
  /* 悬停效果 */
  &--hover {
    transform: scale(0.98);
    opacity: 0.9;
  }
  
  /* 图标 */
  &__icon {
    margin-right: 12rpx;
    font-size: 32rpx;
  }
  
  /* 文本 */
  &__text {
    line-height: 1;
  }
  
  /* 加载动画 */
  &__loading {
    margin-right: 12rpx;
  }
  
  &__spinner {
    width: 28rpx;
    height: 28rpx;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  /* 添加点击波纹效果 */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }
  
  &:active::before {
    width: 300rpx;
    height: 300rpx;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
