import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { StoryOverlay } from './components/StoryOverlay';
import { generateStorySegment } from './services/geminiService';
import { GameState } from './types';
import { Volume2, VolumeX } from 'lucide-react';

const App: React.FC = () => {
  // Start in CINEMATIC mode
  const [gameState, setGameState] = useState<GameState>(GameState.CINEMATIC);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [storyText, setStoryText] = useState("Loading ancient history...");
  const [muted, setMuted] = useState(false);

  // Initialize Story
  useEffect(() => {
    const initStory = async () => {
      const text = await generateStorySegment(1, 'start');
      setStoryText(text);
    };
    initStory();
  }, []);

  const startGame = useCallback(() => {
    setGameState(GameState.PLAYING);
  }, []);

  const handleGameOver = useCallback(async () => {
    setGameState(GameState.GAME_OVER);
    // Fetch taunt
    const taunt = await generateStorySegment(level, 'gameover');
    setStoryText(taunt);
  }, [level]);

  const restartGame = useCallback(async () => {
    setLevel(1);
    setScore(0);
    setStoryText("Rebuilding the timeline...");
    const text = await generateStorySegment(1, 'start');
    setStoryText(text);
    setGameState(GameState.PLAYING); // Skip cinematic on restart, or go to INTRO
  }, []);

  return (
    <div className="relative w-full h-screen bg-neutral-900 overflow-hidden select-none">
      
      {/* Game Layer */}
      <GameCanvas 
        gameState={gameState} 
        setGameState={setGameState}
        level={level}
        setLevel={setLevel}
        score={score}
        setScore={setScore}
        triggerGameOver={handleGameOver}
      />

      {/* UI HUD */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold text-white drop-shadow-md title-font">
              LEVEL {level}
            </h2>
            <p className="text-green-400 font-mono text-xl">VINES: {score}</p>
          </div>
          
          <div className="pointer-events-auto flex gap-2">
            <button 
              onClick={() => setMuted(!muted)}
              className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
            >
              {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
        </div>
      )}

      {/* Story / Menu Overlay - Hidden during CINEMATIC */}
      {(gameState === GameState.INTRO || gameState === GameState.GAME_OVER) && (
        <StoryOverlay 
          gameState={gameState}
          storyText={storyText}
          onStart={gameState === GameState.GAME_OVER ? restartGame : startGame}
          level={level}
          score={score}
        />
      )}
    </div>
  );
};

export default App;