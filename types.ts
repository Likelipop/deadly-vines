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
  health: number;
  maxHealth: number;
  speed: number;
  angle: number; 
  active: boolean;
  wiggleOffset: number; 
  color: string;
}

export interface Player extends Entity {
  angle: number; 
  weaponLength: number;
  baseWeaponLength: number;
  weaponLevel: 1 | 2; 
  isAttacking: boolean;
  attackCooldown: number;
  health: number;
  maxHealth: number;
  // Abilities
  teleportCooldown: number;
  isTeleporting: boolean;
  laserCooldown: number;
  isFiringLaser: boolean;
  // Buffs
  longStickTimer: number;
}

export interface Particle extends Entity {
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface Item extends Entity {
  type: 'HEALTH';
  life: number;
}

export interface Boss extends Entity {
  type: 'LONG_VINE' | 'BOSS_A' | 'SNAIL';
  health: number;
  maxHealth: number;
  segments: BossSegment[]; 
  angle: number;
  speed: number;
}

export interface BossSegment extends Position {
  radius: number;
  type: 'HEAD' | 'BODY' | 'TAIL' | 'WEAK';
  destroyed: boolean;
}

export interface Spider extends Entity {
  health: number;
  speed: number;
}

export interface PillarState {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fallen: boolean;
  opacity: number;
  label: string;
}
