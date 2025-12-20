<template>
  <!-- 通用卡片组件 -->
  <view
    class="se-card"
    :class="[
      `se-card--${variant}`,
      hover && 'se-card--hover',
      shadow && 'se-card--shadow'
    ]"
    :style="cardStyle"
    @tap="handleClick"
  >
    <!-- 卡片标题 -->
    <view v-if="title || $slots.header" class="se-card__header">
      <slot name="header">
        <view class="se-card__title">{{ title }}</view>
        <view v-if="subtitle" class="se-card__subtitle">{{ subtitle }}</view>
      </slot>
    </view>

    <!-- 卡片内容 -->
    <view class="se-card__body" :style="bodyStyle">
      <slot></slot>
    </view>

    <!-- 卡片底部 -->
    <view v-if="$slots.footer" class="se-card__footer">
      <slot name="footer"></slot>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

// Props 定义
const props = defineProps({
  // 标题
  title: {
    type: String,
    default: ''
  },
  // 副标题
  subtitle: {
    type: String,
    default: ''
  },
  // 卡片变体：default | primary | gradient
  variant: {
    type: String,
    default: 'default'
  },
  // 是否显示阴影
  shadow: {
    type: Boolean,
    default: true
  },
  // 是否启用悬停效果
  hover: {
    type: Boolean,
    default: false
  },
  // 内边距
  padding: {
    type: String,
    default: '32rpx'
  },
  // 圆角
  radius: {
    type: String,
    default: '24rpx'
  }
})

// Emits 定义
const emit = defineEmits(['click'])

// 卡片样式
const cardStyle = computed(() => ({
  borderRadius: props.radius
}))

// 内容区样式
const bodyStyle = computed(() => ({
  padding: props.padding
}))

// 点击事件
const handleClick = () => {
  emit('click')
}
</script>

<style lang="scss" scoped>
.se-card {
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(71, 85, 105, 0.2);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  transform: translateY(0);

  &--shadow {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  &--hover {
    &:hover {
      transform: translateY(-4rpx);
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.25);
      border-color: rgba(59, 130, 246, 0.4);
    }
    
    &:active {
      transform: translateY(0) scale(0.98);
      opacity: 0.95;
    }
  }

  &--primary {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    
    &--hover:hover {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.5);
    }
  }

  &--gradient {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
    border-color: rgba(102, 126, 234, 0.3);
    
    &--hover:hover {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%);
      border-color: rgba(102, 126, 234, 0.5);
    }
  }

  &__header {
    padding: 32rpx 32rpx 16rpx;
    border-bottom: 1px solid rgba(71, 85, 105, 0.1);
  }

  &__title {
    font-size: 32rpx;
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 8rpx;
  }

  &__subtitle {
    font-size: 24rpx;
    color: #94a3b8;
  }

  &__body {
    flex: 1;
  }

  &__footer {
    padding: 16rpx 32rpx 32rpx;
    border-top: 1px solid rgba(71, 85, 105, 0.1);
  }
}
</style>
