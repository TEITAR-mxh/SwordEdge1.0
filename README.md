# 剑锋边缘 - 智能剑术训练分析与指导系统

此仓库实现一个基于 uni-app 的多端智能剑术训练系统，前端基于 Vue 3（uni-app），后端为 Python/Flask 的 AI 分析引擎。

**说明文件（重要）**: 已在项目源码内新增详细说明文档：[docs/说明.docx](docs/%E8%AF%B4%E6%98%8E.docx)

**摘要（快速上手）**
- 开发平台（推荐）：Windows 10/11 或 Linux/macOS
- 后端语言：Python（建议 3.11）
- 前端：Node.js + uni-app (Vue 3)
- 主要后端框架/库版本：Flask 2.1.3, PyTorch 2.8.0
- 前端主要依赖：vue ^3.2.45, @dcloudio/uni-app ^3.0.0-alpha-4080720251125001

请阅读 [docs/说明.docx](docs/%E8%AF%B4%E6%98%8E.docx) 获取完整环境、依赖安装和运行步骤（包含可复制命令）。下面给出简要步骤：

1) 安装前端依赖

```bash
npm install
```

2) 安装后端 Python 依赖

```bash
pip install -r requirements.txt
# 若报错或缺少包，请额外安装：
pip install mediapipe opencv-python dashscope
```

注意：项目代码中使用了 `mediapipe`、`dashscope`、`cv2` 等库（见 `backend/app.py`），若在 `requirements.txt` 中未包含，请按上行补装。

3) 启动后端（开发）

```bash
python backend/app.py
```

后端默认监听端口：`5001`（请以 `backend/app.py` 中的配置为准）。

4) 启动前端（H5 开发）

```bash
npm run dev:h5
```

5) 构建生产包示例

```bash
npm run build:h5
```