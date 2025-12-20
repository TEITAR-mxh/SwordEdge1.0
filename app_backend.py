import os
import time
import threading
from concurrent.futures import ThreadPoolExecutor
from http import HTTPStatus
from flask import Flask, request, jsonify, send_from_directory, url_for
from flask_cors import CORS
from werkzeug.utils import secure_filename
import dashscope # 用于AI教练
import json
import logging
import cv2
import numpy as np
from PIL import Image
import io
import random
import shutil

# --- 导入你的分析模块 (确保它们与 app.py 在同一目录) ---
from fencing_dual_analyzer import process_dual_video_detector_en
# 导入你的分析引擎 (用于单帧分析和骨架视频生成)
from analysis_engine import create_skeleton_video_yolo, analyze_single_frame # 移除了 run_full_analysis

# --- 配置和初始化 ---
REPORTS_FOLDER = 'reports'
os.makedirs(REPORTS_FOLDER, exist_ok=True)
# 将 REPORTS_FOLDER 设置为静态文件夹，使其内容可以通过 URL 访问
app = Flask(__name__, static_folder=REPORTS_FOLDER) 
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB
# 示例API Key，请替换为你的实际密钥
dashscope.api_key = "sk-f8fbad210f2848fb87fe6bb927636e1d" 

# 任务管理: 存储所有正在运行或已完成的任务状态和结果
ANALYSIS_TASKS = {} 
# 线程池: 限制同时进行视频分析的线程数量 (根据服务器CPU核心数配置)
executor = ThreadPoolExecutor(max_workers=4) 

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


# --- 任务执行函数 (在后台线程中运行) ---
def analyze_video_task(session_id, temp_video_path, report_folder_base):
    """
    实际执行视频分析任务的函数，在新线程中运行。
    使用 fencing_dual_analyzer.process_dual_video_detector_en 进行双人分析。
    """
    ANALYSIS_TASKS[session_id]['status'] = 'RUNNING'
    report_output_dir = os.path.join(report_folder_base, session_id)
    os.makedirs(report_output_dir, exist_ok=True)
    
    try:
        logging.info(f"Task {session_id}: Starting Fencing Dual Analysis.")
        
        # 🌟 调用双人分析核心函数
        # 假设 output_path 用于保存处理后的视频，output_dir_plots 用于保存图表
        raw_result = process_dual_video_detector_en(
            temp_video_path, 
            output_path=os.path.join(report_output_dir, "processed_video.mp4"),
            output_dir_plots=report_output_dir, 
            show_realtime=False # 必须关闭实时显示
        )
        
        # 2. 更新任务状态
        if "error" in raw_result: # 假设分析函数失败时会返回 'error' 键
            ANALYSIS_TASKS[session_id]['status'] = 'FAILED'
            ANALYSIS_TASKS[session_id]['result'] = raw_result
            logging.error(f"Task {session_id} FAILED: {raw_result.get('error')}")
        else:
            ANALYSIS_TASKS[session_id]['status'] = 'COMPLETED'
            
            # 转换报告路径为前端可访问的URL
            report_url_base = url_for('serve_report', path=session_id, _external=True)
            
            # 🌟 构造前端报告 URL，需要与 process_dual_video_detector_en 的输出文件名一致
            raw_result['report_urls'] = {
                "processed_video": f"{report_url_base}/processed_video.mp4",
                "radar_plot": f"{report_url_base}/tactical_radar_chart_detector_en.png", # 假设文件名
                "line_plot": f"{report_url_base}/posture_scores_timeline_detector_en.png", # 假设文件名
                "skeleton_video_ready": False # 骨架视频需要后续生成
            }
            ANALYSIS_TASKS[session_id]['result'] = raw_result
            logging.info(f"Task {session_id} COMPLETED successfully.")
            
    except Exception as e:
        ANALYSIS_TASKS[session_id]['status'] = 'FAILED'
        ANALYSIS_TASKS[session_id]['result'] = {"error": f"服务器内部错误: {str(e)}"}
        logging.critical(f"Task {session_id} CRASHED: {e}", exc_info=True)
        
    finally:
        # 保持原始视频文件暂不清理，直到生成骨架视频或定期清理
        pass 


# --- 用户认证相关接口 (Mock) ---

@app.route('/api/login', methods=['POST'])
def login_endpoint():
    """用户登录接口（Mock实现）"""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Mock验证逻辑
    if username and password:
        # 生成Mock Token
        mock_token = f"mock_token_{username}_{int(time.time())}"
        return jsonify({
            "token": mock_token,
            "userInfo": {
                "id": 1001,
                "username": username,
                "nickname": username,
                "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=" + username,
                "level": "中级剑士",
                "trainingDays": 45
            },
            "message": "登录成功"
        }), 200
    else:
        return jsonify({"error": "用户名或密码不能为空"}), 400

@app.route('/api/register', methods=['POST'])
def register_endpoint():
    """用户注册接口（Mock实现）"""
    data = request.json
    return jsonify({"message": "注册成功，请登录"}), 201

@app.route('/api/logout', methods=['POST'])
def logout_endpoint():
    """用户登出接口"""
    return jsonify({"message": "登出成功"}), 200

@app.route('/api/user/info', methods=['GET'])
def get_user_info_endpoint():
    """获取用户信息接口（Mock实现）"""
    return jsonify({
        "id": 1001,
        "username": "user",
        "nickname": "击剑爱好者",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
        "level": "中级剑士",
        "trainingDays": 45,
        "totalTrainings": 128,
        "achievements": 12
    }), 200

# --- 训练记录相关接口 (Mock) ---

@app.route('/api/training/stats', methods=['GET'])
def get_training_stats_endpoint():
    """获取训练统计数据（Mock实现）"""
    return jsonify({
        "totalTrainings": 128,
        "totalDuration": 3840,  # 分钟
        "averageScore": 8.5,
        "weeklyProgress": [
            {"day": "周一", "count": 2, "duration": 60},
            {"day": "周二", "count": 1, "duration": 30},
            {"day": "周三", "count": 3, "duration": 90},
            {"day": "周四", "count": 2, "duration": 60},
            {"day": "周五", "count": 1, "duration": 30},
            {"day": "周六", "count": 4, "duration": 120},
            {"day": "周日", "count": 3, "duration": 90}
        ],
        "recentTrainings": [
            {
                "id": 1,
                "date": "2025-12-16",
                "type": "基础步法训练",
                "duration": 45,
                "score": 8.8,
                "status": "completed"
            },
            {
                "id": 2,
                "date": "2025-12-15",
                "type": "进攻技术训练",
                "duration": 60,
                "score": 9.2,
                "status": "completed"
            },
            {
                "id": 3,
                "date": "2025-12-14",
                "type": "防守反击训练",
                "duration": 50,
                "score": 8.5,
                "status": "completed"
            }
        ]
    }), 200

@app.route('/api/training/list', methods=['GET'])
def get_training_list_endpoint():
    """获取训练记录列表（Mock实现）"""
    return jsonify({
        "total": 128,
        "list": [
            {"id": i, "date": f"2025-12-{17-i//10}", "type": "训练", "score": 8.0 + i*0.1}
            for i in range(1, 21)
        ]
    }), 200

@app.route('/api/training/detail/<int:id>', methods=['GET'])
def get_training_detail_endpoint(id):
    """获取训练记录详情（Mock实现）"""
    return jsonify({
        "id": id,
        "date": "2025-12-16",
        "type": "基础步法训练",
        "duration": 45,
        "score": 8.8,
        "metrics": {
            "准确度": 92,
            "速度": 85,
            "稳定性": 88
        }
    }), 200

# --- 训练计划相关接口 (Mock) ---

@app.route('/api/plans/list', methods=['GET'])
def get_plan_list_endpoint():
    """获取训练计划列表（Mock实现）"""
    return jsonify({
        "total": 6,
        "list": [
            {
                "id": 1,
                "title": "基础击剑入门",
                "level": "初级",
                "duration": "4周",
                "progress": 75,
                "badge": "热门"
            },
            {
                "id": 2,
                "title": "进阶技术提升",
                "level": "中级",
                "duration": "6周",
                "progress": 40,
                "badge": "推荐"
            },
            {
                "id": 3,
                "title": "专业竞技训练",
                "level": "高级",
                "duration": "8周",
                "progress": 0,
                "badge": "精品"
            }
        ]
    }), 200

# --- 异步 API 接口 ---

@app.route('/api/start_analysis', methods=['POST'])
def start_analysis_endpoint():
    """
    接收视频文件，启动后台分析任务，并立即返回任务ID。
    """
    if 'video' not in request.files: return jsonify({"error": "请求中未包含视频文件"}), 400
    video_file = request.files['video']
    if video_file.filename == '': return jsonify({"error": "未选择任何文件"}), 400

    # 使用时间戳、PID和随机数生成唯一的Session ID
    session_id = f"analysis_{time.strftime('%Y%m%d_%H%M%S')}_{os.getpid()}_{random.randint(1000, 9999)}"
    original_video_filename = secure_filename(f"{session_id}_original.mp4") # 使用 secure_filename 增加安全性
    temp_video_path = os.path.join(app.config['UPLOAD_FOLDER'], original_video_filename)
    
    try:
        # 保存文件
        video_file.save(temp_video_path)
        
        # 初始化任务状态
        ANALYSIS_TASKS[session_id] = {
            'status': 'PENDING',
            'result': None,
            'creation_time': time.time(),
            'video_path': temp_video_path # 保存原始视频路径
        }
        
        # 提交任务到线程池
        # app.static_folder 路径为 'reports' 文件夹的绝对路径
        executor.submit(analyze_video_task, session_id, temp_video_path, app.static_folder)
        
        # 立即返回任务信息 (202 Accepted)
        return jsonify({
            "session_id": session_id,
            "status_check_url": url_for('get_analysis_status', session_id=session_id, _external=True),
            "message": "视频已接收并开始在后台分析，请轮询状态。"
        }), HTTPStatus.ACCEPTED 
        
    except Exception as e:
        # 异常时清理文件
        if os.path.exists(temp_video_path): os.remove(temp_video_path)
        logging.error(f"Task {session_id} initiation failed: {e}")
        return jsonify({"error": f"文件保存或任务启动失败: {str(e)}"}), 500


@app.route('/api/analysis_status/<session_id>', methods=['GET'])
def get_analysis_status(session_id):
    """
    客户端轮询此接口获取任务状态和结果。
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
        
    else: # PENDING, RUNNING
        return jsonify({
            "session_id": session_id,
            "status": task['status'],
            "message": "分析正在进行中..."
        }), HTTPStatus.OK

# --- 骨架视频生成和清理接口 ---

@app.route('/api/generate_skeleton_video', methods=['POST'])
def generate_skeleton_video_endpoint():
    """按需生成骨架视频并清理原始大文件。"""
    data = request.json
    session_id = data.get('session_id')
    if not session_id: return jsonify({"error": "未提供session_id"}), 400

    task = ANALYSIS_TASKS.get(session_id)
    if not task or task['status'] != 'COMPLETED':
          return jsonify({"error": "分析未完成或会话不存在"}), 400

    input_video_path = task['video_path']
    if not os.path.exists(input_video_path):
        return jsonify({"error": "原始视频文件已丢失或已被清理"}), 404

    output_dir = os.path.join(app.static_folder, session_id)
    os.makedirs(output_dir, exist_ok=True)
    output_video_filename = "skeleton_yolo.mp4"
    output_video_path = os.path.join(output_dir, output_video_filename)

    logging.info(f"Task {session_id}: Starting skeleton video generation.")
    
    # 🌟 调用骨架视频生成函数
    success = create_skeleton_video_yolo(input_video_path, output_video_path)
    
    # 清理原始视频：一旦骨架视频生成，就清理原始大文件
    try:
        if os.path.exists(input_video_path): 
            os.remove(input_video_path)
            logging.info(f"Task {session_id}: Cleaned original video.")
            # 更新状态，表示骨架视频已生成
            task['result']['report_urls']['skeleton_video_ready'] = True
            # 移除原始文件路径，防止定期清理再次尝试删除
            task['video_path'] = None 
    except OSError as e:
        logging.warning(f"Task {session_id}: Error cleaning original video: {e}")

    if success:
        # URL 路径为 /reports/session_id/skeleton_yolo.mp4
        skeleton_url = url_for('serve_report', path=f"{session_id}/{output_video_filename}", _external=True)
        return jsonify({
            "skeleton_video_path": skeleton_url,
            "message": "骨架视频生成并返回成功。"
        })
    else:
        return jsonify({"error": "骨架视频生成失败。"}), 500

# --- 实时分析和AI教练（保持不变） ---

@app.route('/api/get_coach_feedback', methods=['POST'])
def get_coach_feedback_endpoint():
    action_data = request.json
    if not action_data: return jsonify({"error": "未提供动作数据"}), 400
    
    metrics_text = "\n".join([f"- {key}: {value}" for key, value in action_data.get('metrics', {}).items()])
    
    messages = [
        {"role": "system", "content": "你是一名专业的击剑运动数据分析师。你的任务是基于提供的量化数据，为运动员生成一份简洁、精炼、专业的技术诊断报告。请直接输出报告内容，不要包含任何多余的对话、场景描述或无关的客套话。请使用Markdown格式。"},
        {"role": "user", "content": f"""请根据以下击剑动作的量化数据，生成技术诊断报告。报告必须严格遵循以下三部分结构：
1. **技术亮点 (Highlights):** 提出1-2个优点，并必须引用具体的数据指标作为支撑。
2. **待改进点 (Areas for Improvement):** 提出1-2个最需要改进的问题，并必须引用具体的数据指标来解释问题所在。
3. **训练建议 (Training Suggestions):** 针对待改进点，给出1-2个具体、可执行的训练方法。

---
**动作数据**
* **动作类型:** {action_data.get('type', '未提供')}
* **综合评分:** {action_data.get('score', 'N/A')}/10
* **详细指标:**
{metrics_text}
---"""}
    ]
    try:
        response = dashscope.Generation.call(model=dashscope.Generation.Models.qwen_turbo, messages=messages, result_format='message')
        if response.status_code == HTTPStatus.OK:
            return jsonify({"feedback": response.output.choices[0]['message']['content']})
        else:
            return jsonify({"error": f"API调用失败: {response.message}"}), 500
    except Exception as e:
        logging.error(f"AI Feedback failed: {e}")
        return jsonify({"error": f"程序异常: {e}"}), 500

@app.route('/api/analyze_frame', methods=['POST'])
def analyze_frame_endpoint():
    """实时分析单帧图像，返回姿态关键点和评分 (使用 PIL 和 cv2)"""
    try:
        if 'frame' not in request.files: return jsonify({"error": "请求中未包含图像帧"}), 400
        frame_file = request.files['frame']
        
        # 使用 Pillow 和 OpenCV 从文件流读取图像
        image_bytes = frame_file.read()
        image = Image.open(io.BytesIO(image_bytes))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        # 🌟 调用单帧分析函数
        result = analyze_single_frame(frame) 

        return jsonify(result)

    except Exception as e:
        logging.error(f"分析帧时出错: {e}")
        return jsonify({"error": f"分析失败: {str(e)}"}), 500

# --- 静态文件服务 ---

@app.route('/reports/<path:path>')
def serve_report(path):
    """服务报告和生成的视频文件。例如 /reports/analysis_.../processed_video.mp4"""
    # app.static_folder 默认指向 REPORTS_FOLDER
    return send_from_directory(app.static_folder, path)

# --- 定期清理任务 (可选，用于生产环境) ---
def cleanup_old_files():
    """清理超过 7 天的旧上传和报告文件"""
    seven_days_ago = time.time() - (7 * 24 * 60 * 60)
    
    # 清理 uploads 文件夹 (主要是分析失败或未启动的任务留下的原始文件)
    for filename in os.listdir(app.config['UPLOAD_FOLDER']):
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.getmtime(filepath) < seven_days_ago:
            try:
                os.remove(filepath)
                logging.info(f"Cleaned old upload file: {filename}")
            except OSError:
                continue

    # 清理 reports 文件夹
    for session_id in os.listdir(app.static_folder):
        dirpath = os.path.join(app.static_folder, session_id)
        if os.path.isdir(dirpath) and os.path.getmtime(dirpath) < seven_days_ago:
            try:
                shutil.rmtree(dirpath)
                logging.info(f"Cleaned old report directory: {session_id}")
            except OSError:
                continue
    
    # 清理 ANALYSIS_TASKS 字典中的过期记录
    expired_sessions = [s_id for s_id, task in ANALYSIS_TASKS.items() if task['creation_time'] < seven_days_ago]
    for s_id in expired_sessions:
        del ANALYSIS_TASKS[s_id]
        logging.info(f"Removed old task ID: {s_id}")

# 启动清理线程（可选）
if not app.debug:
    # 仅在非调试模式下运行清理线程
    cleanup_thread = threading.Timer(interval=24*60*60, function=cleanup_old_files)
    cleanup_thread.daemon = True
    cleanup_thread.start()


if __name__ == '__main__':
    try:
        logging.info("Starting Flask Server...")
        # 注意：在生产环境中，请使用 Gunicorn/uWSGI 等 WSGI 服务器
        logging.info("Flask app configuration: %s", app.config)
        logging.info("About to call app.run()...")
        app.run(host='0.0.0.0', port=5001, debug=True)
        logging.info("Flask Server Started Successfully")
    except Exception as e:
        logging.error("Failed to start Flask Server: %s", str(e))
        logging.error("Exception type: %s", type(e).__name__)
        import traceback
        logging.error("Traceback: %s", traceback.format_exc())