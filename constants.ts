export const CANVAS_WIDTH = window.innerWidth;
export const CANVAS_HEIGHT = window.innerHeight;

export const PLAYER_RADIUS = 20;
export const PLAYER_SPEED = 5; 
export const INITIAL_WEAPON_LENGTH = 120;
export const ATTACK_DURATION = 15; 
export const ATTACK_COOLDOWN = 10; 

export const VINE_BASE_SPEED = 1.5;
export const VINE_SPAWN_RATE_INITIAL = 100; 

export const COLORS = {
  player: '#3b82f6', 
  stick: '#854d0e', 
  vine: '#16a34a', 
  vineDark: '#14532d', 
  bossLong: '#064e3b', // Deep Green
  bossA: '#4c1d95', // Deep Purple
  spider: '#7f1d1d', // Red/Dark
  pillar: '#525252', 
  rubble: '#404040',
  text: '#f3f4f6',
};

// Fixed positions for the "Ruins" background
export const PILLARS = [
  { x: CANVAS_WIDTH * 0.3, y: CANVAS_HEIGHT * 0.3, label: 'I' },
  { x: CANVAS_WIDTH * 0.7, y: CANVAS_HEIGHT * 0.3, label: 'II' },
  { x: CANVAS_WIDTH * 0.5, y: CANVAS_HEIGHT * 0.7, label: 'III' },
];

export const BOSS_A_HP = 10;
export const SPIDER_HP = 10;
export const LONG_BOSS_SEGMENTS = 20;
