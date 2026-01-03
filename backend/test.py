from analysis_engine import create_skeleton_video_yolo
import os

# 找一个你 uploads 文件夹里现有的视频文件名
input_v = "uploads/analysis_20251220_165747_33292_8649_original.mp4"
output_v = "reports/test_out.mp4"

print("开始测试分析引擎...")
res = create_skeleton_video_yolo(input_v, output_v)
print(f"分析结果: {res}")