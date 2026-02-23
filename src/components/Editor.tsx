import React, { useState, useRef, useEffect } from 'react';
import { LevelData, TileType } from '../types';
import { COLS, ROWS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../game/constants';
import { TILE_SIZE } from '../game/engine';
import { Play, Sparkles, Trash2, Save, FolderOpen, X, Download, Upload } from 'lucide-react';
import { generateLevel } from '../services/ai';

interface EditorProps {
  initialLevel: LevelData;
  onPlay: (level: LevelData) => void;
}

export default function Editor({ initialLevel, onPlay }: EditorProps) {
  const [level, setLevel] = useState<LevelData>(initialLevel);
  const [selectedTile, setSelectedTile] = useState<TileType>(TileType.BLOCK);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedLevels, setSavedLevels] = useState<{ [key: string]: LevelData }>({});

  // Draw the editor grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Background
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Grid lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * TILE_SIZE, 0);
      ctx.lineTo(i * TILE_SIZE, LOGICAL_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * TILE_SIZE);
      ctx.lineTo(LOGICAL_WIDTH, i * TILE_SIZE);
      ctx.stroke();
    }

    // Draw tiles
    for (let y = 0; y < level.length; y++) {
      for (let x = 0; x < level[y].length; x++) {
        const tile = level[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (tile === TileType.BLOCK) {
          ctx.fillStyle = '#8B4513';
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
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#DAA520';
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === TileType.PLAYER) {
          ctx.fillStyle = '#FF0000';
          ctx.fillRect(px + 4, py + 8, 24, 24);
          ctx.fillStyle = '#000';
          ctx.fillRect(px + 12, py + 12, 4, 4);
          ctx.fillRect(px + 18, py + 12, 4, 4);
        } else if (tile === TileType.ENEMY || tile === TileType.ENEMY_H) {
          ctx.fillStyle = tile === TileType.ENEMY_H ? '#FF8C00' : '#800080';
          ctx.fillRect(px + 4, py + 8, 24, 24);
          // Angry eyes
          ctx.strokeStyle = '#FFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px + 10, py + 14); ctx.lineTo(px + 14, py + 18);
          ctx.moveTo(px + 22, py + 14); ctx.lineTo(px + 18, py + 18);
          ctx.stroke();
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
          // Key shape
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
        }
      }
    }
  }, [level]);

  const handleCanvasInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor(((clientX - rect.left) * scaleX) / TILE_SIZE);
    const y = Math.floor(((clientY - rect.top) * scaleY) / TILE_SIZE);

    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
      updateTile(x, y, selectedTile);
    }
  };

  const updateTile = (x: number, y: number, type: TileType) => {
    setLevel(prev => {
      const newLevel = [...prev];
      let row = newLevel[y].split('');

      // If placing Player or Goal, remove existing ones
      if (type === TileType.PLAYER || type === TileType.GOAL) {
        for (let i = 0; i < newLevel.length; i++) {
          newLevel[i] = newLevel[i].replace(new RegExp(type, 'g'), TileType.EMPTY);
        }
        row = newLevel[y].split(''); // Re-fetch row as it might have been modified
      }

      row[x] = type;
      newLevel[y] = row.join('');
      return newLevel;
    });
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const newLevel = await generateLevel(prompt);
      setLevel(newLevel);
    } catch (e) {
      alert('生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    const emptyLevel = Array(ROWS).fill(TileType.EMPTY.repeat(COLS));
    setLevel(emptyLevel);
  };

  const getSavedLevels = (): { [key: string]: LevelData } => {
    try {
      const data = localStorage.getItem('custom_levels');
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Failed to parse saved levels:', e);
      return {};
    }
  };

  const handleSave = () => {
    const name = window.prompt('保存するステージ名を入力してください:');
    if (!name) return;

    const levels = getSavedLevels();
    levels[name] = level;
    try {
      localStorage.setItem('custom_levels', JSON.stringify(levels));
      alert(`「${name}」を保存しました。`);
    } catch (e) {
      alert('保存に失敗しました。');
      console.error(e);
    }
  };

  const handleOpenLoadModal = () => {
    setSavedLevels(getSavedLevels());
    setShowLoadModal(true);
  };

  const handleLoad = (name: string) => {
    const levelData = savedLevels[name];
    if (levelData) {
      setLevel(levelData);
      setShowLoadModal(false);
    }
  };

  const handleDelete = (name: string) => {
    if (confirm(`本当に「${name}」を削除しますか？`)) {
      const newLevels = { ...savedLevels };
      delete newLevels[name];
      setSavedLevels(newLevels);
      try {
        localStorage.setItem('custom_levels', JSON.stringify(newLevels));
      } catch (e) {
        console.error('Failed to update localStorage after delete:', e);
      }
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedLevels, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "ai_maker_stages.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (typeof importedData !== 'object' || importedData === null) {
          throw new Error('Invalid format');
        }

        const mergedLevels = { ...savedLevels, ...importedData };
        setSavedLevels(mergedLevels);
        localStorage.setItem('custom_levels', JSON.stringify(mergedLevels));
        alert('ステージをインポートしました。');
      } catch (err) {
        console.error('Failed to import stages:', err);
        alert('ファイルの読み込みに失敗しました。正しいJSONファイルを選択してください。');
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex gap-2 mr-auto flex-wrap">
          <TileButton type={TileType.BLOCK} current={selectedTile} onClick={setSelectedTile} label="ブロック" color="bg-amber-800" />
          <TileButton type={TileType.SPIKE} current={selectedTile} onClick={setSelectedTile} label="トゲ" color="bg-gray-400" />
          <TileButton type={TileType.JUMP_PAD} current={selectedTile} onClick={setSelectedTile} label="ジャンプ台" color="bg-orange-500" />
          <TileButton type={TileType.ENEMY} current={selectedTile} onClick={setSelectedTile} label="敵(縦)" color="bg-purple-600" />
          <TileButton type={TileType.ENEMY_H} current={selectedTile} onClick={setSelectedTile} label="敵(横)" color="bg-amber-500" />
          <TileButton type={TileType.COIN} current={selectedTile} onClick={setSelectedTile} label="コイン" color="bg-yellow-300 rounded-full" />
          <TileButton type={TileType.KEY} current={selectedTile} onClick={setSelectedTile} label="鍵" color="bg-yellow-500" />
          <TileButton type={TileType.SAVE_POINT} current={selectedTile} onClick={setSelectedTile} label="セーブ" color="bg-green-500" />
          <TileButton type={TileType.PLAYER} current={selectedTile} onClick={setSelectedTile} label="プレイヤー" color="bg-red-500" />
          <TileButton type={TileType.GOAL} current={selectedTile} onClick={setSelectedTile} label="ゴール" color="bg-yellow-400" />
          <TileButton type={TileType.EMPTY} current={selectedTile} onClick={setSelectedTile} label="消しゴム" color="bg-white border-2 border-gray-200" />
        </div>

        <div className="flex gap-2">
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200">
            <Save size={18} />
            <span className="hidden sm:inline">保存</span>
          </button>
          <button onClick={handleOpenLoadModal} className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200">
            <FolderOpen size={18} />
            <span className="hidden sm:inline">読込</span>
          </button>
          <button onClick={handleClear} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-2">
            <Trash2 size={18} />
            <span className="hidden sm:inline">クリア</span>
          </button>
          <button
            onClick={() => onPlay(level)}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-colors shadow-sm"
          >
            <Play size={18} />
            プレイ
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full aspect-[24/16] bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 touch-none">
        <canvas
          ref={canvasRef}
          width={LOGICAL_WIDTH}
          height={LOGICAL_HEIGHT}
          className="w-full h-full object-contain cursor-crosshair"
          onMouseDown={(e) => { setIsDrawing(true); handleCanvasInteraction(e); }}
          onMouseMove={(e) => { if (isDrawing) handleCanvasInteraction(e); }}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
          onTouchStart={(e) => { setIsDrawing(true); handleCanvasInteraction(e); }}
          onTouchMove={(e) => { if (isDrawing) handleCanvasInteraction(e); }}
          onTouchEnd={() => setIsDrawing(false)}
        />
      </div>

      {/* AI Generation */}
      <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
        <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-500" />
          AIでステージを自動生成
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="例：ジャンプが多い難しいステージ"
            className="flex-1 px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            {isGenerating ? '生成中...' : '生成する'}
          </button>
        </div>
      </div>

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">保存されたステージ</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  title="エクスポート"
                  className="px-3 py-1.5 flex items-center gap-1.5 text-sm bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Download size={14} /> ダウンロード
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="インポート"
                  className="px-3 py-1.5 flex items-center gap-1.5 text-sm bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Upload size={14} /> アップロード
                </button>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImport}
                />
                <button
                  onClick={() => setShowLoadModal(false)}
                  className="ml-2 p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {Object.keys(savedLevels).length === 0 ? (
                <p className="text-gray-500 text-center py-8">保存されたステージはありません</p>
              ) : (
                <ul className="space-y-2">
                  {Object.entries(savedLevels).map(([name, _]) => (
                    <li key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-300 transition-colors">
                      <span className="font-medium text-gray-700 truncate mr-4">{name}</span>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleLoad(name)}
                          className="px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md text-sm font-medium transition-colors"
                        >
                          読み込む
                        </button>
                        <button
                          onClick={() => handleDelete(name)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="削除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TileButton({ type, current, onClick, label, color }: { type: TileType, current: TileType, onClick: (t: TileType) => void, label: string, color: string }) {
  const isSelected = type === current;
  return (
    <button
      onClick={() => onClick(type)}
      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${isSelected ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-gray-100'}`}
      title={label}
    >
      <div className={`w-6 h-6 rounded-sm shadow-sm ${color}`} />
      <span className="text-[10px] font-medium text-gray-600 hidden sm:block">{label}</span>
    </button>
  );
}
