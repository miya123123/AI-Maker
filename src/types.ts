export enum TileType {
  EMPTY = '.',
  BLOCK = 'X',
  PLAYER = 'P',
  GOAL = 'G',
  SPIKE = 'S',
  ENEMY = 'E',
  ENEMY_H = 'H', // New: Horizontal moving enemy
  KEY = 'K',
  JUMP_PAD = 'J',
  COIN = 'C',
  SAVE_POINT = 'V' // Save Point flag
}

export type LevelData = string[];
