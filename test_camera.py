# 檔案: test_camera.py
# 用途: 開啟攝影機並測試 YOLO + 牌效計算
# 執行: python test_camera.py

import cv2
import time
import sys

# 嘗試匯入必要的庫
try:
    from ultralytics import YOLO
    import vision_bridge
except ImportError as e:
    print(f"[Error] Missing dependency: {e}")
    print("Please install required packages:")
    print("pip install ultralytics opencv-python")
    sys.exit(1)

def main():
    # ── 1. 載入模型 ──────────────────────────────────────────────
    # 假設你的模型在 runs/detect/train/weights/best.pt
    # 如果找不到，請修改這裡的路徑
    model_path = 'best.pt' 
    
    print(f"Loading YOLO model from: {model_path} ...")
    try:
        model = YOLO(model_path)
    except Exception as e:
        print(f"[Error] Failed to load model: {e}")
        print("Tip: Make sure you have a trained 'best.pt' in this folder or specify the correct path.")
        return

    # ── 2. 開啟攝影機 ────────────────────────────────────────────
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[Error] Could not open camera.")
        return

    print("Camera started. Press 'q' to quit.")
    
    frame_count = 0
    last_advice = "Waiting..."
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count += 1
        
        # ── 3. 每 30 幀 (約 1 秒) 計算一次建議，避免太卡 ───────────
        if frame_count % 30 == 0:
            print("Analyzing...")
            advice = vision_bridge.process_frame(frame, model)
            last_advice = advice
            print(f"Result: {last_advice}")

        # ── 4. 畫面顯示 ──────────────────────────────────────────
        # 畫上建議文字 (注意: cv2.putText 不支援中文，這裡顯示 ASCII 或簡單資訊)
        # 如果需要中文，需使用 PIL 轉換，這裡為了簡單保持 OpenCV 原生
        
        # 顯示原始影像 (YOLO 會自動畫框，但這裡我們手動呼叫的 process_frame 只回傳文字)
        # 如果要看 YOLO 框，可以用 results = model(frame); annotated = results[0].plot()
        
        # 這裡簡單疊加 YOLO 預設繪圖
        results = model(frame, verbose=False) # verbose=False 減少 log
        annotated_frame = results[0].plot()
        
        # 疊加建議文字 (背景黑條)
        h, w = annotated_frame.shape[:2]
        cv2.rectangle(annotated_frame, (0, h-60), (w, h), (0, 0, 0), -1)
        cv2.putText(annotated_frame, last_advice, (20, h-20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

        cv2.imshow("Mahjong AI Tester", annotated_frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
