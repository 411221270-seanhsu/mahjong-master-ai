import React from 'react';
import { AnalysisResult } from '../types';
import MahjongTile from './MahjongTile';
import { Cpu, ShieldCheck, TrendingUp, RefreshCw, X } from 'lucide-react';

interface ResultViewProps {
    result: AnalysisResult;
    onReset: () => void;
}

/** Map action strings to Chinese labels */
const actionLabel = (action: string): string => {
    const map: Record<string, string> = {
        discard: '打出',
        chow: '吃',
        pong: '碰',
        kong: '槓',
        hu: '胡牌！',
        wait: '等待摸牌',
    };
    return map[action] || action;
};

/** Build a readable tile name for the hero card */
const tileName = (code: string): string => {
    const suitNames: Record<string, string> = {
        B: '索',
        D: '筒',
        C: '萬',
    };
    const honorNames: Record<string, string> = {
        East: '東',
        South: '南',
        West: '西',
        North: '北',
        Red: '中',
        Green: '發',
        White: '白',
    };

    if (honorNames[code]) return honorNames[code];

    const value = code.slice(0, -1);
    const suitChar = code.slice(-1);
    const suitName = suitNames[suitChar] || '';

    return `${value} ${suitName}`;
};

const ResultView: React.FC<ResultViewProps> = ({ result, onReset }) => {
    const { myHand, recommendation, safeTiles } = result;

    return (
        <div className="w-full h-full flex flex-col relative overflow-y-auto no-scrollbar">
            {/* ===== Close / Reset Button ===== */}
            <button
                onClick={onReset}
                className="absolute top-4 right-4 z-30 w-10 h-10 glass-panel rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
                aria-label="Close"
            >
                <X className="w-5 h-5 text-white/80" />
            </button>

            {/* ===== Hero Recommendation Card ===== */}
            <div className="mt-14 mx-6 relative group">
                {/* Gold glow behind card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-mj-gold via-amber-300 to-mj-gold rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

                <div className="relative rounded-xl bg-gradient-to-br from-[#fffbeb] to-[#fcd34d] p-1 shadow-2xl">
                    <div className="bg-white/90 backdrop-blur-xl rounded-lg p-5 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest border border-amber-600/20 px-2 py-0.5 rounded-full w-fit">
                                AI Recommendation
                            </span>
                            <h2 className="text-2xl font-black text-slate-800">
                                {actionLabel(recommendation.action)} {tileName(recommendation.tile)}
                            </h2>
                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> 信心度 {recommendation.confidence}%
                            </span>
                        </div>
                        <div className="transform rotate-[-5deg]">
                            <MahjongTile code={recommendation.tile} isHero />
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== Analysis Text (Terminal Style) ===== */}
            <div className="mt-4 mx-6 glass-panel p-3 rounded-lg border-l-4 border-l-mj-gold flex items-start gap-3">
                <Cpu className="w-5 h-5 text-mj-gold flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-100 leading-relaxed font-mono">
                    <span className="text-mj-gold font-bold">&gt; ANALYSIS:</span>{' '}
                    {recommendation.reasoning}
                </div>
            </div>

            {/* ===== Content Area (bottom sections) ===== */}
            <div className="flex-1 flex flex-col justify-end pb-8 px-4 gap-4 mt-4">
                {/* Safe Tiles */}
                <div className="glass-panel p-3 rounded-xl border border-blue-500/30 bg-blue-900/20">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                            Safe Tiles (安牌)
                        </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {safeTiles && safeTiles.length > 0 ? (
                            safeTiles.map((tile, idx) => (
                                <MahjongTile key={`safe-${idx}`} code={tile} isDiscard />
                            ))
                        ) : (
                            <span className="text-gray-400 text-xs italic">無明顯安全張建議</span>
                        )}
                    </div>
                </div>

                {/* Detected Hand */}
                <div className="glass-panel p-3 rounded-t-2xl border-b-0">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                            Detected Hand ({myHand.length})
                        </span>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                        {myHand.map((tile, idx) => (
                            <MahjongTile
                                key={`hand-${tile}-${idx}`}
                                code={tile}
                                highlight={
                                    tile === recommendation.tile &&
                                    recommendation.action === 'discard'
                                }
                            />
                        ))}
                        {myHand.length === 0 && (
                            <span className="text-gray-400 italic text-sm py-4">
                                未能清晰辨識手牌，請重試。
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== Re-scan FAB ===== */}
            <button
                onClick={onReset}
                className="absolute bottom-32 right-6 w-12 h-12 bg-mj-green rounded-full shadow-lg border border-mj-gold/30 flex items-center justify-center active:scale-95 transition-all hover:border-mj-gold/60"
            >
                <RefreshCw className="w-5 h-5 text-mj-gold" />
            </button>
        </div>
    );
};

export default ResultView;
