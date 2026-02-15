import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, AlertCircle, Zap, Loader2 } from 'lucide-react';

interface CameraFeedProps {
  onCapture: (imageData: string) => void;
  isAnalyzing: boolean;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ onCapture, isAnalyzing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamActive, setStreamActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
        setError(null);
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setError("無法存取相機，請確認權限設定。");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current frame
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get Base64 string
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        const base64Data = imageData.split(',')[1]; // Remove prefix
        onCapture(base64Data);
      }
    }
  }, [onCapture]);

  return (
    <div className="relative w-full h-full flex flex-col bg-black">
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-red-400">
          <AlertCircle className="w-12 h-12 mb-4" />
          <p>{error}</p>
          <button 
            onClick={() => startCamera()}
            className="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-white"
          >
            重試
          </button>
        </div>
      ) : (
        <div className="relative flex-1 overflow-hidden">
             {/* Video Element */}
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover transition-opacity duration-500 ${streamActive ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {/* Hidden Canvas for Capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay Grid for alignment guide */}
            <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-col">
                <div className="flex-1 border-b border-white"></div>
                <div className="flex-1 border-b border-white"></div>
                <div className="flex-1"></div>
                <div className="absolute inset-0 flex">
                    <div className="flex-1 border-r border-white"></div>
                    <div className="flex-1 border-r border-white"></div>
                    <div className="flex-1"></div>
                </div>
            </div>

            {/* Hint Text */}
            <div className="absolute top-8 left-0 right-0 text-center pointer-events-none">
                <span className="bg-black/50 px-3 py-1 rounded-full text-xs text-white/80 backdrop-blur-sm shadow-sm">
                    請將本家手牌置於下方，並確保能拍到牌河
                </span>
            </div>

            {/* Capture Button Area */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
                <button
                    onClick={handleCapture}
                    disabled={isAnalyzing || !streamActive}
                    className={`
                        relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center
                        transition-all duration-300
                        ${isAnalyzing ? 'opacity-50 scale-90 cursor-not-allowed' : 'hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/30'}
                    `}
                >
                    <div className={`w-16 h-16 rounded-full ${isAnalyzing ? 'bg-gray-500' : 'bg-emerald-500'}`}>
                        {isAnalyzing ? (
                             <Loader2 className="w-8 h-8 text-white animate-spin m-auto mt-4" />
                        ) : (
                            <Camera className="w-8 h-8 text-white m-auto mt-4" />
                        )}
                    </div>
                </button>
            </div>
            
            {isAnalyzing && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <div className="bg-emerald-900/80 p-6 rounded-2xl flex flex-col items-center border border-emerald-500/30 shadow-2xl">
                        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
                        <h3 className="text-xl font-bold text-white mb-1">正在分析牌局...</h3>
                        <p className="text-emerald-200/70 text-sm">識別手牌、計算台數與安全張</p>
                    </div>
                 </div>
            )}
        </div>
      )}
    </div>
  );
};

export default CameraFeed;