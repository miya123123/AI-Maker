import { TileType, LevelData } from '../types';
import { COLS, ROWS } from './constants';

export const TILE_SIZE = 32;

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  isDead: boolean;
  hasWon: boolean;
  keys: number;
  score: number;
}

export interface Enemy {
  type: 'V' | 'H'; // 'V' for vertical, 'H' for horizontal
  x: number;
  y: number;
  w: number;
  h: number;
  initialX: number;
  initialY: number;
  vx: number;
  vy: number;
  isDead: boolean;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export function createPlayer(x: number, y: number): Player {
  return {
    x, y, w: 24, h: 24, vx: 0, vy: 0,
    isGrounded: false, isDead: false, hasWon: false,
    keys: 0, score: 0
  };
}

export function updatePhysics(
  player: Player,
  level: LevelData,
  input: InputState,
  enemies: Enemy[],
  onCollect: (x: number, y: number, type: TileType) => void,
  totalKeys: number
) {
  if (player.isDead || player.hasWon) return;

  // Update enemies
  enemies.forEach(enemy => {
    if (enemy.isDead) return;

    if (enemy.type === 'H') {
      enemy.x += enemy.vx;
      // Reverse direction if hitting amplitude limit or wall
      const amplitude = 3 * TILE_SIZE;
      if (Math.abs(enemy.x - enemy.initialX) >= amplitude) {
        enemy.vx *= -1;
      }

      const headCol = Math.floor((enemy.vx > 0 ? enemy.x + enemy.w : enemy.x) / TILE_SIZE);
      const row = Math.floor((enemy.y + enemy.h / 2) / TILE_SIZE);
      if (row >= 0 && row < level.length && headCol >= 0 && headCol < level[row].length) {
        const tile = level[row][headCol];
        if (tile === TileType.BLOCK || tile === TileType.SPIKE) {
          enemy.vx *= -1; // Reverse direction
        }
      }
    } else if (enemy.type === 'V') {
      enemy.y += enemy.vy;
      // Reverse direction if hitting amplitude limit or floor/ceiling
      const amplitude = 3 * TILE_SIZE;
      if (Math.abs(enemy.y - enemy.initialY) >= amplitude) {
        enemy.vy *= -1;
      }

      const headRow = Math.floor((enemy.vy > 0 ? enemy.y + enemy.h : enemy.y) / TILE_SIZE);
      const col = Math.floor((enemy.x + enemy.w / 2) / TILE_SIZE);
      if (headRow >= 0 && headRow < level.length && col >= 0 && col < level[headRow].length) {
        const tile = level[headRow][col];
        if (tile === TileType.BLOCK || tile === TileType.SPIKE) {
          enemy.vy *= -1; // Reverse direction
        }
      }
    }
    // Check collision with player
    if (
      player.x < enemy.x + enemy.w &&
      player.x + player.w > enemy.x &&
      player.y < enemy.y + enemy.h &&
      player.y + player.h > enemy.y
    ) {
      player.isDead = true;
    }
  });

  if (player.isDead) return;

  // Horizontal movement
  if (input.left) player.vx = -4;
  else if (input.right) player.vx = 4;
  else player.vx = 0;

  player.x += player.vx;
  handleCollisions(player, level, true, onCollect, totalKeys);

  // Vertical movement
  player.vy += 0.5; // Gravity
  if (player.vy > 12) player.vy = 12; // Terminal velocity

  if (input.jump && player.isGrounded) {
    player.vy = -10;
    player.isGrounded = false;
  }

  player.y += player.vy;
  player.isGrounded = false;
  handleCollisions(player, level, false, onCollect, totalKeys);

  // Screen bounds
  if (player.y > ROWS * TILE_SIZE) {
    player.isDead = true;
  }
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > COLS * TILE_SIZE) player.x = COLS * TILE_SIZE - player.w;
}

function handleCollisions(
  player: Player,
  level: LevelData,
  isHorizontal: boolean,
  onCollect: (x: number, y: number, type: TileType) => void,
  totalKeys: number
) {
  const startCol = Math.floor(player.x / TILE_SIZE);
  const endCol = Math.floor((player.x + player.w - 1) / TILE_SIZE);
  const startRow = Math.floor(player.y / TILE_SIZE);
  const endRow = Math.floor((player.y + player.h - 1) / TILE_SIZE);

  for (let y = startRow; y <= endRow; y++) {
    for (let x = startCol; x <= endCol; x++) {
      if (y >= 0 && y < level.length && x >= 0 && x < level[y].length) {
        const tile = level[y][x];
        if (tile === TileType.BLOCK) {
          if (isHorizontal) {
            if (player.vx > 0) {
              player.x = x * TILE_SIZE - player.w;
            } else if (player.vx < 0) {
              player.x = x * TILE_SIZE + TILE_SIZE;
            }
            player.vx = 0;
          } else {
            if (player.vy > 0) {
              player.y = y * TILE_SIZE - player.h;
              player.isGrounded = true;
            } else if (player.vy < 0) {
              player.y = y * TILE_SIZE + TILE_SIZE;
            }
            player.vy = 0;
          }
        } else if (tile === TileType.SPIKE || tile === TileType.ENEMY) {
          player.isDead = true;
        } else if (tile === TileType.GOAL) {
          if (totalKeys === 0 || player.keys >= totalKeys) {
            player.hasWon = true;
          }
        } else if (tile === TileType.JUMP_PAD) {
          if (!isHorizontal && player.vy > 0) {
            player.y = y * TILE_SIZE - player.h;
            player.vy = -16;
            player.isGrounded = false;
          }
        } else if (tile === TileType.COIN) {
          player.score += 100;
          onCollect(x, y, TileType.COIN);
        } else if (tile === TileType.KEY) {
          player.keys += 1;
          onCollect(x, y, TileType.KEY);
        } else if (tile === TileType.SAVE_POINT) {
          onCollect(x, y, TileType.SAVE_POINT);
        }
      }
    }
  }
}
