# 剑锋边缘 - 智能剑术训练分析与指导系统

## 项目简介

基于 uni-app 的多端智能剑术训练分析系统，支持 H5、微信小程序、支付宝小程序、App 等多个平台。

## 技术栈

- **框架**: uni-app (Vue 3)
- **UI**: 自定义组件 + uni-ui
- **样式**: SCSS
- **后端**: Python Flask (AI 分析引擎)

## 多端支持

### 已支持平台

- ✅ H5 (Web)
- ✅ 微信小程序
- ✅ 支付宝小程序
- ✅ 百度小程序
- ✅ 抖音小程序
- ✅ App (Android/iOS)

## 开发环境设置

### 1. 安装依赖

```bash
# 如果使用 HBuilderX，会自动安装依赖
# 如果使用 CLI，执行：
npm install
```

### 2. 开发运行

#### H5 开发
```bash
# 使用 HBuilderX：运行 -> 运行到浏览器 -> Chrome
# 使用 CLI：
npm run dev:h5
```

#### 微信小程序开发
```bash
# 使用 HBuilderX：运行 -> 运行到小程序模拟器 -> 微信开发者工具
# 使用 CLI：
npm run dev:mp-weixin
```

然后在微信开发者工具中打开 `dist/dev/mp-weixin` 目录

#### 支付宝小程序开发
```bash
# 使用 HBuilderX：运行 -> 运行到小程序模拟器 -> 支付宝开发者工具
# 使用 CLI：
npm run dev:mp-alipay
```

#### App 开发
```bash
# 使用 HBuilderX：运行 -> 运行到手机或模拟器
# 需要配置 Android Studio 或 Xcode
npm run dev:app
```

### 3. 生产构建

#### H5 构建
```bash
npm run build:h5
# 输出目录: dist/build/h5
```

#### 微信小程序构建
```bash
npm run build:mp-weixin
# 输出目录: dist/build/mp-weixin
```

#### 支付宝小程序构建
```bash
npm run build:mp-alipay
# 输出目录: dist/build/mp-alipay
```

#### App 构建
```bash
# 使用 HBuilderX：发行 -> 原生App-云打包
npm run build:app
```

## 项目结构

```
SwordEdge1.0/
├── pages/              # 页面目录
│   ├── index/         # 首页
│   ├── monitor/       # 实时监控
│   ├── analysis/      # 训练分析
│   ├── plans/         # 训练计划
│   ├── profile/       # 个人中心
│   └── login/         # 登录页
├── components/        # 组件目录
│   ├── se-card/       # 卡片组件
│   ├── se-button/     # 按钮组件
│   ├── se-progress/   # 进度条组件
│   └── se-stat-card/  # 统计卡片组件
├── static/            # 静态资源
│   └── icons/         # 图标文件
├── utils/             # 工具函数
├── App.vue           # 应用配置（多端通用）
├── App.uvue          # uni-app x 配置（仅App端）
├── main.js           # 入口文件（多端）
├── main.uts          # 入口文件（uni-app x）
├── pages.json        # 页面路由配置
├── manifest.json     # 应用配置文件
├── uni.scss          # 全局样式变量
└── package.json      # 项目依赖配置
```

## 多端适配说明

### 条件编译

项目使用 uni-app 的条件编译来处理平台差异：

```javascript
// #ifdef H5
// H5 专用代码
// #endif

// #ifdef MP-WEIXIN
// 微信小程序专用代码
// #endif

// #ifdef APP-PLUS
// App 专用代码
// #endif

// #ifndef H5
// 除 H5 外的平台代码
// #endif
```

### 样式适配

- 使用 `rpx` 单位实现响应式布局
- 使用条件编译处理平台特定样式
- 注意小程序不支持 `*` 选择器

### API 适配

- 优先使用 uni-app 统一 API
- 平台特有功能使用条件编译
- 做好降级处理和错误捕获

## 发布流程

### H5 发布

1. 构建生产版本：`npm run build:h5`
2. 将 `dist/build/h5` 目录部署到服务器
3. 配置 Nginx 或其他 Web 服务器

### 微信小程序发布

1. 在 `manifest.json` 中配置 `mp-weixin.appid`
2. 构建：`npm run build:mp-weixin`
3. 使用微信开发者工具打开 `dist/build/mp-weixin`
4. 点击"上传"提交审核

### 支付宝小程序发布

1. 在 `manifest.json` 中配置支付宝小程序 appid
2. 构建：`npm run build:mp-alipay`
3. 使用支付宝开发者工具上传

### App 发布

1. 配置 `manifest.json` 中的 App 相关信息
2. 使用 HBuilderX 云打包或本地打包
3. 生成 APK/IPA 文件
4. 提交到应用商店

## 后端服务

### Python 服务启动

```bash
# 安装依赖
pip install -r requirements.txt

# 启动服务
python app.py
```

后端服务默认运行在 `http://localhost:5000`

### API 代理配置

- **H5 开发环境**: 已在 `manifest.json` 中配置 proxy
- **生产环境**: 需要在服务器配置反向代理
- **小程序**: 需要配置服务器域名白名单

## 常见问题

### 1. H5 运行报错 webpack 解析失败

**原因**: `main.js` 引入了 `.uvue` 文件，H5 不支持

**解决**: 确保 `main.js` 引入 `App.vue`，`main.uts` 引入 `App.uvue`

### 2. 小程序不支持某些 CSS 属性

**解决**: 使用条件编译，为小程序提供降级方案

### 3. App 双击返回退出功能

**位置**: `App.uvue` 中的 `onLastPageBackPress` 生命周期
**注意**: 仅在 uni-app x (App) 中可用

### 4. API 请求跨域问题

- **H5 开发**: 使用 proxy 配置
- **生产环境**: 配置 CORS 或使用反向代理
- **小程序/App**: 无跨域限制

## 性能优化建议

1. **图片优化**: 使用 webp 格式，启用懒加载
2. **分包加载**: 将页面拆分为分包，减少主包体积
3. **按需加载**: 组件和页面按需引入
4. **缓存策略**: 合理使用 storage 和 HTTP 缓存
5. **代码压缩**: 生产环境启用代码混淆和压缩

## 开发规范

1. 遵循 Vue 3 Composition API 规范
2. 使用 ESLint 进行代码检查
3. 组件命名采用 kebab-case
4. 样式使用 BEM 命名规范
5. 提交信息遵循 Conventional Commits

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue 或联系开发团队。
