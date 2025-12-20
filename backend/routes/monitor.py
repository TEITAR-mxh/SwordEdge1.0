from flask import Blueprint, request, jsonify
import time

monitor_bp = Blueprint('monitor', __name__)

# 简单的启动监控接口，前端通过此接口准备或通知后端
@monitor_bp.route('/monitor/start', methods=['OPTIONS', 'POST'])
def start_monitor():
    # OPTIONS 会被 Flask-CORS 处理，如需自定义响应可在此处返回
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    # POST 请求：可以接受参数用于配置流媒体或后端分析
    data = request.get_json(silent=True) or {}
    # 这里可以初始化后端实时分析资源；当前实现为轻量响应
    return jsonify({'status': 'ok', 'message': 'monitor started', 'config': data}), 200

@monitor_bp.route('/monitor/stop', methods=['POST'])
def stop_monitor():
    # 停止监控的清理逻辑（若有）
    return jsonify({'status': 'ok', 'message': 'monitor stopped'}), 200

@monitor_bp.route('/monitor/realtime', methods=['GET'])
def get_realtime():
    # 提供一个简单的轮询接口作为 WebSocket 的备选
    return jsonify({'status': 'ok', 'data': []}), 200
