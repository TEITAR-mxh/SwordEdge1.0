import os
import time
import threading
from concurrent.futures import ThreadPoolExecutor
from http import HTTPStatus
from flask import Flask, request, jsonify, send_from_directory, url_for
from flask_cors import CORS
from werkzeug.utils import secure_filename
import json
import logging
import cv2
import numpy as np
import random
import shutil
import traceback
import dashscope
import io
from PIL import Image
# 导入分析引擎 (用于单帧分析和骨架视频生成)
from analysis_engine import create_skeleton_video_yolo, analyze_single_frame
from mediapipe.tasks.python import vision

dashscope.api_key = "sk-f8fbad210f2848fb87fe6bb927636e1d"

# 初始化Flask应用
app = Flask(__name__, static_folder='reports')
CORS(app, resources={r"/api/*": {"origins": "*"}})

# 配置文件上传和报告保存文件夹
UPLOAD_FOLDER = 'uploads'
REPORTS_FOLDER = 'reports'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORTS_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB

# 加载模型（仅加载一次）
model_path = os.path.join(
    os.path.dirname(__file__),
    'models',
    'pose_landmarker_lite.task')
try:
    pose_landmarker = vision.PoseLandmarker.create_from_model_path(model_path)
    logging.info("Model loaded successfully!")
except Exception as e:
    logging.error(f"Error loading model: {e}")


# 任务管理
ANALYSIS_TASKS = {}
executor = ThreadPoolExecutor(max_workers=4)  # 限制并发的分析任务数量

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s')


# --- 任务执行函数 ---
def analyze_video_task(session_id, temp_video_path, report_folder_base):
    # 1. 任务开始，记录日志
    logging.info(f"--- 任务启动: {session_id} ---")
    ANALYSIS_TASKS[session_id]['status'] = 'RUNNING'

    try:
        # 确保使用绝对路径
        abs_input = os.path.abspath(temp_video_path)
        report_dir = os.path.join(report_folder_base, session_id)
        os.makedirs(report_dir, exist_ok=True)
        abs_output = os.path.abspath(
            os.path.join(
                report_dir,
                "processed_video.mp4"))

        # 2. 调用测试通过的引擎
# 【核心修改点】
        # 你的 create_skeleton_video_yolo 内部应该已经调用了 run_full_analysis
        # 或者你需要在这里获取 run_full_analysis 的返回数据
        from analysis_engine import run_full_analysis # 确保导入了刚才写的全量分析函数
        
        # 运行完整分析逻辑，获取包含 metrics 和 detected_actions 的大字典
        full_result = run_full_analysis(abs_input, report_folder_base, session_id)

        if "error" not in full_result:
            ANALYSIS_TASKS[session_id]['status'] = 'COMPLETED'
            
            # 【关键：将全量结果塞进任务状态，供前端轮询读取】
            ANALYSIS_TASKS[session_id]['result'] = full_result
            
            # 补全报告视频地址（如果 run_full_analysis 没返回这个字段的话）
            if "report_urls" not in ANALYSIS_TASKS[session_id]['result']:
                ANALYSIS_TASKS[session_id]['result']['report_urls'] = {
                    "processed_video": f"/reports/{session_id}/processed_video.mp4"
                }
            
            logging.info(f"--- 任务成功: {session_id}，检测到 {len(full_result.get('detected_actions', []))} 个动作 ---")
        else:
            ANALYSIS_TASKS[session_id]['status'] = 'FAILED'
            ANALYSIS_TASKS[session_id]['result'] = {"error": full_result.get("error", "未知错误")}

    except Exception as e:
        import traceback
        logging.critical(
            f"--- 任务崩溃 {session_id} --- \n{traceback.format_exc()}")
        ANALYSIS_TASKS[session_id]['status'] = 'FAILED'
        ANALYSIS_TASKS[session_id]['result'] = {"error": str(e)}
    finally:
        pass  # 可以在这里进行文件清理等操作


# --- 异步 API 接口 ---

@app.route('/api/start_analysis', methods=['POST'])
def start_analysis_endpoint():
    """
    接收视频文件，启动后台分析任务。
    """
    if 'video' not in request.files:
        return jsonify({"error": "请求中未包含视频文件"}), 400
    video_file = request.files['video']
    if video_file.filename == '':
        return jsonify({"error": "未选择任何文件"}), 400

    session_id = f"analysis_{time.strftime('%Y%m%d_%H%M%S')}_{os.getpid()}_{random.randint(1000, 9999)}"
    original_video_filename = secure_filename(f"{session_id}_original.mp4")
    temp_video_path = os.path.join(
        app.config['UPLOAD_FOLDER'],
        original_video_filename)

    try:
        video_file.save(temp_video_path)

        # 初始化任务状态
        ANALYSIS_TASKS[session_id] = {
            'status': 'PENDING',
            'result': None,
            'creation_time': time.time(),
            'video_path': temp_video_path
        }

        # 提交后台任务
        executor.submit(
            analyze_video_task,
            session_id,
            temp_video_path,
            app.static_folder)

        return jsonify({
            "session_id": session_id,
            "status_check_url": url_for('get_analysis_status', session_id=session_id, _external=True),
            "message": "视频已接收并开始分析，请轮询任务状态。"
        }), HTTPStatus.ACCEPTED

    except Exception as e:
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
        logging.error(f"Task {session_id} initiation failed: {e}")
        return jsonify({"error": f"任务启动失败: {str(e)}"}), 500


@app.route('/api/analysis_status/<session_id>', methods=['GET'])
def get_analysis_status(session_id):
    """
    查询分析任务的状态
    """
    task = ANALYSIS_TASKS.get(session_id)
    if not task:
        return jsonify({"error": "会话 ID 不存在或已过期"}), 404

    if task['status'] == 'COMPLETED':
        return jsonify({
            "session_id": session_id,
            "status": "COMPLETED",
            "result": task['result']
        }), HTTPStatus.OK

    elif task['status'] == 'FAILED':
        return jsonify({
            "session_id": session_id,
            "status": "FAILED",
            "error_details": task['result'].get('error', '未知错误')
        }), HTTPStatus.OK

    else:  # PENDING, RUNNING
        return jsonify({
            "session_id": session_id,
            "status": task['status'],
            "message": "分析正在进行中..."
        }), HTTPStatus.OK


# --- 骨架视频生成接口 ---

@app.route('/api/generate_skeleton_video', methods=['POST'])
def generate_skeleton_video_endpoint():
    """
    生成骨架视频
    """
    data = request.json
    session_id = data.get('session_id')

    if not session_id:
        return jsonify({"error": "未提供session_id"}), 400

    task = ANALYSIS_TASKS.get(session_id)
    if not task or task['status'] != 'COMPLETED':
        return jsonify({"error": "分析未完成或会话不存在"}), 400

    input_video_path = task['video_path']
    if not os.path.exists(input_video_path):
        return jsonify({"error": "原始视频文件已丢失"}), 404

    output_video_filename = "skeleton_yolo.mp4"
    output_video_path = os.path.join(
        app.static_folder,
        session_id,
        output_video_filename)

    success = create_skeleton_video_yolo(input_video_path, output_video_path)

    if success:
        skeleton_video_url = url_for(
            'serve_report',
            path=f"{session_id}/{output_video_filename}",
            _external=True)
        return jsonify({
            "skeleton_video_path": skeleton_video_url,
            "message": "骨架视频生成成功"
        })
    else:
        return jsonify({"error": "骨架视频生成失败"}), 500


# --- 实时分析单帧接口 ---

@app.route('/api/analyze_frame', methods=['POST', 'OPTIONS'])  # 显式允许 OPTIONS
def analyze_frame_endpoint():
    """实时分析单帧图像，返回姿态关键点和评分"""
    # 处理预检请求 (CORS)
    if request.method == 'OPTIONS':
        return '', 200

    try:
        if 'frame' not in request.files:
            print("Error: No frame file in request")
            return jsonify({"error": "请求中未包含图像帧"}), 400

        frame_file = request.files['frame']

        # 优化解析路径：直接使用 numpy 转换，跳过 PIL 以提升实时性
        file_bytes = np.frombuffer(frame_file.read(), np.uint8)
        frame = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if frame is None:
            print("Error: Could not decode image")
            return jsonify({"error": "图片解码失败"}), 500

        # 调用单帧分析函数
        # 注意：请确保你的 analysis_engine.py 里的 analyze_single_frame 逻辑正确
        result = analyze_single_frame(frame)

        # 构造符合前端 monitor.vue 预期的返回结构
        # 必须包含 success 字段，前端逻辑才会继续执行
        return jsonify({
                    "success": True,
                    "score": result.get('score', 0),
                    "metrics": result.get('metrics', {}),
                    "keypoints": result.get('keypoints', []),
                    "fps": result.get('fps', 30),
                    # --- 关键修复：把 action 字段加进去 ---
                    "action": result.get('action', {"name": "检测中", "confidence": 0})
                })

    except Exception as e:
        # 这里是关键：将具体的报错打印到 PowerShell 控制台
        print("--- 实时分析崩溃详情 ---")
        traceback.print_exc()
        return jsonify({"success": False, "error": f"分析失败: {str(e)}"}), 500
# --- 静态文件服务 ---


@app.route('/api/training/stats', methods=['GET'])
def get_training_stats():
    return jsonify({
        "综合评分": 89,
        "连续训练": 12,
        "累计时长": "45h",
        "训练次数": 156
    })


@app.route('/api/monitor/stop', methods=['POST', 'OPTIONS'])
def stop_monitor_api():
    return jsonify({"success": True, "message": "Monitoring session cleared"})


@app.route('/api/training/list', methods=['GET'])
def get_training_list():
    # 返回一个列表
    return jsonify([
        {
            "id": 1,
            "type": "击剑训练",
            "date": "2025-12-17 14:30",
            "score": 92,
            "duration": "45分钟",
            "status": "excellent",
            "statusText": "优秀"
        }
    ])


@app.route('/reports/<path:path>')
@app.route('/api/get_coach_feedback', methods=['POST'])
def get_coach_feedback():
    """
    真正的 AI 教练反馈接口：接收前端发送的量化数据，调用通义千问大模型生成报告。
    """
    try:
        action_data = request.json
        if not action_data:
            return jsonify({"error": "未提供动作数据"}), 400

        # 1. 提取并格式化指标数据
        metrics = action_data.get('metrics', {})
        metrics_text = "\n".join(
            [f"- {key}: {value}" for key, value in metrics.items()])

        # 2. 构建大模型 Prompt
        messages = [{"role": "system",
                     "content": "你是一名专业的击剑运动数据分析师。你的任务是基于提供的量化数据，为运动员生成一份简洁、精炼、专业的技术诊断报告。请直接输出报告内容，不要包含任何多余的对话、场景描述或无关的客套话。"},
                    {"role": "user",
                     "content": f"""请根据以下击剑动作的量化数据，生成技术诊断报告。报告必须严格遵循以下三部分结构：
 1.技术亮点 (Highlights): 提出1-2个优点，并必须引用具体的数据指标作为支撑。
 2.待改进点 (Areas for Improvement): 提出1-2个最需要改进的问题，并必须引用具体的数据指标来解释问题所在。
 3.训练建议 (Training Suggestions): 针对待改进点，给出1-2个具体、可执行的训练方法。

---
**动作数据**
* 动作类型: {action_data.get('type', '击剑综合姿态')}
* 综合评分: {action_data.get('score', 'N/A')}/100
* 详细指标:
{metrics_text}
---"""}]

        # 3. 调用大模型 (qwen-turbo)
        response = dashscope.Generation.call(
            model=dashscope.Generation.Models.qwen_turbo,
            messages=messages,
            result_format='message'
        )

        if response.status_code == HTTPStatus.OK:
            # 提取 AI 生成的文本
            ai_content = response.output.choices[0]['message']['content']
            return jsonify({
                "status": "success",
                "feedback": ai_content
            })
        else:
            # 使用 print 替代 logging 以便在控制台直接看到报错
            print(f"DashScope Error: {response.code} - {response.message}")
            return jsonify({"error": f"AI服务调用失败: {response.message}"}), 500

    except Exception as e:
        print(f"AI Feedback Error: {str(e)}")
        return jsonify({"error": f"服务器内部异常: {str(e)}"}), 500


@app.route('/reports/<path:filename>')
def serve_report(filename):
    """服务报告和生成的视频文件，确保前端能访问到 processed_video.mp4"""
    # as_attachment=False 允许在浏览器中直接播放
    return send_from_directory(
        app.static_folder,
        filename,
        mimetype='video/mp4')


if __name__ == '__main__':
    logging.info("Starting Flask Server on http://0.0.0.0:5001")
    # 生产环境建议 debug=False，如需调试可改为 True
    app.run(host='0.0.0.0', port=5001, debug=True)
