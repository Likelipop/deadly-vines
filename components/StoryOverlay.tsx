import React from 'react';
import { GameState } from '../types';

interface StoryOverlayProps {
  gameState: GameState;
  storyText: string;
  onStart: () => void;
  level: number;
  score: number;
}

export const StoryOverlay: React.FC<StoryOverlayProps> = ({ gameState, storyText, onStart, level, score }) => {
  if (gameState === GameState.PLAYING) return null;

  const isGameOver = gameState === GameState.GAME_OVER;
  const isIntro = gameState === GameState.INTRO;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="max-w-2xl w-full bg-stone-900 border-2 border-stone-700 rounded-lg shadow-2xl p-8 text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-stone-800 via-green-900 to-stone-800"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-stone-800 via-green-900 to-stone-800"></div>

        <h1 className="text-4xl md:text-5xl font-bold text-green-500 mb-6 title-font tracking-wider shadow-black drop-shadow-lg">
          {isGameOver ? "FALLEN HERO" : (level === 1 ? "THE THREE PILLARS" : `LEVEL ${level}`)}
        </h1>

        <div className="min-h-[80px] flex items-center justify-center mb-8">
          <p className="text-xl md:text-2xl text-stone-300 italic leading-relaxed font-serif">
            "{storyText}"
          </p>
        </div>

        {isGameOver && (
          <div className="mb-8">
            <p className="text-stone-400">Vines Severed</p>
            <p className="text-4xl font-bold text-white">{score}</p>
          </div>
        )}

        <button
          onClick={onStart}
          className="group relative px-8 py-4 bg-stone-800 hover:bg-green-900 text-white font-bold rounded transition-all duration-300 transform hover:scale-105 border border-stone-600 hover:border-green-500 overflow-hidden"
        >
          <span className="relative z-10 text-lg tracking-widest">
            {isGameOver ? "REAWAKEN" : "DEFEND THE RUINS"}
          </span>
          <div className="absolute inset-0 h-full w-full bg-green-800/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
        </button>

        <div className="mt-8 text-stone-500 text-sm">
          <p className="mb-1"><span className="text-green-400 font-bold">WASD / ARROWS</span> to Move</p>
          <p><span className="text-green-400 font-bold">CLICK</span> to Swing Stick</p>
        </div>
      </div>
    </div>
  );
};