# 训练计划路由
from flask import Blueprint, request, jsonify

plan_bp = Blueprint('plan', __name__)

# 训练计划相关接口（Mock实现）
@plan_bp.route('/plans/list', methods=['GET'])
def get_plan_list_endpoint():
    """获取训练计划列表"""
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

@plan_bp.route('/plans/detail/<int:id>', methods=['GET'])
def get_plan_detail_endpoint(id):
    """获取计划详情"""
    return jsonify({
        "id": id,
        "title": "基础击剑入门",
        "level": "初级",
        "duration": "4周",
        "progress": 75,
        "description": "适合初学者的基础击剑训练计划，涵盖基本姿势、步法和进攻技术。",
        "sessions": [
            {
                "week": 1,
                "day": 1,
                "title": "基本姿势训练",
                "duration": 30,
                "completed": True
            },
            {
                "week": 1,
                "day": 2,
                "title": "步法基础",
                "duration": 30,
                "completed": True
            }
        ]
    }), 200

@plan_bp.route('/plans/create', methods=['POST'])
def create_plan_endpoint():
    """创建自定义计划"""
    data = request.json
    return jsonify({
        "id": 4,
        "message": "训练计划创建成功"
    }), 201

@plan_bp.route('/plans/progress/<int:id>', methods=['POST'])
def update_plan_progress_endpoint(id):
    """更新计划进度"""
    data = request.json
    return jsonify({
        "id": id,
        "progress": 50,
        "message": "计划进度更新成功"
    }), 200