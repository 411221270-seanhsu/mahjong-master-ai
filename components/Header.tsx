import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="relative z-20 px-6 py-4 flex justify-between items-center glass-panel border-b-0 border-b-white/5">
            <div className="flex items-center gap-3">
                {/* Pinging indicator dot */}
                <div className="relative w-2.5 h-2.5">
                    <div className="absolute inset-0 bg-mj-gold rounded-full animate-ping opacity-75"></div>
                    <div className="relative w-2.5 h-2.5 bg-mj-gold rounded-full"></div>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-mj-gold tracking-[0.2em] font-bold font-mono">
                        SYSTEM ONLINE
                    </span>
                    <span className="text-xs font-bold tracking-wide">台灣麻將戰術助手</span>
                </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="text-[10px] text-white/60 font-mono">MODE:</span>
                <span className="text-[10px] text-emerald-400 font-bold font-mono">TW-16</span>
            </div>
        </header>
    );
};

export default Header;
