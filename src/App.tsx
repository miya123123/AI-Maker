import React, { useState } from 'react';
import Editor from './components/Editor';
import Game from './components/Game';
import { LevelData, TileType } from './types';
import { COLS, ROWS } from './game/constants';
import { Pickaxe, Gamepad2 } from 'lucide-react';

// Default level
const defaultLevel: LevelData = Array(ROWS).fill(TileType.EMPTY.repeat(COLS));
// Add some ground
defaultLevel[ROWS - 2] = TileType.BLOCK.repeat(COLS);
defaultLevel[ROWS - 1] = TileType.BLOCK.repeat(COLS);
// Add player and goal
defaultLevel[ROWS - 3] = 'P' + TileType.EMPTY.repeat(COLS - 3) + 'G.';

export default function App() {
  const [mode, setMode] = useState<'edit' | 'play'>('edit');
  const [level, setLevel] = useState<LevelData>(defaultLevel);

  const handlePlay = (newLevel: LevelData) => {
    // Validate
    const str = newLevel.join('');
    if (!str.includes('P')) {
      alert('プレイヤーの初期位置(P)を配置してください。');
      return;
    }
    if (!str.includes('G')) {
      alert('ゴール(G)を配置してください。');
      return;
    }
    setLevel(newLevel);
    setMode('play');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-extrabold text-xl tracking-tight flex items-center gap-2">
            <span className="text-emerald-500">AI</span> Maker
          </h1>
          
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setMode('edit')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'edit' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Pickaxe size={16} />
              <span className="hidden sm:inline">つくる</span>
            </button>
            <button
              onClick={() => mode === 'edit' && handlePlay(level)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'play' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Gamepad2 size={16} />
              <span className="hidden sm:inline">あそぶ</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        {mode === 'edit' ? (
          <Editor initialLevel={level} onPlay={handlePlay} />
        ) : (
          <Game level={level} onExit={() => setMode('edit')} />
        )}
      </main>
    </div>
  );
}
