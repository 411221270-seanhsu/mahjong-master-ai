import React from 'react';
import { TILE_MAP } from '../constants';

interface MahjongTileProps {
  code: string;
  isHero?: boolean;
  isDiscard?: boolean;
  highlight?: boolean;
}

/**
 * Get the CSS suit class based on the tile code.
 * Wan (萬) = Red, Tong (筒) = Blue, Suo (索) = Green, Honor = Dark.
 */
const getSuitClass = (code: string): string => {
  if (code.endsWith('C')) return 'suit-wan';
  if (code.endsWith('D')) return 'suit-tong';
  if (code.endsWith('B')) return 'suit-suo';
  if (code === 'Red') return 'suit-red';
  if (code === 'Green') return 'suit-green';
  return 'suit-honor';
};

const MahjongTile: React.FC<MahjongTileProps> = ({
  code,
  isHero = false,
  isDiscard = false,
  highlight = false,
}) => {
  const symbol = TILE_MAP[code] || code;
  const suitClass = getSuitClass(code);

  const classes = [
    'mj-tile',
    isHero ? 'hero' : '',
    isDiscard ? 'discard' : '',
    highlight ? 'mj-tile-highlight' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} title={code}>
      <span className={`${suitClass} relative z-10 drop-shadow-sm`}>{symbol}</span>
    </div>
  );
};

export default MahjongTile;
