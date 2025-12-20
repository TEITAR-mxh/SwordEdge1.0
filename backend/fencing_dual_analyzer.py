import cv2
import mediapipe as mp
import numpy as np
import math
import time
import argparse
import os
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator
import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk
import struct
import ssl
import urllib.request

# Disable SSL verification globally for all downloads
ssl._create_default_https_context = ssl._create_unverified_context

# --- MediaPipe Initialization ---
import os
import ssl

# Disable SSL verification for MediaPipe model downloads
original_ssl_context = ssl._create_default_https_context
ssl._create_default_https_context = ssl._create_unverified_context

try:
    mp_pose = mp.solutions.pose
    mp_drawing = mp.solutions.drawing_utils
except Exception as e:
    print(f"Error initializing MediaPipe: {e}")
    print("\n=== SSL Certificate Verification Failed ===")
    print("To resolve this issue, please manually download the required model:")
    print("1. Download the pose model from:")
    print("   https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task")
    print("2. Create the target directory if it doesn't exist:")
    print("   mkdir -p ~/.local/lib/python3.12/site-packages/mediapipe/modules/pose_landmark/")
    print("3. Move the downloaded file to the directory and rename it:")
    print("   mv ~/Downloads/pose_landmarker_lite.task ~/.local/lib/python3.12/site-packages/mediapipe/modules/pose_landmark/pose_landmark_lite.tflite")
    print("4. Set proper permissions:")
    print("   chmod 644 ~/.local/lib/python3.12/site-packages/mediapipe/modules/pose_landmark/pose_landmark_lite.tflite")
    print("\nAfter completing these steps, please restart the application.")
    print("If you continue to experience issues, please check your network connection and try again.")
    print("Alternatively, you can try installing the system certificates:")
    print("   sudo /Applications/Python\\ 3.12/Install\\ Certificates.command")
    raise

# Restore original SSL context
ssl._create_default_https_context = original_ssl_context

# --- Color Definitions (BGR format) ---
COLORS = {
    "P1_main": (255, 100, 0), "P2_main": (0, 100, 255),
    "P1_good": (100, 255, 0), "P2_good": (0, 255, 100),
    "P_bad": (0, 165, 255), "P_very_bad": (50, 50, 220),
    "neutral_skeleton": (180, 180, 180), "action_text": (255, 255, 0),
    "angle_text": (230, 230, 230),
    "bbox_P1": (255, 150, 50), "bbox_P2": (50, 150, 255),
    "bbox_unassigned": (100, 100, 100)
}

# --- OpenCV DNN Person Detector Setup ---
# 使用OpenCV内置的 MobileNet-SSD 模型进行人体检测
# 这些文件通常随OpenCV安装或可以从OpenCV的GitHub仓库下载
# 注意：你需要确保这些模型文件路径正确，或者OpenCV能自动找到它们
# 如果路径不正确，程序会报错。你可以从OpenCV的extra modules的dnn_models下载
# https://github.com/opencv/opencv_extra/tree/master/testdata/dnn
prototxt_path = "models/MobileNetSSD_deploy.prototxt.txt" # 你可能需要下载并指定正确路径
model_path = "models/MobileNetSSD_deploy.caffemodel" # 你可能需要下载并指定正确路径

# 检查模型文件是否存在
if not (os.path.exists(prototxt_path) and os.path.exists(model_path)):
    print("错误：MobileNetSSD模型文件未找到。请将 'MobileNetSSD_deploy.prototxt' 和 'MobileNetSSD_deploy.caffemodel' 放在 'models' 文件夹下，或修改路径。")
    print("你可以从 OpenCV extra repo 下载: https://github.com/opencv/opencv_extra/tree/master/testdata/dnn")
    # 为了让代码能继续（在没有模型文件的情况下，检测部分将不起作用），我们不直接退出
    # 而是设置一个标志，让检测函数返回空列表。
    PERSON_DETECTOR_LOADED = False
    person_detector_net = None
else:
    try:
        person_detector_net = cv2.dnn.readNetFromCaffe(prototxt_path, model_path)
        PERSON_DETECTOR_LOADED = True
        print("人体检测模型加载成功。")
    except cv2.error as e:
        print(f"加载人体检测模型失败: {e}")
        PERSON_DETECTOR_LOADED = False
        person_detector_net = None

PERSON_CLASS_ID = 15 # 在MobileNet-SSD中，类别15是 'person'
PERSON_DETECTION_CONFIDENCE = 0.4 # 人体检测的置信度阈值

# --- Helper Functions (get_pixel_coords, calculate_angle_and_coords - same as before) ---
def get_pixel_coords(landmark, img_width, img_height):
    if landmark is None or (hasattr(landmark, 'visibility') and landmark.visibility < 0.3):
        return None
    return (int(landmark.x * img_width), int(landmark.y * img_height))

def calculate_angle_and_coords(a_lm, b_lm, c_lm, img_width, img_height):
    pa = get_pixel_coords(a_lm, img_width, img_height)
    pb = get_pixel_coords(b_lm, img_width, img_height)
    pc = get_pixel_coords(c_lm, img_width, img_height)
    if not all([pa, pb, pc]): return None, None
    pa_np, pb_np, pc_np = np.array(pa), np.array(pb), np.array(pc)
    radians = np.arctan2(pc_np[1]-pb_np[1], pc_np[0]-pb_np[0]) - \
              np.arctan2(pa_np[1]-pb_np[1], pa_np[0]-pb_np[0])
    angle = np.abs(radians*180.0/np.pi)
    if angle > 180.0: angle = 360-angle
    return angle, pb

# --- Posture Evaluation Function (evaluate_player_posture_en - same as before) ---
def evaluate_player_posture_en(player_id, landmarks_list, img_width, img_height):
    feedback_details = []
    score = 0
    num_criteria_evaluated = 0
    visibility_threshold = 0.5
    lm_indices = {name: landmark_enum.value for name, landmark_enum in [
        ("L_SHOULDER", mp_pose.PoseLandmark.LEFT_SHOULDER),("L_ELBOW", mp_pose.PoseLandmark.LEFT_ELBOW),
        ("L_WRIST", mp_pose.PoseLandmark.LEFT_WRIST), ("L_HIP", mp_pose.PoseLandmark.LEFT_HIP),
        ("L_KNEE", mp_pose.PoseLandmark.LEFT_KNEE), ("L_ANKLE", mp_pose.PoseLandmark.LEFT_ANKLE),
        ("R_SHOULDER", mp_pose.PoseLandmark.RIGHT_SHOULDER),("R_ELBOW", mp_pose.PoseLandmark.RIGHT_ELBOW),
        ("R_WRIST", mp_pose.PoseLandmark.RIGHT_WRIST), ("R_HIP", mp_pose.PoseLandmark.RIGHT_HIP),
        ("R_KNEE", mp_pose.PoseLandmark.RIGHT_KNEE), ("R_ANKLE", mp_pose.PoseLandmark.RIGHT_ANKLE),
    ]}
    player_lms = {}
    valid_landmarks = True
    if len(landmarks_list) >= max(lm_indices.values()) + 1:
        for name, idx in lm_indices.items():
            if hasattr(landmarks_list[idx], 'visibility'): player_lms[name] = landmarks_list[idx]
            else: valid_landmarks = False; break
    else: valid_landmarks = False
    if not valid_landmarks: return feedback_details, 0, 0

    def check_visibility(keys): return all(key in player_lms and player_lms[key].visibility > visibility_threshold for key in keys)
    criteria_definitions = [
        {"name": "Front Knee", "lms_keys": ["L_HIP", "L_KNEE", "L_ANKLE"], "ideal_range": (85, 125)},
        {"name": "Rear Knee", "lms_keys": ["R_HIP", "R_KNEE", "R_ANKLE"], "ideal_range": (115, 155)},
        {"name": "Weapon Elbow", "lms_keys": ["R_SHOULDER", "R_ELBOW", "R_WRIST"], "ideal_range": (100, 150)},
        {"name": "Off-Arm Elbow", "lms_keys": ["L_SHOULDER", "L_ELBOW", "L_WRIST"], "ideal_range": (70, 130)},
        {"name": "Shoulder Level", "lms_keys": ["L_SHOULDER", "R_SHOULDER"], "ideal_range": (-20, 20)}
    ]
    total_possible_score = 0
    status_map_en = {"良好": "Good", "过弯": "Over-Bent", "不足": "Under-Extended", "倾斜": "Tilted", "不清晰": "Not Clear"}
    for crit in criteria_definitions:
        total_possible_score +=1; angle, vertex_coord = None, None; status_cn = "不清晰"
        if "Shoulder Level" not in crit["name"]:
            if check_visibility(crit["lms_keys"]):
                angle, vertex_coord = calculate_angle_and_coords(player_lms[crit["lms_keys"][0]], player_lms[crit["lms_keys"][1]], player_lms[crit["lms_keys"][2]], img_width, img_height)
                if angle is not None:
                    num_criteria_evaluated += 1; ideal_min, ideal_max = crit["ideal_range"]
                    if ideal_min <= angle <= ideal_max: status_cn = "良好"; score += 1
                    elif angle < ideal_min: status_cn = "过弯"
                    else: status_cn = "不足"
        else:
            if check_visibility(crit["lms_keys"]):
                ls_pix, rs_pix = get_pixel_coords(player_lms["L_SHOULDER"], img_width, img_height), get_pixel_coords(player_lms["R_SHOULDER"], img_width, img_height)
                if ls_pix and rs_pix:
                    num_criteria_evaluated +=1; vertex_coord = ((ls_pix[0]+rs_pix[0])//2, (ls_pix[1]+rs_pix[1])//2 - 20)
                    shoulder_dy, shoulder_dx = rs_pix[1] - ls_pix[1], rs_pix[0] - ls_pix[0]
                    if abs(shoulder_dx) > 0.01:
                        angle = math.degrees(math.atan2(shoulder_dy, shoulder_dx))
                        if crit["ideal_range"][0] <= angle <= crit["ideal_range"][1]: status_cn = "良好"; score +=1
                        else: status_cn = "倾斜"
                    else: status_cn = "不清晰"
        feedback_details.append({'name': crit['name'], 'angle': angle, 'status_en': status_map_en.get(status_cn, "Unknown"), 'status_cn_for_color': status_cn, 'vertex_coord': vertex_coord, 'involved_landmarks_enum_values': [lm_indices[key] for key in crit["lms_keys"]]})
    return feedback_details, score, total_possible_score

# --- Basic Action Prompts (basic_action_prompts_en - same as before) ---
def basic_action_prompts_en(landmarks_list, img_width, img_height, prev_landmarks_list=None):
    actions_en = []
    if len(landmarks_list) < max(mp_pose.PoseLandmark) + 1: return actions_en
    right_wrist_lm, right_shoulder, right_elbow = landmarks_list[mp_pose.PoseLandmark.RIGHT_WRIST.value], landmarks_list[mp_pose.PoseLandmark.RIGHT_SHOULDER.value], landmarks_list[mp_pose.PoseLandmark.RIGHT_ELBOW.value]
    left_knee, left_hip, left_ankle = landmarks_list[mp_pose.PoseLandmark.LEFT_KNEE.value], landmarks_list[mp_pose.PoseLandmark.LEFT_HIP.value], landmarks_list[mp_pose.PoseLandmark.LEFT_ANKLE.value]
    right_knee, right_hip, right_ankle = landmarks_list[mp_pose.PoseLandmark.RIGHT_KNEE.value], landmarks_list[mp_pose.PoseLandmark.RIGHT_HIP.value], landmarks_list[mp_pose.PoseLandmark.RIGHT_ANKLE.value]
    if all(hasattr(lm, 'visibility') and lm.visibility > 0.6 for lm in [right_shoulder, right_elbow, right_wrist_lm]):
        arm_angle, _ = calculate_angle_and_coords(right_shoulder, right_elbow, right_wrist_lm, img_width, img_height)
        if arm_angle is not None and arm_angle > 160: actions_en.append("Lunge/Attack Stance")
    if all(hasattr(lm, 'visibility') and lm.visibility > 0.6 for lm in [left_hip, left_knee, left_ankle, right_hip, right_knee, right_ankle]):
        front_knee_angle, _ = calculate_angle_and_coords(left_hip, left_knee, left_ankle, img_width, img_height)
        back_knee_angle, _ = calculate_angle_and_coords(right_hip, right_knee, right_ankle, img_width, img_height)
        if front_knee_angle is not None and back_knee_angle is not None and front_knee_angle < 100 and back_knee_angle > 140:
            actions_en.append("Lunge Posture")
    return actions_en

# --- New Function: Detect Persons using OpenCV DNN ---
def detect_persons_dnn(frame, net, confidence_threshold=0.5):
    if not PERSON_DETECTOR_LOADED or net is None:
        return [] # Return empty if model not loaded
    (h, w) = frame.shape[:2]
    blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 0.007843, (300, 300), 127.5)
    net.setInput(blob)
    detections = net.forward()
    person_bboxes = []
    for i in range(detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence > confidence_threshold:
            class_id = int(detections[0, 0, i, 1])
            if class_id == PERSON_CLASS_ID:
                box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                (startX, startY, endX, endY) = box.astype("int")
                # Ensure box is within frame boundaries
                startX, startY = max(0, startX), max(0, startY)
                endX, endY = min(w - 1, endX), min(h - 1, endY)
                if startX < endX and startY < endY: # Valid box
                    person_bboxes.append((startX, startY, endX, endY))
    return person_bboxes

# --- New Function: Convert ROI landmarks to Frame landmarks ---
def convert_roi_landmarks_to_frame(roi_landmarks, roi_x, roi_y, roi_w, roi_h, frame_w, frame_h):
    from mediapipe.framework.formats import landmark_pb2
    
    # Create a new NormalizedLandmarkList
    frame_landmarks = landmark_pb2.NormalizedLandmarkList()
    
    if roi_landmarks and hasattr(roi_landmarks, 'landmark'):
        for roi_lm in roi_landmarks.landmark:
            # Create a new landmark in the list
            frame_lm = frame_landmarks.landmark.add()
            
            # Convert coordinates from ROI to frame space
            frame_lm.x = (roi_lm.x * roi_w + roi_x) / frame_w
            frame_lm.y = (roi_lm.y * roi_h + roi_y) / frame_h
            frame_lm.z = roi_lm.z
            
            # Copy visibility and presence if they exist
            if hasattr(roi_lm, 'visibility'):
                frame_lm.visibility = roi_lm.visibility
            if hasattr(roi_lm, 'presence'):
                frame_lm.presence = roi_lm.presence
                
    return frame_landmarks


# --- Simple IOU Tracker ---
tracked_players = {} # {track_id: {"bbox": (x1,y1,x2,y2), "id": player_id (1 or 2), "frames_missed": 0, "last_center_x": cx}}
next_track_id = 0
MAX_MISSES = 10 # Frames to keep a track without detection

def calculate_iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])
    interArea = max(0, xB - xA + 1) * max(0, yB - yA + 1)
    boxAArea = (boxA[2] - boxA[0] + 1) * (boxA[3] - boxA[1] + 1)
    boxBArea = (boxB[2] - boxB[0] + 1) * (boxB[3] - boxB[1] + 1)
    iou = interArea / float(boxAArea + boxBArea - interArea)
    return iou

def update_tracker(detected_bboxes_current_frame):
    global tracked_players, next_track_id
    
    # Predict next state (not doing for simple IOU) & Increment misses
    for tid in list(tracked_players.keys()):
        tracked_players[tid]["frames_missed"] += 1
        if tracked_players[tid]["frames_missed"] > MAX_MISSES:
            print(f"Tracker: Removing track {tid} (Player {tracked_players[tid]['id']}) due to misses.")
            del tracked_players[tid]

    if not detected_bboxes_current_frame:
        return [] # No new detections

    # Match detections to existing tracks
    unmatched_detections = list(range(len(detected_bboxes_current_frame)))
    matched_track_ids_this_frame = set()
    
    assignments = [] # [(track_id, detection_idx, iou_score), ...]

    for tid, track_data in tracked_players.items():
        best_iou = 0
        best_det_idx = -1
        for i, det_bbox in enumerate(detected_bboxes_current_frame):
            if i not in unmatched_detections: continue # Already used
            iou = calculate_iou(track_data["bbox"], det_bbox)
            if iou > best_iou and iou > 0.3: # IOU threshold for matching
                best_iou = iou
                best_det_idx = i
        if best_det_idx != -1:
            assignments.append((tid, best_det_idx, best_iou))
    
    # Resolve multiple tracks竞争同一个detection (取IOU最高的)
    # Resolve multiple detections竞争同一个track (也取IOU最高的)
    # This is a simplification; proper assignment uses Hungarian algorithm or similar
    assignments.sort(key=lambda x: x[2], reverse=True) # Sort by IOU desc
    
    final_matches = {} # track_id -> detection_idx
    used_detections_indices = set()
    
    for tid, det_idx, iou in assignments:
        if tid not in final_matches and det_idx not in used_detections_indices:
            final_matches[tid] = det_idx
            used_detections_indices.add(det_idx)
            
            # Update track
            new_bbox = detected_bboxes_current_frame[det_idx]
            tracked_players[tid]["bbox"] = new_bbox
            tracked_players[tid]["frames_missed"] = 0
            tracked_players[tid]["last_center_x"] = (new_bbox[0] + new_bbox[2]) / 2
            
            # Remove from unmatched_detections by value (index of detection)
            if det_idx in unmatched_detections: unmatched_detections.remove(det_idx)


    # Add new tracks for unmatched detections
    # Simple P1/P2 assignment based on current x-coordinate for new tracks
    # This needs to be smarter to maintain P1/P2 consistently if one drops and reappears
    
    # Determine which player IDs are currently active
    active_player_ids = {data["id"] for data in tracked_players.values()}
    available_player_ids = []
    if 1 not in active_player_ids: available_player_ids.append(1)
    if 2 not in active_player_ids: available_player_ids.append(2)
    available_player_ids.sort() # Prefer assigning P1 first

    # Sort unmatched detections by x-coordinate to assign P1/P2 if both are new
    unmatched_detections_data = []
    for det_idx in unmatched_detections:
        bbox = detected_bboxes_current_frame[det_idx]
        unmatched_detections_data.append({
            "bbox": bbox,
            "center_x": (bbox[0] + bbox[2]) / 2,
            "original_det_idx": det_idx
        })
    unmatched_detections_data.sort(key=lambda x: x["center_x"])


    for det_data in unmatched_detections_data:
        if not available_player_ids: break # No more player IDs to assign
        
        player_id_to_assign = available_player_ids.pop(0)
        
        new_bbox = det_data["bbox"]
        tracked_players[next_track_id] = {
            "bbox": new_bbox,
            "id": player_id_to_assign,
            "frames_missed": 0,
            "last_center_x": (new_bbox[0] + new_bbox[2]) / 2
        }
        print(f"Tracker: New track {next_track_id} assigned to Player {player_id_to_assign}")
        next_track_id += 1

    # Prepare output: list of {"id": player_id (1 or 2), "bbox": bbox}
    current_frame_tracked_persons = []
    for tid, data in tracked_players.items():
        current_frame_tracked_persons.append({"id": data["id"], "bbox": data["bbox"], "track_id": tid})
        
    # Re-sort by player ID for consistent processing order if needed
    current_frame_tracked_persons.sort(key=lambda x: x["id"])
    return current_frame_tracked_persons


# --- Main Video Processing Function ---
def process_dual_video_detector_en(video_path, output_path=None, show_realtime=True, conf_threshold_person=0.4, conf_threshold_pose=0.5, model_complexity_pose=1):
    global tracked_players, next_track_id # Use global tracker variables
    tracked_players = {} 
    next_track_id = 0

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened(): print(f"Error: Could not open video file {video_path}"); return {}

    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Video Info: {frame_width}x{frame_height} @ {fps:.2f} FPS, Total Frames: {total_frames}")

    # Pose estimator for ROIs (static mode is better for single images/ROIs)
    pose_estimator_roi = mp_pose.Pose(static_image_mode=True, model_complexity=model_complexity_pose,
                                      min_detection_confidence=conf_threshold_pose)
    writer = None
    if output_path:
        output_dir = os.path.dirname(output_path); 
        if output_dir and not os.path.exists(output_dir): os.makedirs(output_dir, exist_ok=True)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v'); 
        writer = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))
        print(f"Outputting processed video to: {output_path}")

    frame_count = 0; start_time = time.time(); frame_data_log = []
    p1_stats = {"Lunge/Attack Stance": 0, "Lunge Posture": 0, "total_frames_detected":0, "cumulative_score":0, "id": 1}
    p2_stats = {"Lunge/Attack Stance": 0, "Lunge Posture": 0, "total_frames_detected":0, "cumulative_score":0, "id": 2}

    while cap.isOpened():
        success, frame = cap.read()
        if not success: print("Video processing finished or failed to read frame."); break
        frame_count += 1
        output_frame = frame.copy()
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) # For pose model

        # 1. Detect Persons
        detected_person_bboxes = detect_persons_dnn(frame, person_detector_net, conf_threshold_person)

        # 2. Update Tracker & Get current assignments
        current_tracked_info = update_tracker(detected_person_bboxes) # Returns list of {"id": P_ID, "bbox": bbox, "track_id": TID}

        current_p1_score_percent, current_p2_score_percent = 0, 0
        current_p1_actions_en, current_p2_actions_en = [], []

        for person_info in current_tracked_info:
            player_id = person_info["id"]
            x1, y1, x2, y2 = person_info["bbox"]
            track_id = person_info["track_id"] # Get track_id for debugging/display

            # Draw BBox with Player ID
            bbox_color = COLORS.get(f"bbox_P{player_id}", COLORS["bbox_unassigned"])
            cv2.rectangle(output_frame, (x1, y1), (x2, y2), bbox_color, 2)
            cv2.putText(output_frame, f"P{player_id} (TID:{track_id})", (x1, y1 - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, bbox_color, 2)

            # 3. Pose Estimation on ROI
            roi_bgr = frame[y1:y2, x1:x2] # Use BGR for MediaPipe if it handles conversion, else RGB
            roi_rgb = cv2.cvtColor(roi_bgr, cv2.COLOR_BGR2RGB)
            
            if roi_rgb.size == 0: continue

            roi_results = pose_estimator_roi.process(roi_rgb)

            if roi_results.pose_landmarks:
                # Convert ROI landmarks to full frame coordinates
                full_frame_landmarks = convert_roi_landmarks_to_frame(
                    roi_results.pose_landmarks,
                    x1, y1, roi_bgr.shape[1], roi_bgr.shape[0],
                    frame_width, frame_height
                )
                
                # Extract Python list of landmark objects for evaluation functions
                full_frame_landmarks_list = [lm for lm in full_frame_landmarks.landmark]

                # Draw landmarks on original frame with enhanced visibility
                color_main = COLORS[f"P{player_id}_main"]
                mp_drawing.draw_landmarks(
                    output_frame,
                    full_frame_landmarks,
                    mp_pose.POSE_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=color_main, thickness=4, circle_radius=5),  # Thicker connections
                    mp_drawing.DrawingSpec(color=color_main, thickness=4, circle_radius=4)   # Larger landmarks
                )
                
                # Evaluate posture (using full_frame_landmarks_list)
                feedback_items, score, total_possible = evaluate_player_posture_en(
                    player_id, full_frame_landmarks_list, frame_width, frame_height
                )
                score_percent = (score / total_possible * 100) if total_possible > 0 else 0

                stats_ref = p1_stats if player_id == 1 else p2_stats
                stats_ref["total_frames_detected"] += 1
                stats_ref["cumulative_score"] += score_percent
                if player_id == 1: current_p1_score_percent = score_percent
                else: current_p2_score_percent = score_percent

                # Display score and feedback on video
                nose_lm_obj = full_frame_landmarks_list[mp_pose.PoseLandmark.NOSE.value]
                text_x_abs, text_y_abs = get_pixel_coords(nose_lm_obj, frame_width, frame_height) if nose_lm_obj else (x1, y1 + 20)
                
                cv2.putText(output_frame, f"P{player_id} Score: {score_percent:.0f}%", (text_x_abs, text_y_abs - 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color_main, 2)
                
                # ... (Display detailed feedback and actions - similar to previous, using text_x_abs, text_y_abs)
                feedback_y_offset = text_y_abs
                for i, item in enumerate(feedback_items[:2]):
                    angle_str = f" ({item['angle']:.0f}deg)" if item['angle'] is not None else ""
                    feedback_line = f"{item['name']}{angle_str}: {item['status_en']}"
                    cv2.putText(output_frame, feedback_line, (text_x_abs, feedback_y_offset + (i+1)*18),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.45, COLORS['angle_text'], 1)

                actions_en = basic_action_prompts_en(full_frame_landmarks_list, frame_width, frame_height)
                if player_id == 1: current_p1_actions_en = actions_en
                else: current_p2_actions_en = actions_en
                
                action_y_offset = text_y_abs + (len(feedback_items[:2]) +1 )*18
                for i, action in enumerate(actions_en[:1]):
                    cv2.putText(output_frame, action, (text_x_abs, action_y_offset + i*18),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, COLORS["action_text"], 1)
                    if action in stats_ref: stats_ref[action] +=1


        if not current_tracked_info: # No one tracked in this frame
            cv2.putText(output_frame, "No Fencers Tracked", (10,30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,255),2)
        
        frame_data_log.append((frame_count, current_p1_score_percent, current_p2_score_percent,
                               ",".join(current_p1_actions_en) if current_p1_actions_en else "N/A",
                               ",".join(current_p2_actions_en) if current_p2_actions_en else "N/A"))

        # Progress text
        elapsed_time = time.time() - start_time
        processing_fps = frame_count / elapsed_time if elapsed_time > 0 else 0
        progress_text = f"Frame: {frame_count}/{total_frames} | FPS: {processing_fps:.1f}"
        cv2.putText(output_frame, progress_text, (10, frame_height - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        if writer: writer.write(output_frame)
        if show_realtime:
            cv2.imshow('Dual Fencing Analysis - Detector', output_frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                show_realtime = False; cv2.destroyAllWindows(); print("Realtime display off...")

    cap.release()
    pose_estimator_roi.close()
    if writer: writer.release()
    if show_realtime or (frame_count < total_frames and frame_count > 0): cv2.destroyAllWindows()
    
    total_processing_time = time.time() - start_time
    print(f"Video processing finished. Total time: {total_processing_time:.2f} seconds.")
    if output_path and os.path.exists(output_path): print(f"Processed video saved to: {output_path}")

    plot_paths = {}
    if frame_data_log:
        output_dir_plots = os.path.dirname(output_path or video_path) or "."
        if not os.path.exists(output_dir_plots): os.makedirs(output_dir_plots, exist_ok=True)
        plot_paths = generate_summary_plots_en(frame_data_log, p1_stats, p2_stats, output_dir_plots)
    return plot_paths

# --- generate_summary_plots_en (same as before) ---
def generate_summary_plots_en(frame_log, p1_s, p2_s, output_dir="."):
    plot_paths = {}
    if not frame_log: print("No data in frame_log to generate plots."); return plot_paths
    frames, p1_scores, p2_scores, _, _ = zip(*frame_log)
    plt.figure(figsize=(10, 5))
    plt.plot(frames, p1_scores, label='Player 1 Posture Score (%)', color=tuple(c/255 for c in COLORS["P1_main"]))
    plt.plot(frames, p2_scores, label='Player 2 Posture Score (%)', color=tuple(c/255 for c in COLORS["P2_main"]))
    plt.xlabel('Frame Number'); plt.ylabel('Posture Score (%)'); plt.title('Player Posture Scores Over Time')
    plt.legend(); plt.grid(True); plt.tight_layout()
    plot_path1 = os.path.join(output_dir, "posture_scores_timeline_detector_en.png")
    try: plt.savefig(plot_path1); plot_paths['timeline'] = plot_path1; print(f"Timeline plot saved to: {plot_path1}")
    except Exception as e: print(f"Error saving timeline plot: {e}")
    plt.close()

    labels_en = np.array(['Attack Stance Count', 'Lunge Posture Count', 'Avg. Posture Score'])
    avg_p1_score = (p1_s["cumulative_score"] / p1_s["total_frames_detected"]) if p1_s["total_frames_detected"] > 0 else 0
    avg_p2_score = (p2_s["cumulative_score"] / p2_s["total_frames_detected"]) if p2_s["total_frames_detected"] > 0 else 0
    stats_p1_values = np.array([p1_s.get("Lunge/Attack Stance", 0), p1_s.get("Lunge Posture", 0), avg_p1_score])
    stats_p2_values = np.array([p2_s.get("Lunge/Attack Stance", 0), p2_s.get("Lunge Posture", 0), avg_p2_score])
    angles = np.linspace(0, 2 * np.pi, len(labels_en), endpoint=False).tolist()
    stats_p1_plot = np.concatenate((stats_p1_values, [stats_p1_values[0]]))
    stats_p2_plot = np.concatenate((stats_p2_values, [stats_p2_values[0]]))
    angles_plot = angles + angles[:1]
    fig, ax = plt.subplots(figsize=(7, 7), subplot_kw=dict(polar=True))
    ax.plot(angles_plot, stats_p1_plot, color=tuple(c/255 for c in COLORS["P1_main"]), linewidth=2, linestyle='solid', label='Player 1')
    ax.fill(angles_plot, stats_p1_plot, color=tuple(c/255 for c in COLORS["P1_main"]), alpha=0.25)
    ax.plot(angles_plot, stats_p2_plot, color=tuple(c/255 for c in COLORS["P2_main"]), linewidth=2, linestyle='solid', label='Player 2')
    ax.fill(angles_plot, stats_p2_plot, color=tuple(c/255 for c in COLORS["P2_main"]), alpha=0.25)
    ax.set_xticks(angles); ax.set_xticklabels(labels_en)
    ax.yaxis.set_major_locator(MaxNLocator(integer=True, nbins=5))
    plt.title('Tactical Radar Chart Comparison', size=16, y=1.1); ax.legend(loc='upper right', bbox_to_anchor=(0.1, 0.1))
    plot_path2 = os.path.join(output_dir, "tactical_radar_chart_detector_en.png")
    try: plt.savefig(plot_path2); plot_paths['radar'] = plot_path2; print(f"Radar chart saved to: {plot_path2}")
    except Exception as e: print(f"Error saving radar chart: {e}")
    plt.close()
    return plot_paths

# --- PlotViewerApp (same as before) ---
class PlotViewerApp:
    def __init__(self, root, plot_paths_dict):
        self.root = root; self.root.title("Fencing Analysis Report (Detector Based)")
        self.plot_paths = plot_paths_dict; self.notebook = ttk.Notebook(root)
        tab_added = False
        if 'timeline' in self.plot_paths and os.path.exists(self.plot_paths['timeline']):
            self.add_plot_tab(self.plot_paths['timeline'], "Timeline Plot"); tab_added = True
        else: print(f"Timeline plot not found: {self.plot_paths.get('timeline')}")
        if 'radar' in self.plot_paths and os.path.exists(self.plot_paths['radar']):
            self.add_plot_tab(self.plot_paths['radar'], "Radar Chart"); tab_added = True
        else: print(f"Radar chart not found: {self.plot_paths.get('radar')}")
        if not tab_added: ttk.Label(root, text="No plots found.", font=("Arial", 14)).pack(padx=20, pady=20)
        else: self.notebook.pack(expand=1, fill="both", padx=10, pady=10)
    def add_plot_tab(self, image_path, tab_title):
        tab = ttk.Frame(self.notebook); self.notebook.add(tab, text=tab_title)
        try:
            img_pil = Image.open(image_path); photo = ImageTk.PhotoImage(img_pil)
            img_label = ttk.Label(tab, image=photo); img_label.image = photo
            img_label.pack(padx=5, pady=5, expand=True, fill="both")
        except Exception as e: print(f"Error loading image {image_path}: {e}"); ttk.Label(tab, text=f"Could not load: {os.path.basename(image_path)}\nError: {e}").pack(padx=10, pady=10)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process video with person detection, analyze dual fencers (EN), show plots.")
    parser.add_argument("video_path", type=str, help="Path to input video.")
    parser.add_argument("-ov", "--output_video", type=str, default=None, help="Path to save processed video.")
    parser.add_argument("--no_show_video", action="store_true", help="No realtime video display.")
    parser.add_argument("-cdp", "--conf_detect_person", type=float, default=0.4, help="Min confidence for person detection (0.0-1.0). Default 0.4.")
    parser.add_argument("-cpp", "--conf_pose_person", type=float, default=0.5, help="Min confidence for pose estimation on ROI (0.0-1.0). Default 0.5.")
    parser.add_argument("-mcp", "--model_complexity_pose", type=int, default=0, choices=[0, 1, 2], help="Pose model complexity for ROI (0, 1, 2). Default 0 (fastest).")
    
    args = parser.parse_args()

    if not os.path.exists(args.video_path):
        print(f"Error: Input video file '{args.video_path}' not found.")
    elif not PERSON_DETECTOR_LOADED:
        print("Error: Person detector model not loaded. Cannot proceed. Please check model file paths.")
    else:
        generated_plot_paths = process_dual_video_detector_en(
            args.video_path,
            args.output_video,
            show_realtime=not args.no_show_video,
            conf_threshold_person=args.conf_detect_person,
            conf_threshold_pose=args.conf_pose_person,
            model_complexity_pose=args.model_complexity_pose
        )
        if generated_plot_paths and (generated_plot_paths.get('timeline') or generated_plot_paths.get('radar')):
            print("Launching plot viewer GUI...")
            root = tk.Tk(); root.minsize(400, 300)
            app = PlotViewerApp(root, generated_plot_paths)
            root.mainloop()
        else:
            print("No plots generated or found, GUI will not launch.")
