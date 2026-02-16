# 檔案: mahjong_logic.py
# 台灣麻將 (16 張) 牌效計算引擎 — Pure Python
# ──────────────────────────────────────────────────────────────
# 取代 mahjong_brain/brain.js (Node.js)
# 使用 mahjong 庫 (pip install mahjong) 並修改為台灣 16 張規則

from __future__ import annotations

from collections.abc import Sequence
from copy import copy

from mahjong.shanten import Shanten


# ── 台灣麻將向聽數計算 ────────────────────────────────────────
# Riichi (日麻): 4 面子 + 1 眼 = 14 張 → 向聽起始 = 8, cap = 4
# Taiwan (台麻): 5 面子 + 1 眼 = 17 張 → 向聽起始 = 10, cap = 5

class TaiwanShanten(Shanten):
    """
    繼承 mahjong.shanten.Shanten 並覆寫為台灣 16 張規則。
    主要差異:
      - 手牌上限: 17 張 (摸牌後) / 16 張 (打牌前)
      - 面子目標: 5 組 (非 4 組)
      - 向聽起始值: 10 (非 8)
    """

    WINNING_TILES = 17  # 胡牌時手牌數 (5*3 + 2)
    TARGET_SETS = 5     # 面子目標數

    def calculate_shanten_for_regular_hand(self, tiles_34: Sequence[int]) -> int:
        """
        計算台灣麻將一般型向聽數。
        覆寫原始方法以支援 16/17 張手牌。
        """
        tiles_34 = list(tiles_34)
        self._init(tiles_34)

        count_of_tiles = sum(tiles_34)
        if count_of_tiles > self.WINNING_TILES:
            raise ValueError(
                f"手牌數量過多: {count_of_tiles}，台灣麻將最多 {self.WINNING_TILES} 張"
            )

        # 向聽起始值: TARGET_SETS * 2 = 10
        self._min_shanten = self.TARGET_SETS * 2

        self._remove_character_tiles(count_of_tiles)

        # init_mentsu: 已有的面子數量 (用於開牌的場景)
        init_mentsu = (self.WINNING_TILES - count_of_tiles) // 3
        self._scan(init_mentsu)

        return self._min_shanten

    def _update_result(self) -> None:
        """
        覆寫結果計算，將面子上限從 4 改為 5。
        公式: shanten = TARGET_SETS*2 - melds*2 - tatsu - pairs
        """
        ret_shanten = (
            self.TARGET_SETS * 2
            - self._number_melds * 2
            - self._number_tatsu
            - self._number_pairs
        )

        n_mentsu_kouho = self._number_melds + self._number_tatsu
        if self._number_pairs:
            n_mentsu_kouho += self._number_pairs - 1
        elif self._flag_four_copies and self._flag_isolated_tiles:
            if (self._flag_four_copies | self._flag_isolated_tiles) == self._flag_four_copies:
                ret_shanten += 1

        if n_mentsu_kouho > self.TARGET_SETS:
            ret_shanten += n_mentsu_kouho - self.TARGET_SETS

        if ret_shanten != Shanten.AGARI_STATE and ret_shanten < self._number_jidahai:
            ret_shanten = self._number_jidahai

        if ret_shanten < self._min_shanten:
            self._min_shanten = ret_shanten

    def calculate_shanten(
        self,
        tiles_34: Sequence[int],
        use_chiitoitsu: bool = False,
        use_kokushi: bool = False,
    ) -> int:
        """
        計算向聽數。台灣麻將預設不計算七對子和國士無雙。
        """
        return self.calculate_shanten_for_regular_hand(tiles_34)


# ── 牌名轉換工具 ──────────────────────────────────────────────

# 牌名 → 34 陣列索引 的映射
# 萬子(Man): 1m~9m → 0~8
# 筒子(Pin): 1p~9p → 9~17
# 索子(Sou): 1s~9s → 18~26
# 字牌(Honor): 1z~7z → 27~33  (東南西北白發中)

SUIT_OFFSET = {'m': 0, 'p': 9, 's': 18, 'z': 27}


def tile_name_to_index(tile_name: str) -> int:
    """
    將牌名 (如 '1m', '7z') 轉換為 34 陣列的索引。
    """
    if len(tile_name) != 2:
        raise ValueError(f"無效牌名: {tile_name}")

    num = int(tile_name[0])
    suit = tile_name[1]

    if suit not in SUIT_OFFSET:
        raise ValueError(f"無效花色: {suit} (牌名: {tile_name})")

    offset = SUIT_OFFSET[suit]

    if suit == 'z':
        if num < 1 or num > 7:
            raise ValueError(f"字牌編號超出範圍: {tile_name}")
    else:
        if num < 1 or num > 9:
            raise ValueError(f"數牌編號超出範圍: {tile_name}")

    return offset + num - 1


def tiles_list_to_34_array(tiles: list[str]) -> list[int]:
    """
    將牌名列表轉換為 34 陣列。
    輸入: ['1m', '2m', '3m', '1p', ...]
    輸出: [1, 1, 1, 0, 0, ..., 1, 0, ...] (長度 34)
    """
    arr = [0] * 34
    for tile in tiles:
        idx = tile_name_to_index(tile)
        arr[idx] += 1
    return arr


def index_to_tile_name(idx: int) -> str:
    """
    將 34 陣列索引轉換回牌名。
    """
    if idx < 9:
        return f"{idx + 1}m"
    elif idx < 18:
        return f"{idx - 9 + 1}p"
    elif idx < 27:
        return f"{idx - 18 + 1}s"
    else:
        return f"{idx - 27 + 1}z"


# ── 牌效計算核心 ──────────────────────────────────────────────

# 每種牌的最大數量 (一副麻將中每種牌有 4 張)
MAX_TILE_COUNT = 4


def calculate_ukeire(
    tiles_34: list[int],
    shanten_calculator: TaiwanShanten,
    visible_tiles_34: list[int] | None = None,
) -> dict:
    """
    計算有效進張 (Ukeire)。
    找出哪些牌摸到後可以降低向聽數。

    參數:
        tiles_34: 手牌的 34 陣列
        shanten_calculator: 向聽數計算器
        visible_tiles_34: 場上可見牌 (牌河/明牌) 的 34 陣列，用於扣除剩餘張數

    回傳: {tile_name: count, ...}  例如 {'3m': 3, '6p': 4}
    """
    current_shanten = shanten_calculator.calculate_shanten(tiles_34)

    if current_shanten == Shanten.AGARI_STATE:
        return {}

    ukeire = {}
    for idx in range(34):
        # 計算已知的總數量 (手牌 + 場上可見牌)
        known_count = tiles_34[idx]
        if visible_tiles_34:
            known_count += visible_tiles_34[idx]

        # 跳過已經 4 張的牌 (不可能再摸到)
        if known_count >= MAX_TILE_COUNT:
            continue

        # 模擬摸到這張牌
        tiles_34[idx] += 1
        new_shanten = shanten_calculator.calculate_shanten(tiles_34)
        tiles_34[idx] -= 1

        # 如果向聽數降低了，就是有效進張
        if new_shanten < current_shanten:
            tile_name = index_to_tile_name(idx)
            remaining = MAX_TILE_COUNT - known_count
            ukeire[tile_name] = remaining

    return ukeire


# ── 防守邏輯 (Genbutsu / Suji) ─────────────────────────────────

# Suji (筋牌) 對照表
# 當某張牌出現在牌河中，與它形成「筋」關係的牌就較為安全。
# 原理: 兩面聽 (Ryanmen) 的等待規律
#   1-2-3 聽 -> 聽 1,4   => 4 在河裡 → 1 安全
#   4-5-6 聽 -> 聽 4,7   => 4 在河裡 → 7 安全
#   2-3-4 聽 -> 聽 2,5   => 5 在河裡 → 2 安全
#   5-6-7 聽 -> 聽 5,8   => 5 在河裡 → 8 安全
#   3-4-5 聽 -> 聽 3,6   => 6 在河裡 → 3 安全
#   6-7-8 聽 -> 聽 6,9   => 6 在河裡 → 9 安全
#
# 格式: {牌河中的數字: [因此安全的數字]}
SUJI_MAP = {
    4: [1, 7],  # 4 在河裡 → 1, 7 安全
    5: [2, 8],  # 5 在河裡 → 2, 8 安全
    6: [3, 9],  # 6 在河裡 → 3, 9 安全
    1: [4],     # 1 在河裡 → 4 半安全 (片筋)
    2: [5],     # 2 在河裡 → 5 半安全
    3: [6],     # 3 在河裡 → 6 半安全
    7: [4],     # 7 在河裡 → 4 半安全
    8: [5],     # 8 在河裡 → 5 半安全
    9: [6],     # 9 在河裡 → 6 半安全
}


def analyze_safety(
    tile_name: str,
    visible_tiles_34: list[int] | None = None,
) -> dict:
    """
    分析打出某張牌的安全度。

    回傳:
        {'status': 'genbutsu'|'suji'|'danger', 'level': 0|1|2}
        level 越低越安全
    """
    if visible_tiles_34 is None:
        return {'status': 'unknown', 'level': 2}

    idx = tile_name_to_index(tile_name)
    suit = tile_name[1]

    # ── 1. Genbutsu (現物): 牌河裡已經有這張牌 → 絕對安全
    if visible_tiles_34[idx] > 0:
        return {'status': 'genbutsu', 'level': 0}

    # ── 2. Suji (筋牌): 只適用於數牌 (萬/筒/索)，字牌不適用
    if suit in ('m', 'p', 's'):
        num = int(tile_name[0])
        suit_offset = SUIT_OFFSET[suit]

        # 檢查牌河中是否有能讓此牌「筋安全」的牌
        for river_num, safe_nums in SUJI_MAP.items():
            if num in safe_nums:
                # river_num 對應的牌在牌河裡嗎？
                river_idx = suit_offset + river_num - 1
                if visible_tiles_34[river_idx] > 0:
                    return {'status': 'suji', 'level': 1}

    # ── 3. 字牌: 如果牌河有 2 張以上同張字牌 → 較安全 (不太可能是碰聽)
    if suit == 'z':
        if visible_tiles_34[idx] >= 2:
            return {'status': 'suji', 'level': 1}

    # ── 4. 預設: 危險
    return {'status': 'danger', 'level': 2}


# ── 攻守權衡 (Decision Weighting) ────────────────────────────

# 進攻權重
SHANTEN_WEIGHT = 1000.0   # 向聽數的權重 (低向聽遠比高進張重要)
UKEIRE_WEIGHT = 1.0       # 進張數的權重

# 防守懲罰 (依 safety level)
DANGER_PENALTY_MAP = {
    0: 0.0,     # genbutsu: 無懲罰
    1: 10.0,    # suji:     小懲罰
    2: 50.0,    # danger:   大懲罰
}


def calculate_final_score(
    candidate: dict,
    current_shanten: int,
) -> float:
    """
    計算候選牌的最終分數 = 進攻分 - 防守懲罰。

    動態調整:
      - Tenpai (shanten <= 0): 全攻模式，防守懲罰歸零
      - 一向聽 (shanten == 1): 標準模式
      - 二向聽以上 (shanten >= 2): 防禦模式，懲罰加倍
    """
    # ── 進攻分數: 越低越好的 shanten 轉為越高越好的分數
    attack_score = -candidate['shanten'] * SHANTEN_WEIGHT + candidate['ukeire'] * UKEIRE_WEIGHT

    # ── 防守懲罰
    safety_level = candidate.get('safety', {}).get('level', 2)
    base_penalty = DANGER_PENALTY_MAP.get(safety_level, 50.0)

    # 動態風險係數
    if current_shanten <= 0:
        # 聽牌了！全攻模式 (Zentsu) — 不考慮防守
        risk_factor = 0.0
    elif current_shanten == 1:
        # 一向聽 — 標準模式
        risk_factor = 1.0
    else:
        # 二向聽以上 — 防禦模式 (Betaori) — 加倍防守
        risk_factor = 2.0

    defense_penalty = base_penalty * risk_factor

    return attack_score - defense_penalty


def calculate_discard_candidates(
    tiles_34: list[int],
    tiles_list: list[str],
    shanten_calculator: TaiwanShanten,
    visible_tiles_34: list[int] | None = None,
) -> list[dict]:
    """
    計算打牌建議 (Discard Candidates)。
    對手牌中每張不同的牌，模擬打掉後計算向聽數和進張。

    參數:
        visible_tiles_34: 場上可見牌的 34 陣列 (用於精準計算剩餘張數)

    回傳: 按 final_score 降序排列的候選列表
    [
        {
            'discard': '3z',
            'shanten': 1,
            'ukeire': 8,
            'acceptingTiles': {'1m': 3, ...},
            'quality': 'normal' | 'receding',
            'safety': {'status': 'genbutsu', 'level': 0},
            'finalScore': 990.0
        },
        ...
    ]
    """
    current_shanten = shanten_calculator.calculate_shanten(tiles_34)

    # 找出手牌中所有不同的牌
    unique_tiles = set(tiles_list)
    candidates = []

    for tile in unique_tiles:
        idx = tile_name_to_index(tile)

        # 模擬打掉這張牌 (打掉的牌加入可見牌)
        tiles_34[idx] -= 1

        # 打出的牌也變成「可見牌」
        discard_visible = None
        if visible_tiles_34 is not None:
            discard_visible = list(visible_tiles_34)
            discard_visible[idx] += 1

        new_shanten = shanten_calculator.calculate_shanten(tiles_34)

        # 計算打掉後的進張
        ukeire = calculate_ukeire(tiles_34, shanten_calculator, discard_visible)
        total_ukeire = sum(ukeire.values())

        # 還原
        tiles_34[idx] += 1

        quality = 'normal' if new_shanten <= current_shanten else 'receding'

        # 防守分析: 這張牌打出去安不安全？
        safety = analyze_safety(tile, visible_tiles_34)

        candidate = {
            'discard': tile,
            'shanten': new_shanten,
            'ukeire': total_ukeire,
            'acceptingTiles': ukeire,
            'quality': quality,
            'safety': safety,
        }

        # 計算最終分數 (攻守結合)
        candidate['finalScore'] = calculate_final_score(candidate, current_shanten)

        candidates.append(candidate)

    # 排序: final_score 降序 (分數越高越推薦)
    candidates.sort(key=lambda c: -c['finalScore'])

    return candidates


# ── 主要入口函式 (取代 brain.js) ──────────────────────────────

def calculate_decision(
    tiles_list: list[str],
    visible_tiles: list[str] | None = None,
) -> dict | None:
    """
    計算牌效建議。取代 Node.js brain.js 的功能。

    輸入:
        tiles_list: ['1m', '2m', '3m', ...]  (16 或 17 張手牌)
        visible_tiles: ['3z', '5m', ...] (場上可見的牌: 牌河、明牌等)
    輸出: 計算結果 dict

    回傳範例 (17 張 / 打牌階段):
    {
        "tileCount": 17,
        "phase": "discarding",
        "shanten": 1,
        "bestDiscard": "3z",
        "candidates": [...],
        "visibleCount": 5
    }
    """
    n = len(tiles_list)
    remainder = n % 3

    # 驗證牌數: 3n+1 (等待摸牌) 或 3n+2 (需要打牌)
    if remainder == 0:
        return {
            'error': f'Invalid tile count: {n}. Must be 3n+1 (waiting) or 3n+2 (discarding).'
        }

    phase = 'waiting' if remainder == 1 else 'discarding'

    try:
        tiles_34 = tiles_list_to_34_array(tiles_list)
        shanten_calc = TaiwanShanten()
        shanten_num = shanten_calc.calculate_shanten(tiles_34)

        # 轉換場上可見牌為 34 陣列
        visible_34 = None
        if visible_tiles:
            visible_34 = tiles_list_to_34_array(visible_tiles)

        output: dict = {
            'tileCount': n,
            'phase': phase,
            'shanten': shanten_num,
            'visibleCount': len(visible_tiles) if visible_tiles else 0,
        }

        if phase == 'discarding':
            # 打牌階段: 計算每張牌打掉後的效率
            candidates = calculate_discard_candidates(
                tiles_34, tiles_list, shanten_calc, visible_34
            )
            output['candidates'] = candidates
            if candidates:
                output['bestDiscard'] = candidates[0]['discard']

        else:
            # 等待摸牌階段: 計算有效進張
            ukeire = calculate_ukeire(tiles_34, shanten_calc, visible_34)
            output['acceptingTiles'] = ukeire
            output['totalUkeire'] = sum(ukeire.values())

        return output

    except Exception as e:
        return {'error': str(e)}


# ── 獨立測試 ──────────────────────────────────────────────────
if __name__ == '__main__':
    import json
    import sys

    if len(sys.argv) > 1:
        input_str = " ".join(sys.argv[1:])
        input_str = input_str.replace('"', '').replace("'", "")
        hand = input_str.split()

        print(f"\n[Test] Input: {input_str}")
        print(f"[Info] Count: {len(hand)}")

        result = calculate_decision(hand)

        if result:
            print("\n[Result] JSON:")
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print("[Error] Calculation Failed")
    else:
        print("[Test] Running default test hands...\n")

        test_hands = [
            # 17 張 (打牌階段)
            ['1m', '2m', '3m', '4p', '5p', '6p', '7s', '8s', '9s',
             '1z', '1z', '1z', '2z', '2z', '3z', '4z', '5z'],
            # 16 張 (等待摸牌)
            ['1m', '2m', '3m', '4p', '5p', '6p', '7s', '8s', '9s',
             '1z', '1z', '1z', '2z', '2z', '3z', '4z'],
        ]

        for i, hand in enumerate(test_hands):
            print(f"--- 測試 {i + 1}: {len(hand)} 張 ---")
            print(f"手牌: {' '.join(hand)}")
            result = calculate_decision(hand)
            if result and 'error' not in result:
                print(f"Phase: {result.get('phase')}")
                print(f"Shanten: {result.get('shanten')}")
                if 'bestDiscard' in result:
                    print(f"Best Discard: {result['bestDiscard']}")
                if 'totalUkeire' in result:
                    print(f"Total Ukeire: {result['totalUkeire']}")
                if 'acceptingTiles' in result:
                    print(f"Accepting: {result['acceptingTiles']}")
            else:
                print(f"Error: {result}")
            print()
