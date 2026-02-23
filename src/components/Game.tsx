import React, { useEffect, useRef, useState } from 'react';
import { LevelData, TileType } from '../types';
import { COLS, ROWS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../game/constants';
import { createPlayer, updatePhysics, Player, Enemy, InputState, TILE_SIZE } from '../game/engine';
import MobileControls from './MobileControls';

interface GameProps {
  level: LevelData;
  onExit: () => void;
}

export default function Game({ level, onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'dead' | 'won'>('playing');

  const inputRef = useRef<InputState>({ left: false, right: false, jump: false });
  const playerRef = useRef<Player | null>(null);
  const mutableLevelRef = useRef<string[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const totalKeysRef = useRef<number>(0);
  const savePointRef = useRef<{ x: number, y: number, score: number, keys: number, levelState: string[] } | null>(null);

  const initGame = () => {
    let startX = 50;
    let startY = 50;
    let keysCount = 0;
    let enemies: Enemy[] = [];
    let mutLevel = [...level];
    let startScore = 0;
    let startKeys = 0;

    for (let y = 0; y < mutLevel.length; y++) {
      let row = mutLevel[y].split('');
      for (let x = 0; x < row.length; x++) {
        if (row[x] === TileType.PLAYER) {
          if (!savePointRef.current) {
            startX = x * TILE_SIZE + 4;
            startY = y * TILE_SIZE + 8;
          }
        } else if (row[x] === TileType.KEY) {
          keysCount++;
        } else if (row[x] === TileType.ENEMY || row[x] === TileType.ENEMY_H) {
          const isH = row[x] === TileType.ENEMY_H;
          enemies.push({
            type: isH ? 'H' : 'V',
            x: x * TILE_SIZE + 4,
            y: y * TILE_SIZE + 8,
            initialX: x * TILE_SIZE + 4,
            initialY: y * TILE_SIZE + 8,
            w: 24, h: 24,
            vx: isH ? 2 : 0,
            vy: isH ? 0 : 2,
            isDead: false
          });
          row[x] = TileType.EMPTY;
        }
      }
      mutLevel[y] = row.join('');
    }
    if (savePointRef.current) {
      startX = savePointRef.current.x;
      startY = savePointRef.current.y;
      startScore = savePointRef.current.score;
      startKeys = savePointRef.current.keys;
      mutLevel = [...savePointRef.current.levelState];
    }

    playerRef.current = createPlayer(startX, startY);
    playerRef.current.score = startScore;
    playerRef.current.keys = startKeys;
    mutableLevelRef.current = mutLevel;
    enemiesRef.current = enemies;
    totalKeysRef.current = keysCount;
    setGameState('playing');
  };

  useEffect(() => {
    savePointRef.current = null;
    initGame();
  }, [level]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') inputRef.current.left = true;
      if (e.code === 'ArrowRight') inputRef.current.right = true;
      if (e.code === 'KeyZ' || e.code === 'ArrowUp') inputRef.current.jump = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') inputRef.current.left = false;
      if (e.code === 'ArrowRight') inputRef.current.right = false;
      if (e.code === 'KeyZ' || e.code === 'ArrowUp') inputRef.current.jump = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const loop = () => {
      if (playerRef.current && gameState === 'playing') {
        const onCollect = (x: number, y: number, type: TileType) => {
          if (type === TileType.SAVE_POINT) {
            if (playerRef.current) {
              savePointRef.current = {
                x: x * TILE_SIZE + 4,
                y: y * TILE_SIZE + 8,
                score: playerRef.current.score,
                keys: playerRef.current.keys,
                levelState: [...mutableLevelRef.current]
              };
            }
          } else {
            let row = mutableLevelRef.current[y].split('');
            row[x] = TileType.EMPTY;
            mutableLevelRef.current[y] = row.join('');
          }
        };
        updatePhysics(
          playerRef.current,
          mutableLevelRef.current,
          inputRef.current,
          enemiesRef.current,
          onCollect,
          totalKeysRef.current
        );
        if (playerRef.current.isDead) setGameState('dead');
        if (playerRef.current.hasWon) setGameState('won');
      }

      // Render
      ctx.fillStyle = '#87CEEB'; // Sky blue
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      // Draw level
      for (let y = 0; y < mutableLevelRef.current.length; y++) {
        for (let x = 0; x < mutableLevelRef.current[y].length; x++) {
          const tile = mutableLevelRef.current[y][x];
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;

          if (tile === TileType.BLOCK) {
            ctx.fillStyle = '#8B4513'; // Brown
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          } else if (tile === TileType.SPIKE) {
            ctx.fillStyle = '#A9A9A9';
            ctx.beginPath();
            ctx.moveTo(px + TILE_SIZE / 2, py);
            ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
            ctx.lineTo(px, py + TILE_SIZE);
            ctx.fill();
          } else if (tile === TileType.GOAL) {
            ctx.fillStyle = '#FFD700'; // Gold
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#DAA520';
            ctx.beginPath();
            ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (tile === TileType.JUMP_PAD) {
            // Spring Base
            ctx.fillStyle = '#696969'; // DimGray
            ctx.fillRect(px + 4, py + TILE_SIZE - 6, TILE_SIZE - 8, 6);
            // Spring Coils (Zigzag)
            ctx.strokeStyle = '#C0C0C0'; // Silver
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px + 8, py + TILE_SIZE - 6);
            ctx.lineTo(px + TILE_SIZE - 8, py + TILE_SIZE - 10);
            ctx.lineTo(px + 8, py + TILE_SIZE - 14);
            ctx.lineTo(px + TILE_SIZE - 8, py + TILE_SIZE - 18);
            ctx.lineTo(px + 8, py + TILE_SIZE - 22);
            ctx.stroke();
            // Spring Top Pad
            ctx.fillStyle = '#FF0000'; // Red
            ctx.fillRect(px + 2, py + TILE_SIZE - 26, TILE_SIZE - 4, 4);
          } else if (tile === TileType.COIN) {
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#DAA520';
            ctx.lineWidth = 2;
            ctx.stroke();
          } else if (tile === TileType.KEY) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(px + 12, py + TILE_SIZE / 2, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(px + 18, py + TILE_SIZE / 2 - 2, 10, 4);
            ctx.fillRect(px + 24, py + TILE_SIZE / 2 + 2, 2, 4);
          } else if (tile === TileType.SAVE_POINT) {
            ctx.fillStyle = '#2E8B57';
            ctx.fillRect(px + TILE_SIZE / 2 - 2, py, 4, TILE_SIZE);
            ctx.fillStyle = '#32CD32';
            ctx.beginPath();
            ctx.moveTo(px + TILE_SIZE / 2 + 2, py);
            ctx.lineTo(px + TILE_SIZE - 2, py + TILE_SIZE / 4);
            ctx.lineTo(px + TILE_SIZE / 2 + 2, py + TILE_SIZE / 2);
            ctx.fill();

            // Highlight if it's the current save point
            if (savePointRef.current &&
              Math.abs(savePointRef.current.x - (x * TILE_SIZE + 4)) < 1 &&
              Math.abs(savePointRef.current.y - (y * TILE_SIZE + 8)) < 1) {
              ctx.fillStyle = 'rgba(50, 205, 50, 0.4)';
              ctx.beginPath();
              ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE - 4, TILE_SIZE / 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (tile === TileType.PLAYER) {
            // Draw a faint ghost of start position
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          }
        }
      }

      // Draw enemies
      enemiesRef.current.forEach(enemy => {
        if (enemy.isDead) return;
        ctx.fillStyle = enemy.type === 'H' ? '#FF8C00' : '#800080'; // Orange for horizontal, Purple for vertical
        ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const dirX = enemy.vx > 0 ? 1 : (enemy.vx < 0 ? -1 : 0);
        const dirY = enemy.vy > 0 ? 1 : (enemy.vy < 0 ? -1 : 0);

        // Adjust eyes based on movement direction
        let eyeOffsetX = dirX * 4;
        let eyeOffsetY = dirY * 4;

        ctx.moveTo(enemy.x + 6 + eyeOffsetX, enemy.y + 6 + eyeOffsetY); ctx.lineTo(enemy.x + 10 + eyeOffsetX, enemy.y + 10 + eyeOffsetY);
        ctx.moveTo(enemy.x + 18 + eyeOffsetX, enemy.y + 6 + eyeOffsetY); ctx.lineTo(enemy.x + 14 + eyeOffsetX, enemy.y + 10 + eyeOffsetY);
        ctx.stroke();
      });

      // Draw player
      if (playerRef.current) {
        ctx.fillStyle = '#FF0000'; // Red Mario-ish
        ctx.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.w, playerRef.current.h);
        // Eyes
        ctx.fillStyle = '#000';
        const dir = inputRef.current.left ? -1 : (inputRef.current.right ? 1 : 0);
        const eyeOffset = dir === -1 ? 2 : (dir === 1 ? 14 : 8);
        ctx.fillRect(playerRef.current.x + eyeOffset, playerRef.current.y + 4, 4, 4);
        ctx.fillRect(playerRef.current.x + eyeOffset + 6, playerRef.current.y + 4, 4, 4);
      }

      // Draw HUD
      if (playerRef.current) {
        ctx.fillStyle = '#FFF';
        ctx.font = '20px sans-serif';
        ctx.fillText(`SCORE: ${playerRef.current.score}`, LOGICAL_WIDTH - 150, 30);
        if (totalKeysRef.current > 0) {
          ctx.fillText(`KEYS: ${playerRef.current.keys} / ${totalKeysRef.current}`, 20, 30);
        }
      }

      animationId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationId);
  }, [level, gameState]);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      <div className="relative w-full aspect-[24/16] bg-black rounded-lg overflow-hidden shadow-xl">
        <canvas
          ref={canvasRef}
          width={LOGICAL_WIDTH}
          height={LOGICAL_HEIGHT}
          className="w-full h-full object-contain"
        />

        {gameState !== 'playing' && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
            <h2 className="text-4xl font-bold mb-4">
              {gameState === 'won' ? 'ステージクリア！' : 'ゲームオーバー'}
            </h2>
            <div className="flex gap-4">
              <button
                onClick={initGame}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full font-bold"
              >
                リトライ
              </button>
              <button
                onClick={onExit}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-full font-bold"
              >
                エディターに戻る
              </button>
            </div>
          </div>
        )}
      </div>

      <MobileControls inputRef={inputRef} />
    </div>
  );
}
