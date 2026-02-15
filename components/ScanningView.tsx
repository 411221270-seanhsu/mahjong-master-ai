import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Aperture, ScanLine, Loader2, AlertCircle } from 'lucide-react';

interface ScanningViewProps {
    onCapture: (imageData: string) => void;
    isAnalyzing: boolean;
}

const ScanningView: React.FC<ScanningViewProps> = ({ onCapture, isAnalyzing }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [streamActive, setStreamActive] = useState(false);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setStreamActive(true);
                setError(null);
            }
        } catch (err) {
            console.error('Camera Error:', err);
            setError('無法存取相機，請確認權限設定。');
        }
    };

    useEffect(() => {
        startCamera();
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const handleCapture = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg', 0.8);
                const base64Data = imageData.split(',')[1];
                onCapture(base64Data);
            }
        }
    }, [onCapture]);

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center transition-all duration-500">
            {/* Background: camera feed or black */}
            <div className="absolute inset-0 overflow-hidden">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-400 z-10 relative">
                        <AlertCircle className="w-10 h-10 mb-3" />
                        <p className="text-sm mb-3">{error}</p>
                        <button
                            onClick={() => startCamera()}
                            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-white text-sm"
                        >
                            重試
                        </button>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transition-opacity duration-500 ${streamActive ? 'opacity-30' : 'opacity-0'
                            }`}
                    />
                )}
            </div>

            {/* Hidden canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Scan line */}
            <div className="scan-line animate-scan-down"></div>

            {/* Targeting Frame */}
            <div className="relative w-64 h-48 border border-white/20 rounded-lg flex flex-col items-center justify-center z-10">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-mj-gold"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-mj-gold"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-mj-gold"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-mj-gold"></div>

                {!isAnalyzing && (
                    <p className="text-xs text-mj-gold/80 font-mono tracking-widest animate-pulse">
                        TARGET ACQUISITION...
                    </p>
                )}

                {/* Loading overlay */}
                {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-lg">
                        <Loader2 className="w-8 h-8 text-mj-gold animate-spin mb-2" />
                        <span className="text-xs text-white font-mono">ANALYZING...</span>
                    </div>
                )}
            </div>

            {/* Hint */}
            <div className="mt-8 px-4 py-2 glass-panel rounded-full flex items-center gap-2 z-10">
                <ScanLine className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-white/80">請將手牌置於框線內</span>
            </div>

            {/* Capture Button */}
            <div className="absolute bottom-12 z-10">
                <button
                    onClick={handleCapture}
                    disabled={isAnalyzing || !streamActive}
                    className="group relative flex items-center justify-center w-20 h-20 disabled:opacity-50"
                >
                    <div className="absolute inset-0 border-2 border-dashed border-mj-gold/30 rounded-full animate-[spin_8s_linear_infinite] group-hover:border-mj-gold/60 transition-colors"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-b from-mj-green to-black rounded-full border-2 border-mj-gold/80 shadow-[0_0_15px_rgba(240,192,64,0.3)] flex items-center justify-center active:scale-95 transition-transform">
                        {isAnalyzing ? (
                            <Loader2 className="w-8 h-8 text-mj-gold animate-spin" />
                        ) : (
                            <Aperture className="w-8 h-8 text-mj-gold" />
                        )}
                    </div>
                </button>
            </div>
        </div>
    );
};

export default ScanningView;
