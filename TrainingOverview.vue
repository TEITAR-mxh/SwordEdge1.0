<!-- 训练总览页面 -->
<template>
  <AppLayout active-menu="训练总览">
    <!-- 页面标题 -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h2 class="text-3xl sm:text-4xl text-white font-bold">训练总览</h2>
        <p class="text-gray-400 text-sm sm:text-base">Sword Edge v1.0 -- 数据实时同步</p>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div 
        v-for="(stat, index) in stats" 
        :key="index"
        class="stat-card bg-gray-800/50 border border-gray-700/80 p-6 rounded-2xl backdrop-blur-md"
      >
        <div class="flex items-center justify-between mb-2">
          <component :is="stat.icon" class="h-8 w-8 text-blue-400" />
        </div>
        <div class="text-3xl font-bold text-white mb-1">{{ stat.value }}</div>
        <div class="text-gray-400 text-sm">{{ stat.label }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 左侧：成就系统 + 最近训练记录 -->
      <div class="lg:col-span-2 space-y-8">
        <!-- 成就系统 -->
        <div class="achievements-section bg-gray-800/50 border border-gray-700/80 p-6 rounded-2xl backdrop-blur-md">
          <h3 class="text-xl text-white mb-6 flex items-center">
            <Award class="h-6 w-6 mr-2 text-yellow-400" />
            成就系统
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="achievement in achievements"
              :key="achievement.id"
              :class="[
                'achievement-card p-4 rounded-lg border transition-all cursor-pointer',
                achievement.unlocked 
                  ? 'bg-gradient-to-br from-yellow-900/30 to-gray-800/30 border-yellow-600/50 hover:border-yellow-500' 
                  : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
              ]"
            >
              <div class="flex items-start space-x-3">
                <div :class="[
                  'text-3xl',
                  achievement.unlocked ? 'grayscale-0' : 'grayscale opacity-50'
                ]">
                  {{ achievement.icon }}
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <h4 :class="[
                      'font-bold',
                      achievement.unlocked ? 'text-yellow-300' : 'text-gray-400'
                    ]">
                      {{ achievement.name }}
                    </h4>
                    <span 
                      v-if="achievement.unlocked"
                      class="text-xs px-2 py-1 bg-yellow-600/30 text-yellow-300 rounded"
                    >
                      已解锁
                    </span>
                  </div>
                  <p class="text-xs text-gray-400 mb-2">{{ achievement.description }}</p>
                  <div class="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      :class="[
                        'h-2 rounded-full transition-all',
                        achievement.unlocked ? 'bg-yellow-500' : 'bg-blue-500'
                      ]"
                      :style="{ width: achievement.progress + '%' }"
                    ></div>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">{{ achievement.progress }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近训练记录 -->
        <div class="recent-training bg-gray-800/50 border border-gray-700/80 p-6 rounded-2xl backdrop-blur-md">
          <h3 class="text-xl text-white mb-6 flex items-center">
            <History class="h-6 w-6 mr-2 text-blue-400" />
            最近训练记录
          </h3>
          <div class="space-y-3">
            <div
              v-for="record in recentTraining"
              :key="record.id"
              @click="goToAnalysis(record.id)"
              class="flex items-center justify-between p-4 rounded-lg bg-gray-900/50 hover:bg-gray-700/50 cursor-pointer transition-all"
            >
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-1">
                  <Activity class="h-5 w-5 text-blue-400" />
                  <span class="font-bold text-white">{{ record.type }}</span>
                </div>
                <div class="text-sm text-gray-400">{{ record.date }}</div>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-white mb-1">{{ record.score }}</div>
                <div class="text-xs text-gray-400">{{ record.duration }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：训练日历 -->
      <div class="lg:col-span-1">
        <div class="calendar-section bg-gray-800/50 border border-gray-700/80 p-6 rounded-2xl backdrop-blur-md">
          <h3 class="text-xl text-white mb-6 flex items-center">
            <Calendar class="h-6 w-6 mr-2 text-green-400" />
            训练日历
          </h3>
          
          <!-- 月份导航 -->
          <div class="flex items-center justify-between mb-4">
            <button 
              @click="previousMonth"
              class="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <ChevronLeft class="h-5 w-5 text-gray-400" />
            </button>
            <div class="text-white font-bold">{{ currentMonthYear }}</div>
            <button 
              @click="nextMonth"
              class="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <ChevronRight class="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <!-- 星期标题 -->
          <div class="grid grid-cols-7 gap-1 mb-2">
            <div 
              v-for="day in weekDays" 
              :key="day"
              class="text-center text-xs text-gray-400 py-1"
            >
              {{ day }}
            </div>
          </div>

          <!-- 日历格子 -->
          <div class="grid grid-cols-7 gap-1">
            <div
              v-for="(day, index) in calendarDays"
              :key="index"
              @click="selectDay(day)"
              :class="[
                'aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer transition-all',
                !day.currentMonth ? 'text-gray-600' : 'text-gray-300',
                day.isToday ? 'ring-2 ring-blue-500' : '',
                day.hasTraining ? getIntensityClass(day.intensity) : 'hover:bg-gray-700/50',
                selectedDay?.date === day.date ? 'ring-2 ring-white' : ''
              ]"
            >
              {{ day.day }}
            </div>
          </div>

          <!-- 训练强度说明 -->
          <div class="mt-4 pt-4 border-t border-gray-700">
            <div class="text-xs text-gray-400 mb-2">训练强度</div>
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-1">
                <div class="w-4 h-4 bg-green-900/50 rounded"></div>
                <span class="text-xs text-gray-400">低</span>
              </div>
              <div class="flex items-center space-x-1">
                <div class="w-4 h-4 bg-blue-700/50 rounded"></div>
                <span class="text-xs text-gray-400">中</span>
              </div>
              <div class="flex items-center space-x-1">
                <div class="w-4 h-4 bg-purple-600/50 rounded"></div>
                <span class="text-xs text-gray-400">高</span>
              </div>
            </div>
          </div>

          <!-- 选中日期的详情 -->
          <div v-if="selectedDay && selectedDay.hasTraining" class="mt-4 pt-4 border-t border-gray-700">
            <div class="text-sm text-gray-400 mb-2">{{ selectedDay.date }}</div>
            <div class="space-y-1">
              <div class="flex justify-between text-sm">
                <span class="text-gray-400">得分</span>
                <span class="text-white font-bold">{{ selectedDay.score }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-400">时长</span>
                <span class="text-white font-bold">{{ selectedDay.duration }}分钟</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { gsap } from 'gsap';
import { 
  Clock, TrendingUp, Target, Timer, Award, History, 
  Calendar, Activity, ChevronLeft, ChevronRight 
} from 'lucide-vue-next';
import AppLayout from '../components/AppLayout.vue';
import { overviewData } from '../utils/mockData.js';

const router = useRouter();

/**
 * 统计数据
 */
const stats = [
  {
    label: '今日训练时长',
    value: overviewData.stats.todayDuration,
    icon: Clock
  },
  {
    label: '本周训练次数',
    value: overviewData.stats.weeklyCount,
    icon: TrendingUp
  },
  {
    label: '平均得分',
    value: overviewData.stats.averageScore,
    icon: Target
  },
  {
    label: '总训练时间',
    value: overviewData.stats.totalDuration,
    icon: Timer
  }
];

/**
 * 成就数据
 */
const achievements = ref(overviewData.achievements);

/**
 * 最近训练记录
 */
const recentTraining = ref(overviewData.recentTraining);

/**
 * 日历相关数据
 */
const currentDate = ref(new Date());
const selectedDay = ref(null);
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

/**
 * 当前月份年份显示
 */
const currentMonthYear = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth() + 1;
  return `${year}年${month}月`;
});

/**
 * 生成日历天数数组
 */
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  
  // 当月第一天
  const firstDay = new Date(year, month, 1);
  const firstDayWeek = firstDay.getDay();
  
  // 当月最后一天
  const lastDay = new Date(year, month + 1, 0);
  const lastDate = lastDay.getDate();
  
  // 上个月的最后几天
  const prevMonthLastDay = new Date(year, month, 0);
  const prevMonthLastDate = prevMonthLastDay.getDate();
  
  const days = [];
  
  // 填充上个月的日期
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDate - i);
    days.push(createDayObject(date, false));
  }
  
  // 填充当月日期
  for (let i = 1; i <= lastDate; i++) {
    const date = new Date(year, month, i);
    days.push(createDayObject(date, true));
  }
  
  // 填充下个月的日期
  const remainingDays = 42 - days.length; // 6行 x 7列
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push(createDayObject(date, false));
  }
  
  return days;
});

/**
 * 创建日期对象
 */
function createDayObject(date, currentMonth) {
  const dateStr = date.toISOString().split('T')[0];
  const today = new Date();
  const isToday = dateStr === today.toISOString().split('T')[0];
  
  // 从模拟数据中查找训练数据
  const trainingData = overviewData.calendar.find(d => d.date === dateStr);
  
  return {
    day: date.getDate(),
    date: dateStr,
    currentMonth,
    isToday,
    hasTraining: trainingData?.hasTraining || false,
    intensity: trainingData?.intensity || 0,
    score: trainingData?.score || 0,
    duration: trainingData?.duration || 0
  };
}

/**
 * 获取训练强度对应的样式类
 */
function getIntensityClass(intensity) {
  switch (intensity) {
    case 1:
      return 'bg-green-900/50 hover:bg-green-800/50 text-white';
    case 2:
      return 'bg-blue-700/50 hover:bg-blue-600/50 text-white';
    case 3:
      return 'bg-purple-600/50 hover:bg-purple-500/50 text-white';
    default:
      return 'hover:bg-gray-700/50';
  }
}

/**
 * 选择日期
 */
function selectDay(day) {
  if (day.currentMonth) {
    selectedDay.value = day;
  }
}

/**
 * 上一个月
 */
function previousMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  );
}

/**
 * 下一个月
 */
function nextMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  );
}

/**
 * 跳转到分析页面
 */
function goToAnalysis(recordId) {
  // 这里可以传递记录ID作为参数
  router.push('/analysis');
}

/**
 * 页面加载动画
 */
onMounted(() => {
  gsap.from('.stat-card', {
    duration: 0.6,
    opacity: 0,
    y: 30,
    stagger: 0.1
  });
  
  gsap.from('.achievements-section, .recent-training, .calendar-section', {
    duration: 0.8,
    opacity: 0,
    y: 50,
    stagger: 0.15,
    delay: 0.3
  });
});
</script>

