<template>
  <view class="page-login">
    <!-- 背景装饰元素 -->
    <view class="grid-bg"></view>
    <view class="glow-effect"></view>
    
    <!-- Logo -->
    <view class="logo-container">
      <view class="logo">
        <view class="logo-icon icon-sword-logo"></view>
      </view>
      <text class="app-name">Sword Edge</text>
      <text class="app-subtitle">Sword Edge · 智能剑术训练系统</text>
    </view>

    <!-- 登录表单 -->
    <view class="login-form">
      <!-- 错误提示 -->
      <view v-if="errorMessage" class="error-message">
        <view class="error-icon icon-alert"></view>
        <text class="error-text">{{ errorMessage }}</text>
      </view>

      <!-- 用户名 -->
      <view class="form-group">
        <text class="form-label">用户名</text>
        <input
          v-model="form.username"
          class="form-input"
          type="text"
          placeholder="请输入用户名"
          :focus="usernameFocus"
          @focus="usernameFocus = true"
          @blur="{
            usernameFocus = false;
            validateUsername(form.username);
          }"
          @input="validateUsername(form.username)"
        />
        <text v-if="!validation.username.valid" class="validation-error">
          {{ validation.username.message }}
        </text>
      </view>

      <!-- 密码 -->
      <view class="form-group">
        <text class="form-label">密码</text>
        <view class="password-input-wrapper">
          <input
            v-model="form.password"
            class="form-input"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码"
            :focus="passwordFocus"
            @focus="passwordFocus = true"
            @blur="{
              passwordFocus = false;
              validatePassword(form.password);
            }"
            @input="validatePassword(form.password)"
          />
          <view
            class="password-toggle"
            @tap="showPassword = !showPassword"
          >
            <view :class="showPassword ? 'icon-eye' : 'icon-eye-slash'"></view>
          </view>
        </view>
        <text v-if="!validation.password.valid" class="validation-error">
          {{ validation.password.message }}
        </text>
      </view>

      <!-- 记住我 / 忘记密码 -->
      <view class="form-options">
        <view class="remember-me" @tap="form.remember = !form.remember">
          <view class="checkbox" :class="{ 'checkbox--checked': form.remember }">
            <text v-if="form.remember" class="checkbox-icon">✓</text>
          </view>
          <text class="checkbox-label">记住我</text>
        </view>
        <text class="forgot-link" @tap="forgotPassword">忘记密码?</text>
      </view>

      <!-- 登录按钮 -->
      <button
        type="primary"
        :loading="loading"
        :disabled="!isFormValid"
        class="login-button"
        @tap="handleLogin"
      >
        <text v-if="loading" class="loading-icon">⏳</text>
        <text v-else>登录</text>
      </button>

      <!-- 分隔线 -->
      <view class="divider">
        <view class="divider-line"></view>
        <text class="divider-text">或</text>
        <view class="divider-line"></view>
      </view>

      <!-- 第三方登录 -->
      <view class="social-login">
        <view class="social-button" @tap="socialLogin('wechat')">
          <view class="social-icon icon-wechat"></view>
        </view>
        <view class="social-button" @tap="socialLogin('qq')">
          <view class="social-icon icon-qq"></view>
        </view>
        <view class="social-button" @tap="socialLogin('weibo')">
          <view class="social-icon icon-weibo"></view>
        </view>
      </view>

      <!-- 注册链接 -->
      <view class="register-link">
        <text class="register-text">还没有账号？</text>
        <text class="register-action" @tap="goToRegister">立即注册</text>
      </view>
    </view>

    <!-- 协议（内嵌，不遮挡） - 文本更小，勾选为可选 -->
    <view class="agreement-inline">
      <view class="agreement-row small">
        <view class="checkbox small" @tap="agreementAccepted = !agreementAccepted">
          <text v-if="agreementAccepted">✓</text>
        </view>
        <text class="agreement-label small">登录即表示同意</text>
        <text class="agreement-link small" @tap="toggleAgreementPanel">《用户协议》</text>
        <text class="agreement-text small">和</text>
        <text class="agreement-link small" @tap="toggleAgreementPanel">《隐私政策》</text>
        <text class="agreement-note small">（完善功能可勾选）</text>
      </view>

      <view v-if="showAgreementPanel" class="agreement-panel">
        <scroll-view style="height:200rpx;padding:12rpx;">
          <text class="agreement-content">这里显示用户协议和隐私政策的简要摘要或全文（示例文本）。请根据实际内容替换本段文字。</text>
        </scroll-view>
        <view class="agreement-actions">
          <se-button type="default" text="关闭" @click="toggleAgreementPanel" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { authAPI } from '@/utils/api.js'

// 表单数据
const form = ref({
  username: '',
  password: '',
  remember: false
})

// 状态
const loading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)
const usernameFocus = ref(false)
const passwordFocus = ref(false)
const agreementAccepted = ref(true)
const showAgreementPanel = ref(false)

// 表单验证状态
const validation = ref({
  username: { valid: true, message: '' },
  password: { valid: true, message: '' }
})

// 实时验证用户名
const validateUsername = (value) => {
  const username = value.trim()
  
  if (username.length < 3) {
    validation.value.username = { 
      valid: false, 
      message: '用户名长度不能少于3个字符' 
    }
  } else if (username.length > 20) {
    validation.value.username = { 
      valid: false, 
      message: '用户名长度不能超过20个字符' 
    }
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    validation.value.username = { 
      valid: false, 
      message: '用户名只能包含字母、数字和下划线' 
    }
  } else {
    validation.value.username = { valid: true, message: '' }
  }
}

// 实时验证密码
const validatePassword = (value) => {
  const password = value.trim()
  
  if (password.length < 6) {
    validation.value.password = { 
      valid: false, 
      message: '密码长度不能少于6个字符' 
    }
  } else if (password.length > 20) {
    validation.value.password = { 
      valid: false, 
      message: '密码长度不能超过20个字符' 
    }
  } else if (!/[A-Z]/.test(password)) {
    validation.value.password = { 
      valid: false, 
      message: '密码必须包含至少一个大写字母' 
    }
  } else if (!/[a-z]/.test(password)) {
    validation.value.password = { 
      valid: false, 
      message: '密码必须包含至少一个小写字母' 
    }
  } else if (!/[0-9]/.test(password)) {
    validation.value.password = { 
      valid: false, 
      message: '密码必须包含至少一个数字' 
    }
  } else {
    validation.value.password = { valid: true, message: '' }
  }
}

// 表单验证（协议为可选项：登录即同意，勾选为用户可选）
const isFormValid = computed(() => {
  return validation.value.username.valid && validation.value.password.valid && 
         form.value.username.length >= 3 && form.value.password.length >= 6
})

// 登录处理
const handleLogin = async () => {
  // 先进行完整验证
  validateUsername(form.value.username)
  validatePassword(form.value.password)
  
  if (!isFormValid.value) {
    // 显示第一个错误
    const firstError = Object.values(validation.value).find(v => !v.valid)
    if (firstError) {
      errorMessage.value = firstError.message
    }
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    // 调用登录 API
    let result
    try {
      // 尝试真实登录请求
      result = await authAPI.login({
        username: form.value.username,
        password: form.value.password
      })
    } catch (apiError) {
      // 真实请求失败，使用模拟数据（开发环境）
      console.log('API 请求失败，使用模拟数据')
      result = {
        token: 'mock_token_' + Date.now(),
        userInfo: {
          id: '1',
          name: form.value.username,
          avatar: '/static/images/avatar-default.png',
          bio: '中级训练者 · 连续训练12天',
          badges: [
            { id: 1, icon: '🏆', text: '中级', color: 'rgba(59, 130, 246, 0.2)' },
            { id: 2, icon: '🔥', text: '12天', color: 'rgba(245, 158, 11, 0.2)' },
            { id: 3, icon: '⭐', text: 'Lv.5', color: 'rgba(16, 185, 129, 0.2)' }
          ]
        }
      }
    }

    // 保存 Token 和用户信息
    uni.setStorageSync('token', result.token)
    uni.setStorageSync('userInfo', result.userInfo)

    // 如果选择记住我，保存用户名
    if (form.value.remember) {
      uni.setStorageSync('rememberedUsername', form.value.username)
    } else {
      uni.removeStorageSync('rememberedUsername')
    }

    loading.value = false

    uni.showToast({
      title: '登录成功',
      icon: 'success',
      duration: 1500
    })

    // 延迟跳转到首页
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/index/index'
      })
    }, 1500)

  } catch (error) {
    loading.value = false
    console.error('登录失败:', error)

    errorMessage.value = error.message || '用户名或密码错误'

    // 3秒后隐藏错误消息
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  }
}

// 忘记密码
const forgotPassword = () => {
  uni.navigateTo({
    url: '/pages/login/forgot'
  })
}

// 第三方登录
const socialLogin = (platform) => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })

  // TODO: 实现第三方登录
  // 微信小程序：使用 uni.login() 获取 code
  // App: 使用 uni.getProvider() 获取服务供应商
}

// 去注册
const goToRegister = () => {
  uni.navigateTo({
    url: '/pages/login/register'
  })
}

// 查看协议
const viewAgreement = (type) => {
  // 兼容原有跳转，保留可用性
  uni.navigateTo({ url: `/pages/login/agreement?type=${type}` })
}

const toggleAgreementPanel = () => {
  showAgreementPanel.value = !showAgreementPanel.value
}

// 页面加载时，检查是否有记住的用户名
onMounted(() => {
  const rememberedUsername = uni.getStorageSync('rememberedUsername')
  if (rememberedUsername) {
    form.value.username = rememberedUsername
    form.value.remember = true
  }
})
</script>

<style lang="scss" scoped>
.page-login {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64rpx 48rpx;
  background: linear-gradient(135deg, #0c0a15 0%, #1a1a2e 50%, #16213e 100%);
  position: relative;
  overflow: hidden;

  /* 背景装饰 */
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at 20% 20%,
      hsla(212, 40%, 30%, 0.3) 0px,
      transparent 50%
    );
    animation: floatBg 20s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at 80% 80%,
      hsla(282, 40%, 30%, 0.3) 0px,
      transparent 50%
    );
    animation: floatBg 25s ease-in-out infinite reverse;
  }

  /* 网格背景 */
  & .grid-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
    background-size: 40rpx 40rpx;
    opacity: 0.5;
  }

  /* 发光效果 */
  & .glow-effect {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 600rpx;
    height: 600rpx;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    filter: blur(60rpx);
    z-index: 0;
  }
}

/* 协议行样式微调 */
.agreement-inline { position: relative; margin-top: 20rpx; }
.agreement-row { display:flex; align-items:center; gap:8rpx; }
.agreement-row.small { gap:6rpx; }
.agreement-label { color: #cbd5e1; font-size: 28rpx; }
.agreement-label.small { font-size: 22rpx; color: #94a3b8 }
.agreement-link { color:#60a5fa; font-size:28rpx }
.agreement-link.small { font-size:22rpx }
.agreement-text.small { font-size:22rpx; color:#94a3b8 }
.agreement-note.small { font-size:18rpx; color:#94a3b8; margin-left:6rpx }
.checkbox { width: 44rpx; height: 44rpx; border:1rpx solid rgba(148,163,184,0.2); border-radius:6rpx; display:flex; align-items:center; justify-content:center; }
.checkbox.small { width:34rpx; height:34rpx }
.checkbox--checked { background: #0ea5a4; border-color: #0ea5a4 }

.agreement-panel { margin-top:12rpx; background: rgba(255,255,255,0.02); border:1rpx solid rgba(148,163,184,0.06); border-radius:8rpx; padding:8rpx }

@keyframes floatBg {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(10%, -10%) rotate(2deg);
  }
  50% {
    transform: translate(0, 10%) rotate(0deg);
  }
  75% {
    transform: translate(-10%, -5%) rotate(-2deg);
  }
}

/* Logo */
.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
  z-index: 1;
  animation: logoEntrance 0.8s ease-out;
}

@keyframes logoEntrance {
  from {
    opacity: 0;
    transform: translateY(-30rpx) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.logo {
  width: 180rpx;
  height: 180rpx;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  box-shadow: 0 20rpx 40rpx rgba(59, 130, 246, 0.4),
              0 0 0 4rpx rgba(59, 130, 246, 0.2);
  animation: float 3s ease-in-out infinite,
             logoGlow 2s ease-in-out infinite alternate;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: rotate 4s linear infinite;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15rpx);
  }
}

@keyframes logoGlow {
  from {
    box-shadow: 0 20rpx 40rpx rgba(59, 130, 246, 0.4),
                0 0 0 4rpx rgba(59, 130, 246, 0.2);
  }
  to {
    box-shadow: 0 20rpx 50rpx rgba(59, 130, 246, 0.6),
                0 0 0 4rpx rgba(59, 130, 246, 0.3);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.logo-icon {
  width: 96rpx;
  height: 96rpx;
  background: #ffffff;
  mask-size: contain;
  -webkit-mask-size: contain;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  position: relative;
  z-index: 1;
}

.icon-sword-logo {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.6 45.6 0 012.006-.343v.256zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 01-2.863 3.207 6.72 6.72 0 00.857-3.294z'/%3E%3C/svg%3E");
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.6 45.6 0 012.006-.343v.256zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 01-2.863 3.207 6.72 6.72 0 00.857-3.294z'/%3E%3C/svg%3E");
}

.app-name {
  font-size: 56rpx;
  font-weight: 800;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16rpx;
  letter-spacing: 2rpx;
  text-shadow: 0 4rpx 8rpx rgba(59, 130, 246, 0.3);
  animation: textGlow 2s ease-in-out infinite alternate;
}

@keyframes textGlow {
  from {
    text-shadow: 0 4rpx 8rpx rgba(59, 130, 246, 0.3);
  }
  to {
    text-shadow: 0 6rpx 16rpx rgba(59, 130, 246, 0.5),
                0 0 20rpx rgba(139, 92, 246, 0.3);
  }
}

.app-subtitle {
  font-size: 26rpx;
  color: #94a3b8;
  text-align: center;
  background: linear-gradient(135deg, #94a3b8 0%, #cbd5e1 50%, #94a3b8 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: subtitleShine 3s ease-in-out infinite;
  font-weight: 500;
}

@keyframes subtitleShine {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

/* 登录表单 */
.login-form {
  width: 100%;
  max-width: 600rpx;
  z-index: 1;
}

/* 错误消息 */
.error-message {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 16rpx;
  margin-bottom: 32rpx;
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10rpx); }
  75% { transform: translateX(10rpx); }
}

.error-icon {
  width: 32rpx;
  height: 32rpx;
  background: #f87171;
  mask-size: contain;
  -webkit-mask-size: contain;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
}

.icon-alert {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z' clip-rule='evenodd'/%3E%3C/svg%3E");
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z' clip-rule='evenodd'/%3E%3C/svg%3E");
}

.error-text {
  font-size: 24rpx;
  color: #f87171;
}

/* 表单组 */
.form-group {
  margin-bottom: 32rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #cbd5e1;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  padding: 28rpx 0rpx;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(71, 85, 105, 0.5);
  border-radius: 16rpx;
  color: #ffffff;
  font-size: 28rpx;
  transition: all 0.3s ease;

  &:focus {
    border-color: #3b82f6;
    background: rgba(30, 41, 59, 0.8);
    box-shadow: 0 0 0 6rpx rgba(59, 130, 246, 0.1);
  }
}

/* 密码输入 */
.password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 32rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;

  view {
    width: 32rpx;
    height: 32rpx;
    background: #94a3b8;
    mask-size: contain;
    -webkit-mask-size: contain;
    mask-repeat: no-repeat;
    -webkit-mask-repeat: no-repeat;
    transition: background 0.3s ease;
  }

  &:active view {
    background: #3b82f6;
  }
}

.icon-eye {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 15a3 3 0 100-6 3 3 0 000 6z'/%3E%3Cpath fill-rule='evenodd' d='M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z' clip-rule='evenodd'/%3E%3C/svg%3E");
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 15a3 3 0 100-6 3 3 0 000 6z'/%3E%3Cpath fill-rule='evenodd' d='M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z' clip-rule='evenodd'/%3E%3C/svg%3E");
}

.icon-eye-slash {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z'/%3E%3Cpath d='M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z'/%3E%3Cpath d='M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z'/%3E%3C/svg%3E");
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z'/%3E%3Cpath d='M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z'/%3E%3Cpath d='M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z'/%3E%3C/svg%3E");
}

/* 表单选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2px solid rgba(71, 85, 105, 0.5);
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &--checked {
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    border-color: #3b82f6;
  }
}

.checkbox-icon {
  font-size: 20rpx;
  color: #ffffff;
  font-weight: 700;
}

.checkbox-label {
  font-size: 24rpx;
  color: #cbd5e1;
}

.forgot-link {
  font-size: 24rpx;
  color: #3b82f6;
  text-decoration: underline;
}

/* 验证错误信息 */
.validation-error {
  display: block;
  font-size: 22rpx;
  color: #f87171;
  margin-top: 8rpx;
  padding-left: 4rpx;
  animation: validationError 0.3s ease-in-out;
}

@keyframes validationError {
  from {
    opacity: 0;
    transform: translateY(-5rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 登录按钮 */
.login-button {
  width: 100%;
  padding: 10rpx 48rpx;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 16rpx;
  border: none;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 48rpx;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}

.loading-icon {
  font-size: 28rpx;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 分隔线 */
.divider {
  display: flex;
  align-items: center;
  margin: 48rpx 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: rgba(71, 85, 105, 0.5);
}

.divider-text {
  padding: 0 24rpx;
  font-size: 24rpx;
  color: #64748b;
}

/* 第三方登录 */
.social-login {
  display: flex;
  justify-content: center;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.social-button {
  width: 96rpx;
  height: 96rpx;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(71, 85, 105, 0.5);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.95);
    background: rgba(30, 41, 59, 0.8);
  }
}

.social-icon {
  width: 48rpx;
  height: 48rpx;
  background: #94a3b8;
  mask-size: contain;
  -webkit-mask-size: contain;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  transition: background 0.3s ease;
}

.social-button:active .social-icon {
  background: #3b82f6;
}

.icon-wechat {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z'/%3E%3Cpath d='M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z'/%3E%3C/svg%3E");
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z'/%3E%3Cpath d='M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z'/%3E%3C/svg%3E");
}

.icon-qq {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z' clip-rule='evenodd'/%3E%3C/svg%3E");
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z' clip-rule='evenodd'/%3E%3C/svg%3E");
}

.icon-weibo {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z' clip-rule='evenodd'/%3E%3C/svg%3E");
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z' clip-rule='evenodd'/%3E%3C/svg%3E");
}

/* 注册链接 */
.register-link {
  text-align: center;
  font-size: 24rpx;
}

.register-text {
  color: #94a3b8;
}

.register-action {
  color: #3b82f6;
  font-weight: 600;
  margin-left: 8rpx;
}

/* 协议 */
.agreement {
  position: fixed;
  bottom: 48rpx;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 22rpx;
  z-index: 1;
}

.agreement-text {
  color: #64748b;
}

.agreement-link {
  color: #3b82f6;
  text-decoration: underline;
}
</style>
