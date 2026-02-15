export type Suit = 'bamboo' | 'dot' | 'character' | 'wind' | 'dragon' | 'flower';

export interface MahjongTile {
  code: string; // e.g., "1B", "5D", "WE" (West), "DR" (Red Dragon)
  name: string;
  suit: Suit;
  value?: number;
}

export interface Recommendation {
  action: 'discard' | 'chow' | 'pong' | 'kong' | 'hu' | 'wait';
  tile: string; // The tile to act upon (e.g., discard "5B")
  confidence: number;
  reasoning: string;
}

export interface AnalysisResult {
  myHand: string[];
  discards: string[]; // Visible discards on the table
  safeTiles: string[]; // Tiles considered safe based on discards
  recommendation: Recommendation;
}

export enum AppState {
  IDLE = 'IDLE',
  CAMERA_ACTIVE = 'CAMERA_ACTIVE',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}