export enum GameState {
  CINEMATIC = 'CINEMATIC',
  INTRO = 'INTRO',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  PAUSED = 'PAUSED'
}

export interface Position {
  x: number;
  y: number;
}

export interface Entity extends Position {
  id: string;
  radius: number;
}

export interface Vine extends Entity {
  speed: number;
  angle: number; // Movement direction
  active: boolean;
  wiggleOffset: number; // For visual animation
  color: string;
}

export interface Player extends Entity {
  angle: number; // Facing direction
  weaponLength: number;
  weaponLevel: 1 | 2; // 1 = Single Stick, 2 = Double Staff
  isAttacking: boolean;
  attackCooldown: number;
  health: number;
}

export interface Particle extends Entity {
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface StoryContext {
  level: number;
  text: string;
  loading: boolean;
}

// --- NEW TYPES ---

export interface BossSegment extends Position {
  radius: number;
  isWeakPoint: boolean;
  destroyed: boolean;
}

export interface Boss extends Entity {
  type: 'LONG_VINE' | 'BOSS_A';
  health: number;
  maxHealth: number;
  segments: BossSegment[]; // For Long Vine
  angle: number;
  speed: number;
  active: boolean;
  // Specific for Boss A
  tailPosition?: Position; 
  headPosition?: Position;
}

export interface Spider extends Entity {
  health: number;
  speed: number;
  targetId: string; // usually player
}

export interface PillarState {
  x: number;
  y: number;
  rotation: number;
  fallen: boolean;
  opacity: number;
}
