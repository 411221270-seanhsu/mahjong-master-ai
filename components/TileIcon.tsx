import React from 'react';
import { TILE_MAP } from '../constants';

interface TileIconProps {
  code: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  highlight?: boolean;
}

const TileIcon: React.FC<TileIconProps> = ({ code, size = 'md', highlight = false }) => {
  const symbol = TILE_MAP[code] || code;

  const sizeClasses = {
    sm: 'text-2xl w-8 h-10',
    md: 'text-4xl w-12 h-16',
    lg: 'text-5xl w-16 h-20',
    xl: 'text-7xl w-24 h-32',
  };

  // Mahjong tiles usually have specific colors for suits in UI
  const getTextColor = (c: string) => {
    if (c.includes('B')) return 'text-emerald-600'; // Bamboo Green
    if (c.includes('D')) return 'text-blue-600'; // Dot Blue
    if (c.includes('C')) return 'text-red-600'; // Character Red
    if (['Red', 'Green', 'White', 'East', 'South', 'West', 'North'].includes(c)) {
       if (c === 'Red') return 'text-red-600';
       if (c === 'Green') return 'text-emerald-600';
       return 'text-black';
    }
    return 'text-black';
  };
  
  // Clean the code to matching lookup if needed, though exact match is expected
  // Heuristics for colors if code isn't perfect matches
  let textColorClass = 'text-slate-800';
  if (code.endsWith('B') || code === 'Green') textColorClass = 'text-emerald-700';
  else if (code.endsWith('D')) textColorClass = 'text-blue-700';
  else if (code.endsWith('C') || code === 'Red') textColorClass = 'text-red-700';
  
  const baseClasses = `
    flex items-center justify-center 
    bg-white rounded-md shadow-md border-b-4 border-slate-300
    select-none font-serif leading-none
    ${sizeClasses[size]}
    ${highlight ? 'ring-4 ring-yellow-400 transform -translate-y-2' : ''}
    ${textColorClass}
    transition-all duration-300
  `;

  return (
    <div className={baseClasses} title={code}>
      <span className="filter drop-shadow-sm">{symbol}</span>
    </div>
  );
};

export default TileIcon;