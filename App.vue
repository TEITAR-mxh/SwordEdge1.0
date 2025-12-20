<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { ref, provide } from 'vue'

// 全局加载状态
const isLoading = ref(false)
let loadingCount = 0

// 显示加载状态
const showLoading = (title = '加载中...') => {
  loadingCount++
  if (loadingCount === 1 && !isLoading.value) {
    isLoading.value = true
    uni.showLoading({
      title,
      mask: true
    })
  }
}

// 隐藏加载状态
const hideLoading = () => {
  loadingCount--
  if (loadingCount <= 0) {
    loadingCount = 0
    if (isLoading.value) {
      isLoading.value = false
      uni.hideLoading()
    }
  }
}

// 提供全局方法给所有组件
provide('globalLoading', {
  show: showLoading,
  hide: hideLoading,
  isLoading
})

// 应用生命周期 - 启动
onLaunch(() => {
  console.log('App Launch')

  // 检查登录状态
  checkLoginStatus()

  // 初始化主题
  initTheme()
})

// 应用生命周期 - 显示
onShow(() => {
  console.log('App Show')
})

// 应用生命周期 - 隐藏
onHide(() => {
  console.log('App Hide')
})

// 检查登录状态
const checkLoginStatus = () => {
  const token = uni.getStorageSync('token')
  if (!token) {
    // 如果未登录，跳转到登录页
    uni.redirectTo({ url: '/pages/login/login' })
  } else {
    // 如果已登录，跳转到首页
    uni.switchTab({ url: '/pages/index/index' })
  }
}

// 初始化主题
const initTheme = () => {
  // 设置状态栏样式
  // #ifdef APP-PLUS
  try {
    plus.navigator.setStatusBarStyle('light')
  } catch (e) {
    console.log('设置状态栏失败:', e)
  }
  // #endif

  // #ifdef MP-WEIXIN
  uni.setNavigationBarColor({
    frontColor: '#ffffff',
    backgroundColor: '#0c0a15'
  })
  // #endif
}
</script>

<style lang="scss">
/* 全局样式 */
@import './uni.scss';
@import './styles/icons.scss';

/* 基础样式重置 */
page {
  background-color: #0c0a15;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 全局渐变背景 */
.app-background {
  background-color: #0c0a15;
  background-image:
    radial-gradient(at 20% 20%, hsla(212, 40%, 15%, 1) 0px, transparent 50%),
    radial-gradient(at 80% 80%, hsla(282, 40%, 15%, 1) 0px, transparent 50%);
  min-height: 100vh;
}

/* 滚动条样式（H5） */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.4);
  border-radius: 3px;

  &:hover {
    background: rgba(59, 130, 246, 0.6);
  }
}

/* 通用工具类 */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 统一动画效果 */
/* 淡入效果 */
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滑入效果 */
.slide-in-up {
  animation: slideInUp 0.5s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-in-down {
  animation: slideInDown 0.5s ease-out;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-in-left {
  animation: slideInLeft 0.5s ease-out;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.slide-in-right {
  animation: slideInRight 0.5s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 缩放效果 */
.scale-in {
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 旋转效果 */
.rotate {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 弹跳效果 */
.bounce {
  animation: bounce 0.6s ease-out;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}

/* 过渡效果 */
.transition-all {
  transition: all 0.3s ease;
}

.transition-transform {
  transition: transform 0.3s ease;
}

.transition-opacity {
  transition: opacity 0.3s ease;
}

.transition-background {
  transition: background-color 0.3s ease;
}

.transition-color {
  transition: color 0.3s ease;
}

/* 悬停效果 */
.hover-lift {
  transition: all 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.hover-scale {
  transition: all 0.3s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}

/* 点击反馈效果 */
.click-feedback:active {
  transform: scale(0.95);
  opacity: 0.8;
  transition: all 0.15s ease;
}

/* 卡片阴影效果 */
.card-shadow {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15),
              0 0 40px rgba(59, 130, 246, 0.05);
}

/* 按钮点击效果 */
.btn-active {
  transform: scale(0.98);
  opacity: 0.9;
}

/* 安全区域适配 */
.safe-area-inset-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
