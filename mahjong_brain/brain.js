// 檔案: mahjong_brain/brain.js
// 麻將牌效計算核心 — 使用 mahjong-tile-efficiency (Taiwan 模式)
// 用法: node brain.js "1m 2m 3m 4m 5m 6p 7p 8p 1s 2s 3s 5z 5z 5z 6z 6z 6z"

const { tilesToHand, RuleSet } = require('mahjong-tile-efficiency');

// ── 1. 讀取輸入 ──────────────────────────────────────────────
const inputString = process.argv[2];

if (!inputString) {
    console.log(JSON.stringify({ error: 'No tiles input. Usage: node brain.js "1m 2m 3m ..."' }));
    process.exit(1);
}

const tiles = inputString.trim().split(/\s+/);

// ── 2. 驗證牌數 ─────────────────────────────────────────────
// 台灣麻將: 手牌 16 張 (5 面子 + 1 眼)
// 3n+1 = 摸牌前 (等待摸牌): 1, 4, 7, 10, 13, 16
// 3n+2 = 摸牌後 (需要打牌): 2, 5, 8, 11, 14, 17
const n = tiles.length;
const phase = n % 3; // 1 = 等待摸牌, 2 = 需要打牌

if (phase === 0) {
    console.log(JSON.stringify({
        error: `Invalid tile count: ${n}. Must be 3n+1 (waiting) or 3n+2 (discarding).`
    }));
    process.exit(1);
}

try {
    // ── 3. 轉換格式 & 計算 ────────────────────────────────────
    const hand = tilesToHand(tiles);
    const taiwanRule = new RuleSet('Taiwan');
    const shantenNum = taiwanRule.calShanten(hand);
    const ukeireResult = taiwanRule.calUkeire(hand);

    // ── 4. 組裝輸出 ───────────────────────────────────────────
    const output = {
        tileCount: n,
        phase: phase === 1 ? 'waiting' : 'discarding',
        shanten: shantenNum
    };

    if (phase === 2) {
        // 「打牌階段」: 列出每張牌打掉後的進張資訊
        const candidates = [];

        // normalDiscard: 打掉後向聽數不變 (最佳或持平)
        if (ukeireResult.normalDiscard) {
            for (const [discardTile, acceptingTiles] of Object.entries(ukeireResult.normalDiscard)) {
                const totalUkeire = Object.values(acceptingTiles).reduce((a, b) => a + b, 0);
                candidates.push({
                    discard: discardTile,
                    shanten: shantenNum,
                    ukeire: totalUkeire,
                    acceptingTiles: acceptingTiles,
                    quality: 'normal'
                });
            }
        }

        // recedingDiscard: 打掉後向聽數退步 (較差選擇)
        if (ukeireResult.recedingDiscard) {
            for (const [discardTile, acceptingTiles] of Object.entries(ukeireResult.recedingDiscard)) {
                const totalUkeire = Object.values(acceptingTiles).reduce((a, b) => a + b, 0);
                candidates.push({
                    discard: discardTile,
                    shanten: shantenNum + 1,
                    ukeire: totalUkeire,
                    acceptingTiles: acceptingTiles,
                    quality: 'receding'
                });
            }
        }

        // 排序: 向聽數升序 → 進張數降序
        candidates.sort((a, b) => a.shanten - b.shanten || b.ukeire - a.ukeire);

        output.candidates = candidates;
        if (candidates.length > 0) {
            output.bestDiscard = candidates[0].discard;
        }

    } else {
        // 「等待摸牌階段」: 列出哪些牌可以推進向聽
        if (ukeireResult.ukeire) {
            output.acceptingTiles = ukeireResult.ukeire;
            output.totalUkeire = ukeireResult.totalUkeire ||
                Object.values(ukeireResult.ukeire).reduce((a, b) => a + b, 0);
        }
    }

    // ── 5. 輸出 JSON ──────────────────────────────────────────
    console.log(JSON.stringify(output));

} catch (e) {
    console.log(JSON.stringify({ error: e.message }));
    process.exit(1);
}
