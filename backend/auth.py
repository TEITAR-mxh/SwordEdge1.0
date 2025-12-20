# 认证路由
from flask import Blueprint, request, jsonify
import time

auth_bp = Blueprint('auth', __name__)

# 用户认证相关接口（Mock实现）
@auth_bp.route('/login', methods=['POST'])
def login_endpoint():
    """用户登录接口"""
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
                "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}",
                "level": "中级剑士",
                "trainingDays": 45
            },
            "message": "登录成功"
        }), 200
    else:
        return jsonify({"error": "用户名或密码不能为空"}), 400

@auth_bp.route('/register', methods=['POST'])
def register_endpoint():
    """用户注册接口"""
    data = request.json
    return jsonify({"message": "注册成功，请登录"}), 201

@auth_bp.route('/logout', methods=['POST'])
def logout_endpoint():
    """用户登出接口"""
    return jsonify({"message": "登出成功"}), 200

@auth_bp.route('/user/info', methods=['GET'])
def get_user_info_endpoint():
    """获取用户信息接口"""
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

@auth_bp.route('/user/update', methods=['POST'])
def update_user_info_endpoint():
    """更新用户信息接口"""
    data = request.json
    return jsonify({"message": "用户信息更新成功"}), 200