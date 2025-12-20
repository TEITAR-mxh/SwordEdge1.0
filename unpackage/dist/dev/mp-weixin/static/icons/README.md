# TabBar 图标说明

## 需要的图标文件

由于 uni-app 的 tabBar 要求使用实际的图片文件（PNG格式），需要准备以下图标：

### 必需的图标文件

1. **home.png** / **home-active.png** - 首页图标（40x40 px，81x81 px）
2. **monitor.png** / **monitor-active.png** - 监控图标
3. **analysis.png** / **analysis-active.png** - 分析图标
4. **plans.png** / **plans-active.png** - 计划图标
5. **profile.png** / **profile-active.png** - 个人中心图标

## 图标规范

- **尺寸**: 推荐 81x81 px（@2x）或 40x40 px（@1x）
- **格式**: PNG，支持透明背景
- **颜色**:
  - 未选中: #94a3b8（灰色）
  - 选中: #3b82f6（蓝色）

## 临时解决方案

如果暂时没有图标文件，可以使用以下方案之一：

### 方案1：使用 iconfont（推荐）

在 pages.json 中配置 iconfont：

\`\`\`json
{
  "tabBar": {
    "iconfontSrc": "static/iconfont.ttf",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconfont": {
          "text": "\\ue001",
          "selectedText": "\\ue001",
          "fontSize": "22px",
          "color": "#94a3b8",
          "selectedColor": "#3b82f6"
        }
      }
    ]
  }
}
\`\`\`

### 方案2：在线图标生成工具

使用以下工具生成图标：
1. Iconfont - https://www.iconfont.cn/
2. Icon Kitchen - https://icon.kitchen/
3. App Icon Generator - https://www.appicon.co/

## 快速生成图标

你可以使用以下SVG图标转换为PNG：

### 首页图标（Home）
\`\`\`svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z"/>
  <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z"/>
</svg>
\`\`\`

### 监控图标（Monitor）
\`\`\`svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path fill-rule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clip-rule="evenodd"/>
  <path fill-rule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clip-rule="evenodd"/>
</svg>
\`\`\`

### 分析图标（Analysis）
\`\`\`svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z"/>
</svg>
\`\`\`

### 计划图标（Plans）
\`\`\`svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path fill-rule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clip-rule="evenodd"/>
  <path fill-rule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.586 4.594a.75.75 0 00-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.116-.062l3-3.75z" clip-rule="evenodd"/>
</svg>
\`\`\`

### 个人中心图标（Profile）
\`\`\`svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clip-rule="evenodd"/>
</svg>
\`\`\`

## 在线转换工具

将上述 SVG 代码转换为 PNG:
- https://svgtopng.com/
- https://cloudconvert.com/svg-to-png
- https://convertio.co/svg-png/

转换时设置：
- 宽度/高度: 81px (@2x) 或 40px (@1x)
- 背景: 透明
- 颜色: 未选中 #94a3b8，选中 #3b82f6
