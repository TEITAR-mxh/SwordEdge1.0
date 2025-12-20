# 文件名: backend/app.py

import os
from http import HTTPStatus
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import dashscope
import time
import threading
from flask_socketio import SocketIO
import asyncio
import json
import math
import random
from analysis_engine import run_full_analysis, create_skeleton_video_yolo

# Load app config and align report/upload folders
from config import config
app_config = config['default']

REPORTS_FOLDER = app_config.REPORTS_FOLDER
UPLOAD_FOLDER = app_config.UPLOAD_FOLDER

os.makedirs(REPORTS_FOLDER, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder=REPORTS_FOLDER)
# Allow CORS for API endpoints and preflight
CORS(app, resources={r"/api/*": {"origins": "*"}})

socketio = SocketIO(app, cors_allowed_origins='*', async_mode='threading', ping_timeout=60, ping_interval=25, max_http_buffer_size=1e8) # Enhanced WebSocket configuration

_emitter_thread = None
_emitter_stop = threading.Event()
_clients = 0
_clients_lock = threading.Lock()
_force_reload = threading.Event() # This will be less relevant with BLE streaming

# --- Removed: File watcher for Witmotion output ---
# WATCH_DIR = r'D:\Witmotion(V2025.11.5.0)\Record\mag'
# _watcher_thread = None
# _watcher_stop = threading.Event()

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- Register modular blueprints under /api for unified routing ---
try:
    # routes are in backend/routes/*.py; register them with /api prefix
    from routes.auth import auth_bp
    from routes.analysis import analysis_bp
    from routes.monitor import monitor_bp
    from routes.plan import plan_bp
    from routes.training import training_bp

    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(analysis_bp, url_prefix='/api')
    app.register_blueprint(monitor_bp, url_prefix='/api')
    app.register_blueprint(plan_bp, url_prefix='/api')
    app.register_blueprint(training_bp, url_prefix='/api')
    print('Blueprints registered: /api/*')
except Exception as e:
    print('Blueprint registration failed:', e)

# Explicitly accept OPTIONS for any /api/* route to ensure preflight returns HTTP 200
# Some environments/clients require an explicit OPTIONS handler even when flask-cors is present.
@app.route('/api/<path:dummy>', methods=['OPTIONS'])
def handle_options(dummy):
    from flask import make_response
    resp = make_response('', 200)
    origin = request.headers.get('Origin', '*')
    req_headers = request.headers.get('Access-Control-Request-Headers', 'Authorization,Content-Type')
    resp.headers['Access-Control-Allow-Origin'] = origin
    resp.headers['Access-Control-Allow-Headers'] = req_headers
    resp.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    resp.headers['Access-Control-Allow-Credentials'] = 'true'
    return resp

# BLE service has been removed due to missing dependencies

# Legacy direct endpoints have been removed. All API routes are provided
# by blueprints under the /api prefix (see backend/routes/*).

# ========== 训练记录相关 API（已迁移） ==========
# 训练记录接口已迁移到 `backend/routes/training.py` 并通过蓝图挂载至 `/api` 前缀。
# 请使用 `/api/training/*` 下的路由访问相关功能。

# ========== 实时监控相关 API（已迁移） ==========
# 实时监控接口已迁移到 `backend/routes/analysis.py` 或其他蓝图中，并通过 `/api` 前缀暴露。
# 请使用 `/api/monitor/*` 下的路由访问相关功能。

# --- Removed: /api/action_segments endpoint (no longer using file-based segments) ---
# @app.route('/api/action_segments', methods=['GET'])
# def action_segments_endpoint():
#     try:
#         file_path = request.args.get('file')
#         base_dir = os.path.dirname(__file__)
#         cache_path = os.path.join(base_dir, 'action_segments.json')
#         if file_path:
#             df = parse_witmotion_txt(file_path)
#             segments = generate_frames_from_segment(df)
#             return jsonify(segments)
#         if os.path.exists(cache_path):
#             with open(cache_path, 'r', encoding='utf-8') as f:
#                 data = json.load(f)
#             return jsonify(data)
#         return jsonify([])
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


def _synthesize_frames_for_demo(segment, n_frames=60, n_keypoints=3):
    """生成简单的立方体旋转动画数据，适合路演展示"""
    frames = []
    
    # 生成立方体旋转动画
    for i in range(n_frames):
        t = i / max(1, n_frames - 1)
        frame = {"time": t, "keypoints": []}
        
        # 生成3个关键点的固定位置（形成三角形）
        # 这些点不会移动，动画由立方体旋转实现
        frame["keypoints"].append({"x": -0.5, "y": 0.5, "z": 0.0})   # 左上角
        frame["keypoints"].append({"x": 0.5, "y": 0.5, "z": 0.0})    # 右上角
        frame["keypoints"].append({"x": 0.0, "y": -0.5, "z": 0.0})  # 底部
        
        # 生成更丰富的立方体旋转动画
        # 绕Y轴旋转（主要旋转）
        angle_y = t * 2.0 * math.pi
        # 绕X轴轻微摆动
        angle_x = math.sin(t * 4.0 * math.pi) * 0.3
        # 绕Z轴轻微旋转
        angle_z = math.cos(t * 3.0 * math.pi) * 0.2
        
        # 使用Three.js兼容的四元数格式（w, x, y, z）
        # 直接使用欧拉角转换为四元数，避免复杂的四元数乘法
        # 使用Y-X-Z旋转顺序（Three.js默认）
        
        # 计算每个轴的旋转分量
        cy = math.cos(angle_y * 0.5)
        sy = math.sin(angle_y * 0.5)
        cx = math.cos(angle_x * 0.5)
        sx = math.sin(angle_x * 0.5)
        cz = math.cos(angle_z * 0.5)
        sz = math.sin(angle_z * 0.5)
        
        # Y-X-Z旋转顺序的四元数
        w = cy * cx * cz + sy * sx * sz
        x = cy * sx * cz + sy * cx * sz
        y = sy * cx * cz - cy * sx * sz
        z = cy * cx * sz - sy * sx * cz
        
        # 确保四元数归一化
        length = math.sqrt(w*w + x*x + y*y + z*z)
        if length > 0:
            w /= length
            x /= length
            y /= length
            z /= length
        
        frame['quaternion'] = {'q0': w, 'q1': x, 'q2': y, 'q3': z}
        
        frames.append(frame)
    
    return frames

# --- Removed: /api/pose_frames endpoint (will get data from BLE service) ---
# @app.route('/api/pose_frames', methods=['GET'])
# def pose_frames_endpoint():
#     try:
#         seg_idx = request.args.get('segment_id', default=None, type=int)
#         base_dir = os.path.dirname(__file__)
#         cache_path = os.path.join(base_dir, 'action_segments.json')
#         segments = []
#         if os.path.exists(cache_path):
#             with open(cache_path, 'r', encoding='utf-8') as f:
#                 segments = json.load(f)
#         if not segments:
#             demo_frames = _synthesize_frames_for_demo(None)
#             return jsonify({"segment_id": -1, "frames": demo_frames})
#         if seg_idx is None:
#             segment = segments[-1]
#             seg_idx = len(segments) - 1
#         else:
#             if seg_idx < 0 or seg_idx >= len(segments):
#                 return jsonify({"error": "segment_id out of range"}), 400
#             segment = segments[seg_idx]
#         if isinstance(segment, dict) and 'frames' in segment and isinstance(segment['frames'], list) and segment['frames']:
#             return jsonify({"segment_id": seg_idx, "frames": segment['frames']})
#         if isinstance(segment, list) and segment:
#             return jsonify({"segment_id": seg_idx, "frames": segment})
#         frames = _synthesize_frames_for_demo(segment)
#         return jsonify({"segment_id": seg_idx, "frames": frames})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# --- Removed: _get_current_frames function ---
# def _get_current_frames():
#     try:
#         base_dir = os.path.dirname(__file__)
#         cache_path = os.path.join(base_dir, 'action_segments.json')
#         segments = []
#         if os.path.exists(cache_path):
#             with open(cache_path, 'r', encoding='utf-8') as f:
#                 cached_data = json.load(f)
#                 if isinstance(cached_data, list):
#                     if cached_data and isinstance(cached_data[-1], dict) and 'frames' in cached_data[-1]:
#                         return cached_data[-1]['frames']
#                     elif cached_data and isinstance(cached_data[-1], list):
#                         return cached_data[-1]
#                 elif isinstance(cached_data, dict) and 'frames' in cached_data:
#                     return cached_data['frames']
#                 elif isinstance(cached_data, list) and all(isinstance(item, dict) and 'keypoints' in item for item in cached_data):
#                     return cached_data
#         return _synthesize_frames_for_demo(None)
#     except Exception as e:
#         print('Error getting current frames for emitter:', e)
#         return []

def _emitter_loop(fps=10):
    """Background emitter loop: broadcasts synthetic frames to all connected socket.io clients."""
    interval = 1.0 / max(1, fps)
    
    # Always use synthetic frames since BLE service has been removed
    print("BLE service not available, using synthetic frames for demo.")
    frames = _synthesize_frames_for_demo(None)
    idx = 0
    while not _emitter_stop.is_set():
        if frames:
            frame = frames[idx % len(frames)]
            try:
                socketio.emit('frame', frame, namespace='/')
            except Exception as e:
                print('Emitter emit error (synthetic):', e)
            idx += 1
            time.sleep(interval)
        else:
            time.sleep(0.5)
        if _emitter_stop.is_set(): break

# --- Removed: _watcher_loop function ---
# def _watcher_loop(watch_dir, poll_interval=1.0):
#    ...

@socketio.on('connect')
def _on_connect():
    global _emitter_thread, _clients # Removed _watcher_thread
    with _clients_lock:
        _clients += 1
    print('Socket connected, clients=', _clients)
    # start emitter thread if not running
    if _emitter_thread is None or not _emitter_thread.is_alive():
        _emitter_stop.clear()
        _emitter_thread = threading.Thread(target=_emitter_loop, daemon=True)
        _emitter_thread.start()
    
    # --- Removed: Start watcher thread (no longer needed) ---
    # if _watcher_thread is None or not _watcher_thread.is_alive():
    #     _watcher_stop.clear()
    #     _watcher_thread = threading.Thread(target=_watcher_loop, args=(WATCH_DIR,), daemon=True)
    #     _watcher_thread.start()

@socketio.on('disconnect')
def _on_disconnect():
    global _clients
    with _clients_lock:
        _clients = max(0, _clients - 1)
    print('Socket disconnected, clients=', _clients)

@socketio.on('calibrate')
def _on_calibrate(data):
    print('Received calibrate message:', data)
    socketio.emit('calibrate_ack', {'status': 'ok'})

if __name__ == '__main__':
    # Flask-SocketIO uses its own event loop; ensure BLE service runs in its own asyncio loop in a separate thread
    try:
        socketio.run(app, host='0.0.0.0', port=5001, debug=True)
    except Exception as e:
        print('SocketIO run failed, falling back to Flask dev server:', e)
        app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)