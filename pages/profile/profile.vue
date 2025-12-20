<template>
  <view class="page-profile app-background">
    <!-- 个人信息卡片 -->
    <view class="profile-header card-entrance">
      <view class="profile-bg"></view>
      <view class="profile-content">
        <!-- 左侧头像区域 -->
        <view class="avatar-container" @tap="changeAvatar">
          <image
            :src="userInfo.avatar"
            mode="aspectFill"
            class="avatar"
          ></image>
          <view class="avatar-edit">
            <text class="edit-icon">📷</text>
          </view>
        </view>

        <!-- 右侧个人信息和成就区域 -->
        <view class="profile-info">
          <!-- 用户名 -->
          <text class="user-name count-animation">{{ userInfo.name }}</text>

          <!-- 所有成就徽章并排放置 -->
          <view class="user-badges">
            <view class="badge-item" :style="{ background: badge.color }" v-for="badge in userInfo.badges" :key="badge.id">
              <text class="badge-icon">{{ badge.icon }}</text>
              <text class="badge-text">{{ badge.text }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 训练统计 -->
    <view class="stats-overview">
      <view
        v-for="stat in stats"
        :key="stat.id"
        class="stat-overview-item"
        @tap="viewStatDetail(stat)"
      >
        <text class="stat-value">{{ stat.value }}</text>
        <text class="stat-label">{{ stat.label }}</text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <se-card title="功能" class="mt-40">
      <view class="menu-list">
        <view
          v-for="menu in menuItems"
          :key="menu.id"
          class="menu-item"
          :class="{ 'menu-item--divider': menu.divider }"
          @tap="handleMenuClick(menu)"
        >
          <view class="menu-left">
            <view class="menu-icon" :style="{ background: menu.iconBg }">
              <text>{{ menu.icon }}</text>
            </view>
            <text class="menu-title">{{ menu.title }}</text>
          </view>
          <view class="menu-right">
            <text v-if="menu.value" class="menu-value">{{ menu.value }}</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>
      </view>
    </se-card>

    <!-- 设置选项 -->
    <se-card title="设置" class="mt-32">
      <view class="settings-list">
        <view
          v-for="setting in settings"
          :key="setting.id"
          class="setting-item"
        >
          <view class="setting-left">
            <text class="setting-title">{{ setting.title }}</text>
            <text v-if="setting.desc" class="setting-desc">{{ setting.desc }}</text>
          </view>
          <view class="setting-right">
            <!-- 开关按钮 -->
            <view
              v-if="setting.type === 'toggle'"
              class="toggle-switch"
              :class="{ 'toggle-switch--active': setting.value }"
              @tap="toggleSetting(setting.id)"
            >
              <view class="toggle-thumb"></view>
            </view>

            <!-- 选择器 -->
            <picker
              v-else-if="setting.type === 'picker'"
              :range="setting.options"
              :value="setting.value"
              @change="handlePickerChange($event, setting.id)"
            >
              <view class="picker-value">
                <text>{{ setting.options[setting.value] }}</text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>
          </view>
        </view>
      </view>
    </se-card>

    <!-- 账号管理 -->
    <se-card title="账号" class="mt-32">
      <view class="account-list">
        <view class="account-item" @tap="editProfile">
          <text class="account-title">编辑个人资料</text>
          <text class="account-arrow">›</text>
        </view>
        <view class="account-item" @tap="changePassword">
          <text class="account-title">修改密码</text>
          <text class="account-arrow">›</text>
        </view>
        <view class="account-item" @tap="exportData">
          <text class="account-title">导出数据</text>
          <text class="account-arrow">›</text>
        </view>
        <view class="account-item account-item--danger" @tap="logout">
          <text class="account-title">退出登录</text>
        </view>
      </view>
    </se-card>

    <!-- 关于 -->
    <view class="about-section">
      <text class="about-text">Sword Edge v1.0.0</text>
      <text class="about-text">Sword Edge © 2025</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { authAPI, settingsAPI } from '@/utils/api.js'
import SeCard from '@/components/se-card/se-card.vue'

// 用户信息
const userInfo = ref({
  name: '剑客001',
  avatar: '/static/images/avatar-default.png',
  bio: '中级训练者 · 连续训练12天',
  badges: [
    { id: 1, icon: '🏆', text: '中级', color: 'rgba(59, 130, 246, 0.2)' },
    { id: 2, icon: '🔥', text: '12天', color: 'rgba(245, 158, 11, 0.2)' },
    { id: 3, icon: '⭐', text: 'Lv.5', color: 'rgba(16, 185, 129, 0.2)' }
  ]
})

// 统计数据
const stats = ref([
  { id: 1, label: '训练次数', value: '156' },
  { id: 2, label: '累计时长', value: '45h' },
  { id: 3, label: '平均评分', value: '89' },
  { id: 4, label: '经验值', value: '1250' }
])

// 功能菜单
const menuItems = ref([
  {
    id: 1,
    icon: '📊',
    iconBg: 'rgba(59, 130, 246, 0.2)',
    title: '训练报告',
    value: '',
    action: 'report'
  },
  {
    id: 2,
    icon: '🏆',
    iconBg: 'rgba(245, 158, 11, 0.2)',
    title: '成就徽章',
    value: '12个',
    action: 'achievements'
  },
  {
    id: 3,
    icon: '📈',
    iconBg: 'rgba(16, 185, 129, 0.2)',
    title: '数据统计',
    value: '',
    action: 'statistics'
  },
  {
    id: 4,
    icon: '🎯',
    iconBg: 'rgba(236, 72, 153, 0.2)',
    title: '训练目标',
    value: '',
    action: 'goals',
    divider: true
  },
  {
    id: 5,
    icon: '⚙️',
    iconBg: 'rgba(100, 116, 139, 0.2)',
    title: '设备管理',
    value: '',
    action: 'devices'
  },
  {
    id: 6,
    icon: '📱',
    iconBg: 'rgba(6, 182, 212, 0.2)',
    title: '分享应用',
    value: '',
    action: 'share'
  },
  {
    id: 7,
    icon: '💬',
    iconBg: 'rgba(168, 85, 247, 0.2)',
    title: '意见反馈',
    value: '',
    action: 'feedback'
  },
  {
    id: 8,
    icon: 'ℹ️',
    iconBg: 'rgba(71, 85, 105, 0.2)',
    title: '关于我们',
    value: '',
    action: 'about'
  }
])

// 设置选项
const settings = ref([
  {
    id: 'voice',
    title: '语音指导',
    desc: '训练过程中提供语音提示',
    type: 'toggle',
    value: true
  },
  {
    id: 'vibration',
    title: '震动反馈',
    desc: '动作检测时震动提醒',
    type: 'toggle',
    value: true
  },
  {
    id: 'autoSave',
    title: '自动保存',
    desc: '自动保存训练视频',
    type: 'toggle',
    value: false
  },
  {
    id: 'quality',
    title: '视频质量',
    desc: '',
    type: 'picker',
    options: ['标清', '高清', '超清'],
    value: 1
  }
])

// 更换头像
const changeAvatar = () => {
  // 选择图片
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      // 上传图片
      uploadAvatar(tempFilePath)
    },
    fail: (err) => {
      console.error('选择图片失败:', err)
    }
  })
}

// 上传头像
const uploadAvatar = (filePath) => {
  uni.showLoading({
    title: '上传中...',
    mask: true
  })
  
  // 使用uni.uploadFile上传图片
    uni.uploadFile({
      url: `${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://api.swordedge.com'}/api/users/avatar`,
    filePath,
    name: 'avatar',
    header: {
      'Authorization': `Bearer ${uni.getStorageSync('token')}`
    },
    success: (res) => {
      try {
        const data = JSON.parse(res.data)
        if (res.statusCode === 200 && data.success) {
          // 上传成功，更新头像
          userInfo.value.avatar = data.avatar_url || filePath // 优先使用后端返回的URL，否则使用本地路径
          // 保存到本地
          const currentUserInfo = uni.getStorageSync('userInfo') || {}
          currentUserInfo.avatar = userInfo.value.avatar
          uni.setStorageSync('userInfo', currentUserInfo)
          
          uni.showToast({
            title: '头像更新成功',
            icon: 'success'
          })
        } else {
          throw new Error(data.message || '上传失败')
        }
      } catch (error) {
        console.error('解析上传结果失败:', error)
        uni.showToast({
          title: '上传失败',
          icon: 'none'
        })
      }
    },
    fail: (err) => {
      console.error('上传头像失败:', err)
      uni.showToast({
        title: '网络错误，上传失败',
        icon: 'none'
      })
    },
    complete: () => {
      uni.hideLoading()
    }
  })
}

// 查看统计详情
const viewStatDetail = (stat) => {
  uni.navigateTo({
    url: `/pages/profile/statistics?type=${stat.id}`
  })
}

// 菜单点击
const handleMenuClick = (menu) => {
  switch (menu.action) {
    case 'report':
      uni.navigateTo({ url: '/pages/profile/report' })
      break
    case 'achievements':
      uni.navigateTo({ url: '/pages/profile/achievements' })
      break
    case 'statistics':
      uni.navigateTo({ url: '/pages/profile/statistics' })
      break
    case 'goals':
      uni.navigateTo({ url: '/pages/profile/goals' })
      break
    case 'devices':
      uni.navigateTo({ url: '/pages/profile/devices' })
      break
    case 'share':
      shareApp()
      break
    case 'feedback':
      uni.navigateTo({ url: '/pages/profile/feedback' })
      break
    case 'about':
      uni.navigateTo({ url: '/pages/profile/about' })
      break
  }
}

// 切换设置
const toggleSetting = async (settingId) => {
  const setting = settings.value.find(s => s.id === settingId)
  if (setting) {
    setting.value = !setting.value

    // 震动反馈
    if (setting.value) {
      uni.vibrateShort()
    }

    // 保存设置
    try {
      await settingsAPI.updateSettings({
        [settingId]: setting.value
      })
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }
}

// 选择器变化
const handlePickerChange = async (e, settingId) => {
  const setting = settings.value.find(s => s.id === settingId)
  if (setting) {
    setting.value = e.detail.value

    // 保存设置
    try {
      await settingsAPI.updateSettings({
        [settingId]: setting.value
      })
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }
}

// 编辑个人资料
const editProfile = () => {
  uni.navigateTo({
    url: '/pages/profile/edit'
  })
}

// 修改密码
const changePassword = () => {
  uni.navigateTo({
    url: '/pages/profile/password'
  })
}

// 导出数据
const exportData = async () => {
  try {
    const result = await uni.showModal({
      title: '导出数据',
      content: '确定要导出所有训练数据吗？',
      confirmText: '确定',
      cancelText: '取消'
    })

    if (result.confirm) {
      uni.showLoading({ title: '导出中...' })

      // 调用导出 API
      await settingsAPI.exportData()

      uni.hideLoading()
      uni.showToast({
        title: '导出成功',
        icon: 'success'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('导出失败:', error)
    uni.showToast({
      title: '导出失败',
      icon: 'none'
    })
  }
}

// 分享应用
const shareApp = () => {
  uni.share({
    provider: 'weixin',
    scene: 'WXSceneSession',
    type: 0,
    title: 'Sword Edge - 智能剑术训练系统',
    summary: '专业的剑术训练分析与指导平台',
    success: () => {
      uni.showToast({
        title: '分享成功',
        icon: 'success'
      })
    },
    fail: () => {
      uni.showToast({
        title: '分享功能开发中',
        icon: 'none'
      })
    }
  })
}

// 退出登录
const logout = async () => {
  try {
    const result = await uni.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmText: '确定',
      cancelText: '取消'
    })

    if (result.confirm) {
      uni.showLoading({ title: '退出中...' })

      try {
        // 调用退出 API
        await authAPI.logout()
      } catch (apiError) {
        // API 请求失败不影响本地退出
        console.warn('退出 API 请求失败，执行本地退出:', apiError)
      }

      // 清除本地数据（无论 API 是否成功，都执行本地退出）
      uni.removeStorageSync('token')
      uni.removeStorageSync('userInfo')

      uni.hideLoading()

      // 跳转到登录页
      uni.redirectTo({
        url: '/pages/login/login'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('退出失败:', error)
    uni.showToast({
      title: '退出失败',
      icon: 'none'
    })
  }
}
</script>

<style lang="scss" scoped>
.page-profile {
  min-height: 100vh;
  padding: 0 24rpx 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

/* 个人信息头部 */
.profile-header {
  position: relative;
  height: 240rpx;
  margin-bottom: 12rpx;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.profile-bg {
  height: 240rpx;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(16, 185, 129, 0.25), rgba(168, 85, 247, 0.25));
  border-bottom-left-radius: 36rpx;
  border-bottom-right-radius: 36rpx;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: welcome-shine 3s infinite;
  }
}

.profile-content {
  position: absolute;
  top: 50rpx;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 24rpx;
  z-index: 10;
}

.avatar-container {
  position: relative;
  margin-right: 32rpx;
  margin-left: 16rpx;
  margin-bottom: 0;
  flex-shrink: 0;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(12, 10, 21, 0.9);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25), 0 0 20px rgba(59, 130, 246, 0.15);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3), 0 0 30px rgba(59, 130, 246, 0.25);
  }
}

.avatar-edit {
  position: absolute;
  bottom: 2rpx;
  right: 2rpx;
  width: 36rpx;
  height: 36rpx;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid rgba(12, 10, 21, 0.9);
  box-shadow: 0 3px 8px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
  }
}

.edit-icon {
  font-size: 18rpx;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.user-name {
  font-size: 38rpx;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 12rpx;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #3b82f6, #06b6d4, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.user-badges {
  display: flex;
  flex-wrap: nowrap;
  gap: 12rpx;
  overflow-x: auto;
  padding-bottom: 8rpx;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.badge-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
  flex-shrink: 0;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  }
}

.badge-icon {
  font-size: 20rpx;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
}

.badge-text {
  font-size: 20rpx;
  color: #ffffff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 卡片进入动画 */
@keyframes card-entrance {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-entrance {
  animation: card-entrance 0.5s ease forwards;
}

/* 数字变化动画 */
@keyframes count-up {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.count-animation {
  animation: count-up 0.5s ease;
}

/* 欢迎区域光泽动画 */
@keyframes welcome-shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* 统计概览 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
  padding: 0;
  margin-top: 12rpx;
  margin-bottom: 20rpx;
  position: relative;
  z-index: 20;
}

.stat-overview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 8rpx;
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(71, 85, 105, 0.2);
  border-radius: 12rpx;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.95);
    background: rgba(17, 24, 39, 0.95);
  }
}

.stat-value {
  font-size: 28rpx;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 6rpx;
  line-height: 1;
}

.stat-label {
  font-size: 18rpx;
  color: #94a3b8;
  text-align: center;
}

/* 功能菜单 */
.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1px solid rgba(71, 85, 105, 0.1);
  transition: all 0.3s ease;
  transform: translateX(0);
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &--divider {
    border-bottom: 1px solid rgba(71, 85, 105, 0.3);
  }

  &:hover {
    transform: translateX(10rpx);
    background: rgba(59, 130, 246, 0.05);
  }

  &:active {
    opacity: 0.8;
    transform: translateX(10rpx) scale(0.98);
  }
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.menu-icon {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  border-radius: 10rpx;
}

.menu-title {
  font-size: 26rpx;
  color: #e2e8f0;
}

.menu-right {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.menu-value {
  font-size: 22rpx;
  color: #94a3b8;
}

.menu-arrow {
  font-size: 36rpx;
  color: #64748b;
  font-weight: 300;
}

/* 设置列表 */
.settings-list {
  display: flex;
  flex-direction: column;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1px solid rgba(71, 85, 105, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: rgba(59, 130, 246, 0.05);
  }
  
  &:active {
    opacity: 0.8;
  }
}

.setting-left {
  flex: 1;
}

.setting-title {
  display: block;
  font-size: 26rpx;
  color: #e2e8f0;
  margin-bottom: 3rpx;
}

.setting-desc {
  display: block;
  font-size: 20rpx;
  color: #64748b;
}

.setting-right {
  flex-shrink: 0;
}

/* 开关按钮 */
.toggle-switch {
  position: relative;
  width: 80rpx;
  height: 44rpx;
  background: rgba(71, 85, 105, 0.5);
  border-radius: 22rpx;
  transition: all 0.3s ease;
  cursor: pointer;

  &--active {
    background: linear-gradient(90deg, #3b82f6, #06b6d4);
  }
}

.toggle-thumb {
  position: absolute;
  top: 3rpx;
  left: 3rpx;
  width: 38rpx;
  height: 38rpx;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;

  .toggle-switch--active & {
    transform: translateX(36rpx);
  }
}

/* 选择器 */
.picker-value {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 24rpx;
  color: #94a3b8;
}

.picker-arrow {
  font-size: 36rpx;
  color: #64748b;
  font-weight: 300;
}

/* 账号列表 */
.account-list {
  display: flex;
  flex-direction: column;
}

.account-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1px solid rgba(71, 85, 105, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    transform: translateX(10rpx);
    background: rgba(59, 130, 246, 0.05);
  }

  &:active {
    opacity: 0.8;
    transform: translateX(10rpx) scale(0.98);
  }

  &--danger {
    .account-title {
      color: #ef4444;
    }
    
    &:hover {
      background: rgba(239, 68, 68, 0.05);
    }
  }
}

.account-title {
  font-size: 26rpx;
  color: #e2e8f0;
}

.account-arrow {
  font-size: 36rpx;
  color: #64748b;
  font-weight: 300;
}

/* 关于区域 */
.about-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 24rpx 24rpx;
  text-align: center;
}

.about-text {
  font-size: 22rpx;
  color: #64748b;
  margin-bottom: 8rpx;
  line-height: 1.4;
}

/* 卡片组件间距优化 */
.se-card {
  margin-bottom: 20rpx;
  
  &.mt-40 {
    margin-top: 20rpx;
  }
  
  &.mt-32 {
    margin-top: 16rpx;
  }
}
</style>
