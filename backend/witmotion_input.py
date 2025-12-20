# 文件名: backend/witmotion_input.py
# 功能: 解析Witmotion TXT数据，分段识别标准击剑动作并嵌入合理姿态特征

import numpy as np
import pandas as pd
import sys
sys.path.append('.')
from analysis_engine import analyze_witmotion_segment
import json
import os
import math

# 动作类型及合理区间定义
ACTION_DEFINITIONS = {
    "进攻直刺": {
        "AsX": (10, 50),   # 加速度快速变化
        "AsY": (10, 50),
        "AsZ": (10, 50),
        "Q0-Q3_var": (0.1, 1.0), # 四元数变化大
        "HX": (5, 50),    # 磁力波动
        "HY": (5, 50),
        "HZ": (40, 60)
    },
    "准备姿势": {
        "AsX": (-5, 5),   # 加速度稳定
        "AsY": (-5, 5),
        "AsZ": (-5, 5),
        "Q0-Q3_var": (0.0, 0.2), # 四元数稳定
        "HX": (5, 15),    # 磁力稳定
        "HY": (30, 40),
        "HZ": (40, 50)
    },
    "防守后撤": {
        "AsX": (-50, -10), # 加速度负向变化
        "AsY": (-50, -10),
        "AsZ": (-50, -10),
        "Q0-Q3_var": (0.1, 0.8), # 四元数后仰
        "HX": (-50, 5),   # 磁力变化
        "HY": (-50, 5),
        "HZ": (30, 60)
    },
    "格挡姿势": {
        "AsZ": (10, 60),  # Z轴加速度上升
        "Q0-Q3_var": (0.2, 1.0), # 四元数抬臂
        "HX": (5, 50),
        "HY": (5, 50),
        "HZ": (40, 60)
    }
}


def parse_witmotion_txt(file_path):
    """
    解析Witmotion TXT数据，返回DataFrame
    """
    df = pd.read_csv(file_path, sep='\t')
    return df


def extract_action_segments(df):
    """
    按加速度和四元数变化分段，识别动作类型并嵌入合理姿态特征
    """
    segments = []
    window = 10
    for i in range(0, len(df)-window, window):
        seg = df.iloc[i:i+window]
        asx_mean = seg['AsX'].mean()
        asy_mean = seg['AsY'].mean()
        asz_mean = seg['AsZ'].mean()
        hx_mean = seg['HX'].mean()
        hy_mean = seg['HY'].mean()
        hz_mean = seg['HZ'].mean()
        q_var = np.var(seg[['Q0','Q1','Q2','Q3']].values)
        # 动作判定
        action_type = '准备姿势'
        for act, rule in ACTION_DEFINITIONS.items():
            if (rule.get('AsX',(-np.inf,np.inf))[0] <= asx_mean <= rule.get('AsX',(-np.inf,np.inf))[1] and
                rule.get('AsY',(-np.inf,np.inf))[0] <= asy_mean <= rule.get('AsY',(-np.inf,np.inf))[1] and
                rule.get('AsZ',(-np.inf,np.inf))[0] <= asz_mean <= rule.get('AsZ',(-np.inf,np.inf))[1] and
                rule.get('Q0-Q3_var',(0,np.inf))[0] <= q_var <= rule.get('Q0-Q3_var',(0,np.inf))[1]):
                action_type = act
                break
        frames = generate_frames_from_segment(seg)
        segments.append({
            'start_time': seg['PCTime'].iloc[0],
            'end_time': seg['PCTime'].iloc[-1],
            'action_type': action_type,
            'features': {
                'AsX_mean': asx_mean,
                'AsY_mean': asy_mean,
                'AsZ_mean': asz_mean,
                'HX_mean': hx_mean,
                'HY_mean': hy_mean,
                'HZ_mean': hz_mean,
                'Q_var': q_var
            },
            'frames': frames
        })
    return segments


def quaternion_to_rot_matrix(q0, q1, q2, q3):
    # assume q0 is w (scalar), q1,q2,q3 are x,y,z (vector)
    w, x, y, z = float(q0), float(q1), float(q2), float(q3)
    # normalize
    n = math.sqrt(w*w + x*x + y*y + z*z) if (w or x or y or z) else 1.0
    w, x, y, z = w/n, x/n, y/n, z/n
    xx = x * x
    yy = y * y
    zz = z * z
    xy = x * y
    xz = x * z
    yz = y * z
    wx = w * x
    wy = w * y
    wz = w * z
    # rotation matrix
    return np.array([
        [1 - 2*(yy + zz),     2*(xy - wz),       2*(xz + wy)],
        [2*(xy + wz),         1 - 2*(xx + zz),   2*(yz - wx)],
        [2*(xz - wy),         2*(yz + wx),       1 - 2*(xx + yy)]
    ])


def _base_skeleton_points():
    # define a simple 13-keypoint skeleton in neutral pose (normalized units)
    # order: head(0), neck(1), l_shoulder(2), r_shoulder(3), l_elbow(4), r_elbow(5), l_wrist(6), r_wrist(7),
    # hip(8), l_knee(9), r_knee(10), l_ankle(11), r_ankle(12)
    return np.array([
        [0.0, 0.9, 0.0],   # head
        [0.0, 0.6, 0.0],   # neck
        [-0.25, 0.55, 0.0],# l_shoulder
        [0.25, 0.55, 0.0], # r_shoulder
        [-0.45, 0.2, 0.0], # l_elbow
        [0.45, 0.2, 0.0],  # r_elbow
        [-0.55, -0.2, 0.0],# l_wrist
        [0.55, -0.2, 0.0], # r_wrist
        [0.0, 0.0, 0.0],   # hip
        [-0.2, -0.6, 0.0], # l_knee
        [0.2, -0.6, 0.0],  # r_knee
        [-0.2, -1.0, 0.0], # l_ankle
        [0.2, -1.0, 0.0],  # r_ankle
    ])


def generate_frames_from_segment(seg_df, max_frames=None):
    """Generate per-row frames from DataFrame segment.
    Each frame contains normalized keypoints based on quaternion orientation and small translation from accelerometer.
    """
    base = _base_skeleton_points()
    frames = []
    rows = seg_df.to_dict('records')
    if max_frames and max_frames < len(rows):
        # sample evenly
        idxs = np.linspace(0, len(rows)-1, max_frames).astype(int)
        rows = [rows[i] for i in idxs]

    for r in rows:
        try:
            q0 = r.get('Q0', 1.0)
            q1 = r.get('Q1', 0.0)
            q2 = r.get('Q2', 0.0)
            q3 = r.get('Q3', 0.0)
            rot = quaternion_to_rot_matrix(q0, q1, q2, q3)
        except Exception:
            rot = np.eye(3)

        # apply rotation
        pts = (rot.dot(base.T)).T

        # small translation from accelerometer means (scale down)
        tx = float(r.get('AsX', 0.0)) / 200.0
        ty = float(r.get('AsY', 0.0)) / 200.0
        tz = float(r.get('AsZ', 0.0)) / 200.0

        keypoints = []
        for p in pts:
            x = float(p[0] + tx + (np.random.rand()-0.5)*0.01)
            y = float(p[1] + ty + (np.random.rand()-0.5)*0.01)
            z = float(p[2] + tz + (np.random.rand()-0.5)*0.01)
            keypoints.append({'x': x, 'y': y, 'z': z})

        frames.append({
            'time': r.get('PCTime'),
            'keypoints': keypoints,
            'quaternion': {
                'q0': q0,
                'q1': q1,
                'q2': q2,
                'q3': q3
            }
        })

    return frames


def main(file_path):
    df = parse_witmotion_txt(file_path)
    segments = extract_action_segments(df)
    for seg in segments:
        result = analyze_witmotion_segment(seg)
        print(f"动作: {result['action_type']} | 时间: {seg['start_time']}~{seg['end_time']} | 评分: {result['score']} | 姿态特征: {result['features']}")
    # 将分段结果写入到后端可访问的JSON文件，便于前端拉取
    try:
        base_dir = os.path.dirname(__file__)
        out_path = os.path.join(base_dir, 'action_segments.json')
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(segments, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"写入 action_segments.json 时出错: {e}")

    return segments

# 用法示例
if __name__ == "__main__":
    main('d:/Witmotion(V2025.11.5.0)/Record/magData/EllipseFitting_143125905.txt')
