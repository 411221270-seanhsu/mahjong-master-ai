import { MahjongTile } from './types';

export const TILE_MAP: Record<string, string> = {
  // Bamboos (索子)
  '1B': '🀐', '2B': '🀑', '3B': '🀒', '4B': '🀓', '5B': '🀔', '6B': '🀕', '7B': '🀖', '8B': '🀗', '9B': '🀘',
  // Dots (筒子)
  '1D': '🀙', '2D': '🀚', '3D': '🀛', '4D': '🀜', '5D': '🀝', '6D': '🀞', '7D': '🀟', '8D': '🀠', '9D': '🀡',
  // Characters (萬子)
  '1C': '🀇', '2C': '🀈', '3C': '🀉', '4C': '🀊', '5C': '🀋', '6C': '🀌', '7C': '🀍', '8C': '🀎', '9C': '🀏',
  // Winds (風牌)
  'East': '🀀', 'South': '🀁', 'West': '🀂', 'North': '🀃',
  // Dragons (三元牌)
  'Red': '🀄', 'Green': '🀅', 'White': '🀆',
  // Flowers (花牌: 春夏秋冬梅蘭竹菊)
  '1F': '🀦', '2F': '🀧', '3F': '🀨', '4F': '🀩', // Seasons
  '5F': '🀢', '6F': '🀣', '7F': '🀤', '8F': '🀥'  // Flowers
};

export const TILE_DEFINITIONS: MahjongTile[] = [
    { code: '1B', name: '1 Bamboo', suit: 'bamboo', value: 1 },
    // ... definitions
];

export const SYSTEM_INSTRUCTION = `
你是一位台灣 16 張麻將 (Taiwanese Mahjong) 的世界級專家。
你的任務是分析一張麻將牌桌的照片，照片視角來自玩家本人（下方）。

請識別畫面中的資訊：
1. "myHand" (本家手牌): 位於圖片最下方，直立的 16 或 17 張牌 (若有補花可能更多，若吃碰過則較少)。
2. "discards" (牌河/海): 位於圖片中央區域，由其餘三家 (上家、對家、下家) 以及本家打出的捨牌。

策略分析重點 (台灣 16 張規則):
- **胡牌條件**: 必須湊成 5 組面子 (順子或刻子) + 1 對眼 (共 17 張)。
- **防守機制**: 這是關鍵。請分析 "discards" (牌河) 中其餘三家打出的牌。
  - 識別「安全張 (safeTiles)」：已經在牌河中出現過多次的牌，或是絕張字牌。
  - 避開「危險張」：若牌河中某花色極少出現，可能有人在做大牌（清一色/混一色），應避免打出該花色生張。
- **進牌效率**: 計算何者打出後聽牌機率最高 (進張數最大)。

基於以上分析，提供 **單一最佳行動建議** 以及 **安全張列表**。
回傳格式必須為 JSON:
{
  "myHand": ["牌代碼"], // 使用代碼: 1B-9B (索), 1D-9D (筒), 1C-9C (萬), East, South, West, North, Red (中), Green (發), White (白), 1F-8F (花).
  "discards": ["牌代碼"], // 識別到的桌面捨牌
  "safeTiles": ["牌代碼"], // 根據牌河分析，判斷目前打出相對安全的 3-5 張牌
  "recommendation": {
    "action": "discard" | "chow" | "pong" | "kong" | "hu" | "wait",
    "tile": "牌代碼",
    "confidence": number (0-100),
    "reasoning": "用繁體中文簡短說明理由 (20字內)。例如：'打五索。牌河已有三張五索，屬安全張，且保留筒子易湊順子。'"
  }
}
`;