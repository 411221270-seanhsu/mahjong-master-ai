import React, { useState } from 'react';
import Header from './components/Header';
import ScanningView from './components/ScanningView';
import ResultView from './components/ResultView';
import { analyzeMahjongImage } from './services/geminiService';
import { AnalysisResult, AppState } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.CAMERA_ACTIVE);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleCapture = async (base64Image: string) => {
    setAppState(AppState.ANALYZING);
    try {
      const data = await analyzeMahjongImage(base64Image);
      setResult(data);
      setAppState(AppState.RESULT);
    } catch (error) {
      console.error(error);
      alert('分析失敗，請重試。請確保光線充足且牌面清晰。');
      setAppState(AppState.CAMERA_ACTIVE);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setAppState(AppState.CAMERA_ACTIVE);
  };

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col font-sans">
      {/* Background layers */}
      <div className="bg-mahjong-scene">
        <div className="dot-grid"></div>
      </div>

      {/* Header */}
      <Header />

      {/* Main Content — Stacking Context */}
      <main className="relative z-10 flex-1 w-full">
        {/* Layer 1: Camera & Scanning (always rendered to keep stream alive) */}
        <ScanningView
          onCapture={handleCapture}
          isAnalyzing={appState === AppState.ANALYZING}
          isHidden={appState === AppState.RESULT}
        />

        {/* Layer 2: Result Overlay (stacks on top when ready) */}
        {appState === AppState.RESULT && result && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm">
            <ResultView result={result} onReset={resetAnalysis} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;