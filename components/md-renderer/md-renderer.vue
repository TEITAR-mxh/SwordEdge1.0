<template>
  <view class="md-renderer">
    <rich-text :nodes="renderedContent"></rich-text>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

const renderedContent = computed(() => {
  if (!props.content) return []
  
  let html = props.content
  
  // 处理标题
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
  
  // 处理粗体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // 处理列表
  html = html.replace(/^- (.*$)/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
  
  // 处理换行
  html = html.replace(/\n/g, '<br>')
  
  return [{ name: 'div', attrs: {}, children: [{ type: 'html', text: html }] }]
})
</script>

<style scoped>
.md-renderer {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

h1 {
  font-size: 20px;
  font-weight: bold;
  margin: 16px 0 8px 0;
  color: #333;
}

h2 {
  font-size: 18px;
  font-weight: bold;
  margin: 14px 0 7px 0;
  color: #444;
}

h3 {
  font-size: 16px;
  font-weight: bold;
  margin: 12px 0 6px 0;
  color: #555;
}

strong {
  font-weight: bold;
  color: #333;
}

ul {
  margin: 8px 0;
  padding-left: 20px;
}

li {
  margin: 4px 0;
  list-style-type: disc;
  list-style-position: inside;
}

br {
  margin: 4px 0;
}
</style>