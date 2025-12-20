# 训练记录路由
from flask import Blueprint, request, jsonify

training_bp = Blueprint('training', __name__)

# 训练记录相关接口（Mock实现）
@training_bp.route('/training/list', methods=['GET'])
def get_training_list_endpoint():
    """获取训练记录列表"""
    return jsonify({
        "total": 128,
        "list": [
            {"id": i, "date": f"2025-12-{17-i//10}", "type": "训练", "score": 8.0 + i*0.1}
            for i in range(1, 21)
        ]
    }), 200

@training_bp.route('/training/detail/<int:id>', methods=['GET'])
def get_training_detail_endpoint(id):
    """获取训练记录详情"""
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

@training_bp.route('/training/delete/<int:id>', methods=['POST'])
def delete_training_endpoint(id):
    """删除训练记录"""
    return jsonify({"message": "训练记录删除成功"}), 200

@training_bp.route('/training/stats', methods=['GET'])
def get_training_stats_endpoint():
    """获取训练统计数据"""
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