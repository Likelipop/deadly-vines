import React, { useRef, useEffect, useCallback } from 'react';
import { 
  GameState, Player, Vine, Particle, Boss, Spider, 
  PillarState, Item, BossSegment 
} from '../types';
import { 
  COLORS, PILLARS, PLAYER_RADIUS, PLAYER_SPEED, PLAYER_MAX_HEALTH,
  INITIAL_WEAPON_LENGTH, VINE_BASE_SPEED, ATTACK_DURATION, ATTACK_COOLDOWN,
  BOSS_A_HP, SNAIL_HP, SPIDER_HP, LONG_BOSS_SEGMENTS,
  TELEPORT_COOLDOWN, LASER_COOLDOWN, LASER_DURATION, ITEM_SPAWN_RATE
} from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  level: number;
  setLevel: React.Dispatch<React.SetStateAction<number>>;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  triggerGameOver: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState, setGameState, level, setLevel, score, setScore, triggerGameOver
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<Player>({
    id: 'hero', x: 0, y: 0, radius: PLAYER_RADIUS, angle: 0,
    weaponLength: INITIAL_WEAPON_LENGTH, baseWeaponLength: INITIAL_WEAPON_LENGTH,
    weaponLevel: 1, isAttacking: false, attackCooldown: 0,
    health: PLAYER_MAX_HEALTH, maxHealth: PLAYER_MAX_HEALTH,
    teleportCooldown: 0, isTeleporting: false, laserCooldown: 0, isFiringLaser: false,
    longStickTimer: 0
  });
  
  const vinesRef = useRef<Vine[]>([]);
  const bossesRef = useRef<Boss[]>([]);
  const spidersRef = useRef<Spider[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const itemsRef = useRef<Item[]>([]);
  
  const frameCountRef = useRef(0);
  const animationFrameId = useRef<number>(0);
  const mousePos = useRef({ x: 0, y: 0 });
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const cinematicRef = useRef({
    step: 0, timer: 0, shake: 0,
    pillarStates: PILLARS.map(p => ({ ...p, width: 40, height: 120, rotation: 0, fallen: false, opacity: 1 })) as PillarState[]
  });

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { 
      keysPressed.current[e.key.toLowerCase()] = true;
      if (gameState === GameState.PLAYING) {
        if (e.key.toLowerCase() === 'q' && playerRef.current.teleportCooldown <= 0) {
          if (playerRef.current.isTeleporting) {
            playerRef.current.x = mousePos.current.x;
            playerRef.current.y = mousePos.current.y;
            playerRef.current.isTeleporting = false;
            playerRef.current.teleportCooldown = TELEPORT_COOLDOWN;
            spawnParticles(playerRef.current.x, playerRef.current.y, COLORS.laser, 10);
          } else {
            playerRef.current.isTeleporting = true;
          }
        }
        if (e.key.toLowerCase() === 'e' && playerRef.current.laserCooldown <= 0) fireLaser();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keysPressed.current[e.key.toLowerCase()] = false;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [gameState]);

  const spawnParticles = (x: number, y: number, color: string, count: number = 5) => {
    for (let p = 0; p < count; p++) {
      particlesRef.current.push({
        id: Math.random().toString(), x, y, radius: Math.random() * 3 + 2,
        vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 30, color
      });
    }
  };

  const spawnSpiders = () => {
    PILLARS.forEach(p => {
      spidersRef.current.push({
        id: Math.random().toString(), x: p.x, y: p.y,
        radius: 12, health: SPIDER_HP, speed: 3
      });
    });
  };

  const fireLaser = () => {
    const p = playerRef.current;
    p.isFiringLaser = true;
    p.laserCooldown = LASER_COOLDOWN;
    const beamAngle = p.angle;
    const beamLength = 1500;

    const checkHit = (cx: number, cy: number, r: number) => {
      const dx = cx - p.x;
      const dy = cy - p.y;
      const dist = Math.hypot(dx, dy);
      const angleTo = Math.atan2(dy, dx);
      let diff = angleTo - beamAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      return dist < beamLength && Math.abs(diff) < 0.1;
    };

    vinesRef.current.forEach(v => {
      if (checkHit(v.x, v.y, v.radius)) {
        v.health -= 10;
        spawnParticles(v.x, v.y, COLORS.laser, 3);
      }
    });

    bossesRef.current.forEach(b => {
      b.segments.forEach(seg => {
        if (checkHit(seg.x, seg.y, seg.radius)) {
          if (b.type === 'BOSS_A' && seg.type === 'TAIL') {
            b.health -= 2;
            spawnParticles(seg.x, seg.y, COLORS.laser, 5);
          } else if (b.type === 'SNAIL') {
            b.health -= 1;
            spawnParticles(seg.x, seg.y, COLORS.laser, 2);
          } else if (b.type === 'LONG_VINE' && seg.type === 'WEAK') {
            seg.destroyed = true;
            b.health--;
          }
        }
      });
    });
  };

  const spawnBossA = (w: number, h: number) => {
    const segments: BossSegment[] = [
      { x: 0, y: 0, radius: 40, type: 'HEAD', destroyed: false },
      { x: 0, y: 0, radius: 30, type: 'BODY', destroyed: false },
      { x: 0, y: 0, radius: 25, type: 'TAIL', destroyed: false },
    ];
    bossesRef.current.push({
      id: 'boss_a', type: 'BOSS_A', x: w / 2, y: -100, radius: 45,
      health: BOSS_A_HP, maxHealth: BOSS_A_HP, segments, angle: Math.PI / 2, speed: 2
    });
  };

  const spawnSnail = (w: number, h: number) => {
    bossesRef.current.push({
      id: 'snail', type: 'SNAIL', x: -100, y: h * 0.7, radius: 60,
      health: SNAIL_HP, maxHealth: SNAIL_HP, segments: [], angle: 0, speed: 0.5
    });
  };

  const loop = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { width, height } = canvas;

    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#292524';
    ctx.fillRect(0, height * 0.4, width, height * 0.6);

    if (gameState === GameState.PLAYING) {
      frameCountRef.current++;
      const p = playerRef.current;

      // Powerup: Gậy dài
      if (frameCountRef.current % 1200 === 0) {
        p.longStickTimer = 180; // 3 giây
      }
      if (p.longStickTimer > 0) {
        p.longStickTimer--;
        p.weaponLength = p.baseWeaponLength * 3;
      } else {
        p.weaponLength = p.baseWeaponLength;
      }

      // Input
      let mx = 0, my = 0;
      if (keysPressed.current['w']) my -= 1;
      if (keysPressed.current['s']) my += 1;
      if (keysPressed.current['a']) mx -= 1;
      if (keysPressed.current['d']) mx += 1;
      if ((mx !== 0 || my !== 0) && !p.isTeleporting) {
        const mag = Math.hypot(mx, my);
        p.x = Math.max(p.radius, Math.min(width - p.radius, p.x + (mx / mag) * PLAYER_SPEED));
        p.y = Math.max(height * 0.4, Math.min(height - p.radius, p.y + (my / mag) * PLAYER_SPEED));
      }

      const dx = mousePos.current.x - p.x;
      const dy = mousePos.current.y - p.y;
      p.angle = Math.atan2(dy, dx);

      if (p.attackCooldown > 0) p.attackCooldown--;
      if (p.attackCooldown < ATTACK_COOLDOWN) p.isAttacking = false;
      if (p.laserCooldown > 0) p.laserCooldown--;
      if (p.laserCooldown < LASER_COOLDOWN - LASER_DURATION) p.isFiringLaser = false;

      // Spawning
      const vineHP = Math.floor(score / 20) + 1;
      if (frameCountRef.current % 60 === 0) {
        const side = Math.floor(Math.random() * 4);
        let vx = 0, vy = 0;
        if (side === 0) { vx = Math.random() * width; vy = -30; }
        else if (side === 1) { vx = width + 30; vy = Math.random() * height; }
        else if (side === 2) { vx = Math.random() * width; vy = height + 30; }
        else { vx = -30; vy = Math.random() * height; }
        
        vinesRef.current.push({
          id: Math.random().toString(), x: vx, y: vy, radius: 15,
          health: vineHP, maxHealth: vineHP, speed: VINE_BASE_SPEED + (Math.random() > 0.8 ? 2 : 0),
          angle: 0, active: true, wiggleOffset: Math.random() * 100, color: COLORS.vine
        });
      }

      if (score > 0 && score % 40 === 0 && !bossesRef.current.some(b => b.type === 'BOSS_A')) spawnBossA(width, height);
      if (score > 0 && score % 70 === 0 && !bossesRef.current.some(b => b.type === 'SNAIL')) spawnSnail(width, height);

      // Updates
      vinesRef.current = vinesRef.current.filter(v => {
        const vdx = p.x - v.x, vdy = p.y - v.y;
        v.angle = Math.atan2(vdy, vdx);
        v.x += Math.cos(v.angle) * v.speed;
        v.y += Math.sin(v.angle) * v.speed;

        if (Math.hypot(vdx, vdy) < p.radius + v.radius) {
          p.health--;
          spawnParticles(p.x, p.y, 'red', 10);
          return false;
        }

        if (p.isAttacking) {
          const dist = Math.hypot(vdx, vdy);
          if (dist < p.weaponLength + v.radius) {
            const angleTo = Math.atan2(v.y - p.y, v.x - p.x);
            let diff = angleTo - p.angle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            if (Math.abs(diff) < 0.8) {
              v.health--;
              spawnParticles(v.x, v.y, v.color, 3);
              if (v.health <= 0) { setScore(s => s + 1); return false; }
            }
          }
        }
        return v.health > 0;
      });

      bossesRef.current = bossesRef.current.filter(b => {
        if (b.type === 'BOSS_A') {
          const bdx = p.x - b.x, bdy = p.y - b.y;
          b.angle = Math.atan2(bdy, bdx);
          b.x += Math.cos(b.angle) * b.speed;
          b.y += Math.sin(b.angle) * b.speed;

          // Cập nhật vị trí các đoạn
          b.segments[0].x = b.x; b.segments[0].y = b.y; // Head
          b.segments[1].x = b.x - Math.cos(b.angle) * 40; b.segments[1].y = b.y - Math.sin(b.angle) * 40; // Body
          b.segments[2].x = b.x - Math.cos(b.angle) * 80; b.segments[2].y = b.y - Math.sin(b.angle) * 80; // Tail

          if (p.isAttacking) {
            b.segments.forEach(seg => {
              const dist = Math.hypot(seg.x - p.x, seg.y - p.y);
              if (dist < p.weaponLength + seg.radius) {
                if (seg.type === 'HEAD') spawnSpiders();
                if (seg.type === 'TAIL') {
                   b.health -= 0.1; // Sát thương gậy thấp hơn tia laser
                   spawnParticles(seg.x, seg.y, COLORS.bossA, 2);
                }
              }
            });
          }
        } else if (b.type === 'SNAIL') {
          b.x += b.speed;
          if (Math.hypot(p.x - b.x, p.y - b.y) < p.radius + b.radius) triggerGameOver();
          if (p.isAttacking && Math.hypot(p.x - b.x, p.y - b.y) < p.weaponLength + b.radius) {
            b.health -= 0.1;
            spawnParticles(b.x, b.y, COLORS.snail, 1);
          }
        }
        return b.health > 0;
      });

      spidersRef.current = spidersRef.current.filter(s => {
        const sdx = p.x - s.x, sdy = p.y - s.y;
        const angle = Math.atan2(sdy, sdx);
        s.x += Math.cos(angle) * s.speed;
        s.y += Math.sin(angle) * s.speed;
        if (Math.hypot(sdx, sdy) < p.radius + s.radius) { p.health--; return false; }
        if (p.isAttacking && Math.hypot(sdx, sdy) < p.weaponLength + s.radius) {
          s.health--;
          if (s.health <= 0) return false;
        }
        return true;
      });

      if (p.health <= 0) triggerGameOver();

      // Draw
      vinesRef.current.forEach(v => {
        ctx.fillStyle = v.color;
        ctx.beginPath(); ctx.arc(v.x, v.y, v.radius, 0, Math.PI * 2); ctx.fill();
        // HP bar
        ctx.fillStyle = 'red'; ctx.fillRect(v.x - 10, v.y - 25, 20 * (v.health / v.maxHealth), 3);
      });

      bossesRef.current.forEach(b => {
        if (b.type === 'BOSS_A') {
          b.segments.forEach(seg => {
            ctx.fillStyle = seg.type === 'TAIL' ? '#a855f7' : COLORS.bossA;
            ctx.beginPath(); ctx.arc(seg.x, seg.y, seg.radius, 0, Math.PI * 2); ctx.fill();
          });
        } else if (b.type === 'SNAIL') {
          ctx.fillStyle = COLORS.snail;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(b.x + 40, b.y, 20, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = 'red'; ctx.fillRect(b.x - 40, b.y - b.radius - 20, 80 * (b.health / b.maxHealth), 5);
      });

      spidersRef.current.forEach(s => {
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
        for(let i=0; i<8; i++) {
          ctx.beginPath(); ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + Math.cos(i * Math.PI/4) * 20, s.y + Math.sin(i * Math.PI/4) * 20); ctx.stroke();
        }
      });

      // Player
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      if (p.isFiringLaser) {
        ctx.strokeStyle = COLORS.laser; ctx.lineWidth = 20; ctx.shadowBlur = 15; ctx.shadowColor = COLORS.laser;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1500, 0); ctx.stroke();
      }
      ctx.strokeStyle = p.longStickTimer > 0 ? '#fbbf24' : COLORS.stick; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(p.weaponLength, 0); ctx.stroke();
      ctx.fillStyle = COLORS.player; ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    animationFrameId.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [gameState, score]);

  const onMouseDown = () => {
    if (playerRef.current.attackCooldown <= 0) {
      playerRef.current.isAttacking = true;
      playerRef.current.attackCooldown = ATTACK_DURATION + ATTACK_COOLDOWN;
    }
  };

  return <canvas 
    ref={canvasRef} 
    onMouseDown={onMouseDown}
    onMouseMove={(e) => mousePos.current = { x: e.clientX, y: e.clientY }}
    className="block cursor-crosshair" 
  />;
};