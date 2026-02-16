# 檔案: vision_bridge.py
# 麻將 AI 視覺橋接器 — YOLO 辨識 + Python 牌效計算
# ──────────────────────────────────────────────────────────────

from mahjong_logic import calculate_decision


# ── YOLO Class ID → 牌名 對照表 ─────────────────────────────
# 請依照你的 data.yaml / classes.txt 的實際順序修改！
# 格式: {class_id: 'tile_name'}
#
# 牌名規則 (mahjong-tile-efficiency 標準):
#   萬子: 1m ~ 9m
#   筒子: 1p ~ 9p
#   索子: 1s ~ 9s
#   字牌: 1z=東, 2z=南, 3z=西, 4z=北, 5z=白, 6z=發, 7z=中

YOLO_MAP = {
    # ── 萬子 (Man) ──
    0:  '1m',  1:  '2m',  2:  '3m',  3:  '4m',  4:  '5m',
    5:  '6m',  6:  '7m',  7:  '8m',  8:  '9m',
    # ── 筒子 (Pin) ──
    9:  '1p', 10:  '2p', 11:  '3p', 12:  '4p', 13:  '5p',
    14: '6p', 15:  '7p', 16:  '8p', 17:  '9p',
    # ── 索子 (Sou) ──
    18: '1s', 19:  '2s', 20:  '3s', 21:  '4s', 22:  '5s',
    23: '6s', 24:  '7s', 25:  '8s', 26:  '9s',
    # ── 字牌 (Honor) ──
    27: '1z',  # 東
    28: '2z',  # 南
    29: '3z',  # 西
    30: '4z',  # 北
    31: '5z',  # 白
    32: '6z',  # 發
    33: '7z',  # 中
}

# 反向映射：牌名 → 中文名 (用於畫面顯示)
TILE_DISPLAY_NAME = {
    '1m': '一萬', '2m': '二萬', '3m': '三萬', '4m': '四萬', '5m': '五萬',
    '6m': '六萬', '7m': '七萬', '8m': '八萬', '9m': '九萬',
    '1p': '一筒', '2p': '二筒', '3p': '三筒', '4p': '四筒', '5p': '五筒',
    '6p': '六筒', '7p': '七筒', '8p': '八筒', '9p': '九筒',
    '1s': '一條', '2s': '二條', '3s': '三條', '4s': '四條', '5s': '五條',
    '6s': '六條', '7s': '七條', '8s': '八條', '9s': '九條',
    '1z': '東', '2z': '南', '3z': '西', '4z': '北',
    '5z': '白', '6z': '發', '7z': '中',
}


# ── 核心函式 ──────────────────────────────────────────────────

def ask_brain_for_decision(
    tiles_list: list[str],
    visible_tiles: list[str] | None = None,
) -> dict | None:
    """
    呼叫 Python 牌效計算引擎 (mahjong_logic)。

    輸入:
        tiles_list: ['1m', '2m', '3m', ...]  (16 或 17 張手牌)
        visible_tiles: ['3z', '5m', ...] (場上可見的牌河/明牌)
    輸出: 計算結果 dict，或 None (失敗時)
    """
    try:
        data = calculate_decision(tiles_list, visible_tiles)

        if data is None:
            print("[Brain Error] calculate_decision returned None")
            return None

        if 'error' in data:
            print(f"[Brain Error] {data['error']}")
            return None

        return data

    except Exception as e:
        print(f"[Bridge Error] {e}")
        return None


def process_frame(frame, model) -> str:
    """
    處理單一影格：YOLO 辨識 → 空間分類 → 牌效計算 → 回傳建議字串。

    參數:
        frame: OpenCV 影像 (numpy ndarray)
        model: YOLO 模型實例

    回傳:
        建議字串，例如 "建議打: 三西 (進牌: 8張, 向聽: 1)"
    """
    # ── 1. YOLO 推論 ──
    results = model(frame)
    frame_height = frame.shape[0]

    # 空間分界線：畫面下方 40% 為手牌區，上方 60% 為牌河/公開區
    HAND_REGION_RATIO = 0.6
    hand_boundary_y = frame_height * HAND_REGION_RATIO

    hand_tiles = []      # 手牌
    visible_tiles = []   # 場上可見牌 (牌河、明牌等)

    for box in results[0].boxes:
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])

        # 過濾低信心度 (< 60%)
        if conf < 0.6:
            continue

        tile_name = YOLO_MAP.get(cls_id)
        if not tile_name:
            continue

        # 取得 bounding box 的中心 y 座標
        # box.xyxy[0] = [x1, y1, x2, y2]
        coords = box.xyxy[0]
        center_y = (float(coords[1]) + float(coords[3])) / 2

        if center_y > hand_boundary_y:
            # 在下方 → 手牌
            hand_tiles.append(tile_name)
        else:
            # 在上方 → 牌河/公開牌
            visible_tiles.append(tile_name)

    # ── 2. 張數檢查 (只檢查手牌) ──
    n = len(hand_tiles)
    remainder = n % 3

    if remainder == 0 or n < 13:
        vis_info = f", 場上: {len(visible_tiles)}張" if visible_tiles else ""
        return f"辨識中... (手牌: {n}張{vis_info})"

    # ── 3. 呼叫計算引擎 (傳入可見牌) ──
    decision = ask_brain_for_decision(
        hand_tiles,
        visible_tiles if visible_tiles else None,
    )

    if decision is None:
        return "計算失敗"

    # ── 4. 格式化結果 ──
    shanten = decision.get('shanten', '?')

    if shanten == 0:
        # 聽牌了！
        accepting = decision.get('acceptingTiles', {})
        waiting_tiles = ', '.join(
            TILE_DISPLAY_NAME.get(t, t) for t in accepting.keys()
        )
        return f"🀄 聽牌！ 等: {waiting_tiles}"

    if shanten == -1:
        return "🎉 已胡牌！"

    # 打牌建議
    if decision.get('phase') == 'discarding' and decision.get('candidates'):
        best = decision['candidates'][0]
        discard_name = TILE_DISPLAY_NAME.get(best['discard'], best['discard'])
        return (
            f"建議打: {discard_name} "
            f"(進牌: {best['ukeire']}張, 向聽: {shanten})"
        )

    # 等待摸牌
    total = decision.get('totalUkeire', '?')
    return f"向聽: {shanten}, 有效進張: {total}種"


# ── 獨立測試 ──────────────────────────────────────────────────
if __name__ == '__main__':
    import json
    import sys
    
    # 模式 1: 有輸入參數 -> 測試特定牌型
    # 用法: python vision_bridge.py "1m 2m 3m ..."
    if len(sys.argv) > 1:
        input_str = " ".join(sys.argv[1:])
        # 移除可能的多餘引號
        input_str = input_str.replace('"', '').replace("'", "")
        hand = input_str.split()
        
        print(f"\n[Test] Input: {input_str}")
        print(f"[Info] Count: {len(hand)}")
        
        result = ask_brain_for_decision(hand)
        
        if result:
            print("\n[Result] JSON:")
            print(json.dumps(result, ensure_ascii=False, indent=2))
            
            # 模擬 process_frame 的簡易輸出
            print("\n[Advice]:")
            # 這裡我們模擬一個簡單的 output，因為 process_frame 需要 YOLO model
            if result.get('phase') == 'discarding':
                best = result['candidates'][0]
                print(f"Discard: {TILE_DISPLAY_NAME.get(best['discard'], best['discard'])} "
                      f"(Ukeire: {best['ukeire']}, Shanten: {result['shanten']})")
            else:
                print(f"Shanten: {result['shanten']}, Waiting...")
        else:
            print("[Error] Calculation Failed")
            
    # 模式 2: 無參數 -> 跑預設測試
    else:
        print("[Hint] You can test specific hands, for example:")
        print('   python vision_bridge.py "1m 1m 1m 2m 3m 4m 5m 6m 7m 8m 9m 1p 1p 1p 2p 2p"')
        
        test_hands = [
            # 17 張 (打牌階段)
            ['1m', '2m', '3m', '4p', '5p', '6p', '7s', '8s', '9s',
             '1z', '1z', '1z', '2z', '2z', '3z', '4z', '5z'],
            # 16 張 (等待摸牌)
            ['1m', '2m', '3m', '4p', '5p', '6p', '7s', '8s', '9s',
             '1z', '1z', '1z', '2z', '2z', '3z', '4z'],
        ]

        for i, hand in enumerate(test_hands):
            print(f"\n--- 預設測試 {i+1}: {len(hand)} 張 ---")
            print(f"手牌: {' '.join(hand)}")
            result = ask_brain_for_decision(hand)
            if result:
                # 只印出關鍵資訊避免洗版
                print(f"Phase: {result.get('phase')}")
                print(f"Shanten: {result.get('shanten')}")
                if 'bestDiscard' in result:
                    print(f"Best Discard: {result['bestDiscard']}")
            else:
                print("計算失敗！")
