import React from 'react';
import { TILE_MAP } from '../constants';

interface MahjongTileProps {
  code: string;
  isHero?: boolean;
  highlight?: boolean;
}

/**
 * Get the CSS suit class based on the tile code.
 */
const getSuitClass = (code: string): string => {
  if (code.endsWith('C')) return 'suit-wan';
  if (code.endsWith('D')) return 'suit-tong';
  if (code.endsWith('B')) return 'suit-suo';
  if (code === 'Red') return 'suit-red';
  if (code === 'Green') return 'suit-green';
  // Winds and White dragon
  return 'suit-honor';
};

const MahjongTile: React.FC<MahjongTileProps> = ({ code, isHero = false, highlight = false }) => {
  const symbol = TILE_MAP[code] || code;
  const suitClass = getSuitClass(code);

  const classes = [
    'mj-tile',
    isHero ? 'hero' : '',
    highlight ? 'mj-tile-highlight' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} title={code}>
      <span className={suitClass}>{symbol}</span>
    </div>
  );
};

export default MahjongTile;
