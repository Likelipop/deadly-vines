export const CANVAS_WIDTH = window.innerWidth;
export const CANVAS_HEIGHT = window.innerHeight;

export const PLAYER_RADIUS = 20;
export const PLAYER_SPEED = 5; 
export const PLAYER_MAX_HEALTH = 3;

export const INITIAL_WEAPON_LENGTH = 120;
export const ATTACK_DURATION = 15; 
export const ATTACK_COOLDOWN = 10; 

export const TELEPORT_COOLDOWN = 600;
export const LASER_COOLDOWN = 300;
export const LASER_DURATION = 15; 

export const VINE_BASE_SPEED = 1.5;
export const ITEM_SPAWN_RATE = 1020; 

export const COLORS = {
  player: '#3b82f6', 
  stick: '#854d0e', 
  vine: '#16a34a', 
  vineDark: '#14532d', 
  bossLong: '#064e3b', 
  bossA: '#4c1d95', 
  snail: '#a16207',
  spider: '#ef4444', 
  pillar: '#78716c',
  house: '#57534e',
  roof: '#7f1d1d',
  forest: '#052e16',
  itemHealth: '#ef4444',
  laser: '#38bdf8',
};

const centerX = CANVAS_WIDTH / 2;
const groundY = CANVAS_HEIGHT * 0.4;

export const PILLARS = [
  { x: centerX - 150, y: groundY, label: 'I' },
  { x: centerX, y: groundY, label: 'II' },
  { x: centerX + 150, y: groundY, label: 'III' },
];

export const BOSS_A_HP = 10;
export const SNAIL_HP = 50;
export const SPIDER_HP = 10;
export const LONG_BOSS_SEGMENTS = 20;
