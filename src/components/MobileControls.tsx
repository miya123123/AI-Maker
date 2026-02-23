import React from 'react';
import { InputState } from '../game/engine';
import { ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';

interface Props {
  inputRef: React.MutableRefObject<InputState>;
}

export default function MobileControls({ inputRef }: Props) {
  // Prevent default touch behavior to avoid zooming/scrolling
  const handleTouchStart = (e: React.TouchEvent, key: keyof InputState) => {
    e.preventDefault();
    inputRef.current[key] = true;
  };
  
  const handleTouchEnd = (e: React.TouchEvent, key: keyof InputState) => {
    e.preventDefault();
    inputRef.current[key] = false;
  };

  return (
    <div className="w-full flex justify-between px-4 py-6 sm:hidden select-none">
      <div className="flex gap-4">
        <button
          className="w-16 h-16 bg-gray-200/50 active:bg-gray-300 rounded-full flex items-center justify-center touch-none"
          onTouchStart={(e) => handleTouchStart(e, 'left')}
          onTouchEnd={(e) => handleTouchEnd(e, 'left')}
          onMouseDown={() => inputRef.current.left = true}
          onMouseUp={() => inputRef.current.left = false}
          onMouseLeave={() => inputRef.current.left = false}
        >
          <ArrowLeft size={32} />
        </button>
        <button
          className="w-16 h-16 bg-gray-200/50 active:bg-gray-300 rounded-full flex items-center justify-center touch-none"
          onTouchStart={(e) => handleTouchStart(e, 'right')}
          onTouchEnd={(e) => handleTouchEnd(e, 'right')}
          onMouseDown={() => inputRef.current.right = true}
          onMouseUp={() => inputRef.current.right = false}
          onMouseLeave={() => inputRef.current.right = false}
        >
          <ArrowRight size={32} />
        </button>
      </div>
      <button
        className="w-16 h-16 bg-blue-200/50 active:bg-blue-300 rounded-full flex items-center justify-center touch-none"
        onTouchStart={(e) => handleTouchStart(e, 'jump')}
        onTouchEnd={(e) => handleTouchEnd(e, 'jump')}
        onMouseDown={() => inputRef.current.jump = true}
        onMouseUp={() => inputRef.current.jump = false}
        onMouseLeave={() => inputRef.current.jump = false}
      >
        <ArrowUp size={32} />
      </button>
    </div>
  );
}
