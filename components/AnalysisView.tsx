import React from 'react';
import { AnalysisResult } from '../types';
import TileIcon from './TileIcon';
import { RefreshCw, Sparkles, Map, ShieldCheck } from 'lucide-react';

interface AnalysisViewProps {
  result: AnalysisResult;
  onReset: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ result, onReset }) => {
  const { myHand, recommendation, discards, safeTiles } = result;

  // Translation mapping for actions
  const actionMap: Record<string, string> = {
    'discard': '打出 (Discard)',
    'chow': '吃 (Chow)',
    'pong': '碰 (Pong)',
    'kong': '槓 (Kong)',
    'hu': '胡牌 (Hu)',
    'wait': '等待/摸牌 (Wait)'
  };

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto p-4 space-y-6 overflow-y-auto pb-24">
      
      {/* Recommendation Card */}
      <div className="bg-gradient-to-br from-mahjong-gold to-yellow-600 rounded-2xl p-6 shadow-xl text-slate-900 animate-fade-in-up">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider opacity-80 mb-1">AI 建議行動</h2>
            <div className="flex items-center space-x-2">
                <span className="text-3xl font-extrabold">{actionMap[recommendation.action] || recommendation.action}</span>
                {recommendation.confidence > 80 && <Sparkles className="w-6 h-6 text-white animate-pulse" />}
            </div>
            <div className="mt-3 text-lg font-medium leading-relaxed opacity-90 border-t border-black/10 pt-2">
              {recommendation.reasoning}
            </div>
          </div>
          
          <div className="flex flex-col items-center ml-4">
             <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm shadow-inner">
                <TileIcon code={recommendation.tile} size="lg" />
             </div>
             <span className="text-xs font-bold mt-2 bg-black/20 px-2 py-1 rounded-full text-white whitespace-nowrap">
                信心度 {recommendation.confidence}%
             </span>
          </div>
        </div>
      </div>

      {/* Safe Tiles Analysis (Defensive) */}
      <div className="bg-blue-900/40 backdrop-blur-md rounded-xl p-4 shadow-lg border border-blue-400/30">
        <h3 className="text-blue-100 text-sm font-bold tracking-widest mb-3 flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-blue-300" />
            安全張分析 (Safe Tiles)
        </h3>
        <p className="text-xs text-blue-200/70 mb-3">
             根據其餘三家捨牌分析，以下牌相對安全：
        </p>
        <div className="flex flex-wrap gap-2">
             {safeTiles && safeTiles.length > 0 ? (
                safeTiles.map((tile, idx) => (
                    <TileIcon key={`safe-${idx}`} code={tile} size="sm" />
                ))
             ) : (
                <span className="text-gray-400 text-xs italic">無明顯安全張建議</span>
             )}
        </div>
      </div>

      {/* My Hand Section */}
      <div className="bg-mahjong-table/80 backdrop-blur-md rounded-xl p-5 shadow-lg border border-white/10">
        <h3 className="text-emerald-100 text-sm font-semibold mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
              本家手牌 ({myHand.length}張)
            </div>
            {myHand.length < 16 && <span className="text-xs text-yellow-400">注意: 偵測張數不足16張</span>}
        </h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {myHand.map((tile, idx) => (
            <div key={`${tile}-${idx}`} className="transition-transform hover:-translate-y-1 relative">
                <TileIcon 
                    code={tile} 
                    size="md" 
                    highlight={tile === recommendation.tile && recommendation.action === 'discard'}
                />
                {tile === recommendation.tile && recommendation.action === 'discard' && (
                  <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 animate-bounce">
                    <span className="sr-only">Recommended</span>
                  </div>
                )}
            </div>
          ))}
          {myHand.length === 0 && (
            <div className="text-gray-400 italic text-sm py-4">未能清晰辨識手牌，請重試。</div>
          )}
        </div>
      </div>

      {/* Discards / Context */}
      <div className="bg-black/30 rounded-xl p-5 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Map size={64} />
        </div>
        <h3 className="text-gray-300 text-sm font-bold tracking-widest mb-3 flex items-center">
           <span className="mr-2">🀄</span> 牌河 (場上已出)
        </h3>
        <div className="flex flex-wrap gap-1 opacity-90">
            {discards.slice(0, 24).map((tile, idx) => (
                <TileIcon key={`discard-${idx}`} code={tile} size="sm" />
            ))}
             {discards.length === 0 && (
                <span className="text-gray-500 text-xs py-2">未偵測到明顯的桌面捨牌。</span>
            )}
        </div>
        {discards.length > 24 && (
            <div className="mt-2 text-xs text-center text-gray-500">...以及更多 ({discards.length - 24} 張)</div>
        )}
      </div>

      {/* Action Button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-50">
        <button 
            onClick={onReset}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all active:scale-95 border-2 border-emerald-400/30"
        >
            <RefreshCw className="w-5 h-5" />
            <span>分析下一手</span>
        </button>
      </div>
    </div>
  );
};

export default AnalysisView;