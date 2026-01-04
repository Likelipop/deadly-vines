import React, { useRef, useEffect, useCallback } from 'react';
import { 
  GameState, 
  Player, 
  Vine, 
  Particle,
  Boss,
  Spider,
  PillarState
} from '../types';
import { 
  COLORS, 
  PILLARS, 
  PLAYER_RADIUS, 
  PLAYER_SPEED,
  INITIAL_WEAPON_LENGTH, 
  VINE_BASE_SPEED, 
  ATTACK_DURATION,
  ATTACK_COOLDOWN,
  BOSS_A_HP,
  SPIDER_HP,
  LONG_BOSS_SEGMENTS
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
  gameState,
  setGameState,
  level,
  setLevel,
  score,
  setScore,
  triggerGameOver
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // --- REFS ---
  const playerRef = useRef<Player>({
    id: 'hero',
    x: 0,
    y: 0,
    radius: PLAYER_RADIUS,
    angle: 0,
    weaponLength: INITIAL_WEAPON_LENGTH,
    weaponLevel: 1,
    isAttacking: false,
    attackCooldown: 0,
    health: 1
  });
  
  const vinesRef = useRef<Vine[]>([]);
  const bossRef = useRef<Boss | null>(null);
  const spidersRef = useRef<Spider[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  
  const frameCountRef = useRef(0);
  const animationFrameId = useRef<number>(0);
  const mousePos = useRef({ x: 0, y: 0 });
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Cinematic State
  const cinematicRef = useRef({
    step: 0, // 0: start, 1: pillar 1 fall, 2: others fall, 3: house collapse, 4: vines, 5: end
    timer: 0,
    shake: 0,
    pillarStates: PILLARS.map(p => ({ ...p, rotation: 0, fallen: false, opacity: 1 })) as PillarState[]
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        if (gameState === GameState.INTRO || gameState === GameState.CINEMATIC) {
          playerRef.current.x = window.innerWidth / 2;
          playerRef.current.y = window.innerHeight / 2;
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Reset Logic
  useEffect(() => {
    if (gameState === GameState.CINEMATIC) {
      // Reset cinematic
      cinematicRef.current = {
        step: 0,
        timer: 0,
        shake: 0,
        pillarStates: PILLARS.map(p => ({ ...p, rotation: 0, fallen: false, opacity: 1 }))
      };
    }
    
    if (gameState === GameState.INTRO || (gameState === GameState.PLAYING && score === 0 && level === 1)) {
      vinesRef.current = [];
      bossRef.current = null;
      spidersRef.current = [];
      particlesRef.current = [];
      playerRef.current.isAttacking = false;
      playerRef.current.attackCooldown = 0;
      playerRef.current.health = 1;
      playerRef.current.weaponLevel = 1;
      if (canvasRef.current) {
        playerRef.current.x = canvasRef.current.width / 2;
        playerRef.current.y = canvasRef.current.height / 2;
      }
    }
  }, [gameState, score, level]);

  const handleInput = useCallback((x: number, y: number) => {
    if (gameState !== GameState.PLAYING) return;
    mousePos.current = { x, y };
    const dx = x - playerRef.current.x;
    const dy = y - playerRef.current.y;
    playerRef.current.angle = Math.atan2(dy, dx);

    if (playerRef.current.attackCooldown <= 0) {
      playerRef.current.isAttacking = true;
      playerRef.current.attackCooldown = ATTACK_DURATION + ATTACK_COOLDOWN;
    }
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - playerRef.current.x;
        const dy = e.clientY - playerRef.current.y;
        playerRef.current.angle = Math.atan2(dy, dx);
    };
    const onMouseDown = (e: MouseEvent) => handleInput(e.clientX, e.clientY);
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleInput(e.touches[0].clientX, e.touches[0].clientY);
    };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('touchstart', onTouchStart);
    };
  }, [handleInput]);

  // --- HELPER FUNCTIONS ---

  const spawnParticles = (x: number, y: number, color: string, count: number = 5) => {
    for (let p = 0; p < count; p++) {
      particlesRef.current.push({
        id: Math.random().toString(),
        x: x,
        y: y,
        radius: Math.random() * 3 + 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 30,
        color: color
      });
    }
  };

  const spawnLongBoss = (width: number, height: number) => {
    const segments = [];
    // Start off screen
    const startX = -100;
    const startY = height / 2;
    
    // Create segments
    for(let i=0; i<LONG_BOSS_SEGMENTS; i++) {
      segments.push({
        x: startX - (i * 20),
        y: startY,
        radius: 15,
        isWeakPoint: i % 4 === 0, // Every 4th segment is a weak point
        destroyed: false
      });
    }

    bossRef.current = {
      id: 'long-boss',
      type: 'LONG_VINE',
      x: startX,
      y: startY,
      radius: 20,
      angle: 0,
      speed: 2,
      health: 5, // 5 weak points need to be hit
      maxHealth: 5,
      segments: segments,
      active: true
    };
  };

  const spawnBossA = (width: number, height: number) => {
     // Spawns from top
     bossRef.current = {
       id: 'boss-a',
       type: 'BOSS_A',
       x: width / 2,
       y: -100,
       radius: 40,
       angle: Math.PI / 2,
       speed: 1.5,
       health: BOSS_A_HP,
       maxHealth: BOSS_A_HP,
       segments: [],
       active: true
     };
  };

  const spawnSpiders = () => {
    PILLARS.forEach((pillar) => {
       spidersRef.current.push({
         id: `spider-${Math.random()}`,
         x: pillar.x,
         y: pillar.y,
         radius: 12,
         speed: 3.5,
         health: SPIDER_HP,
         targetId: 'hero'
       });
    });
  };

  // --- GAME LOOP ---
  useEffect(() => {
    const loop = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // ----------------------
      // CINEMATIC MODE LOGIC
      // ----------------------
      if (gameState === GameState.CINEMATIC) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        const c = cinematicRef.current;
        c.timer++;

        // Sequence Logic
        if (c.step === 0 && c.timer > 60) { c.step = 1; c.timer = 0; } // Start Pillar 1
        if (c.step === 1) {
           c.shake = 2;
           // Rotate Pillar 1 (Index 0)
           c.pillarStates[0].rotation += 0.05;
           if (c.pillarStates[0].rotation > Math.PI / 2.5) {
             c.step = 2; c.timer = 0; c.shake = 5; // Trigger others
           }
        }
        if (c.step === 2) {
           // Rotate others
           c.pillarStates[1].rotation -= 0.05;
           c.pillarStates[2].rotation += 0.05;
           if (c.timer > 100) { c.step = 3; c.timer = 0; }
        }
        if (c.step === 3) {
           c.shake = 10; // Big shake
           c.pillarStates.forEach(p => p.opacity -= 0.01);
           if (c.timer > 120) { c.step = 4; c.timer = 0; }
        }
        if (c.step === 4) {
           // Vines appear animation (simple text or visual)
           c.shake = 0;
           if (c.timer > 100) {
             setGameState(GameState.INTRO);
             return;
           }
        }

        // Draw Cinematic
        ctx.save();
        if (c.shake > 0) {
          ctx.translate((Math.random() - 0.5) * c.shake, (Math.random() - 0.5) * c.shake);
        }

        // Draw Pillars
        c.pillarStates.forEach(p => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = COLORS.pillar;
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillRect(-30, -100, 60, 200); // Taller pillars for intro
          
          // Cracks
          if (c.step >= 1) {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-20, -50);
            ctx.lineTo(20, 0);
            ctx.lineTo(-10, 50);
            ctx.stroke();
          }
          ctx.restore();
        });

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '30px Cinzel';
        ctx.textAlign = 'center';
        if (c.step === 1) ctx.fillText("The First Pillar Cracks...", width/2, height - 100);
        if (c.step === 2) ctx.fillText("The Foundation Fails...", width/2, height - 100);
        if (c.step === 3) ctx.fillText("Darkness Consumes The Ruins...", width/2, height - 100);
        if (c.step === 4) {
          ctx.fillStyle = COLORS.vine;
          ctx.fillText("THEY ARE HERE", width/2, height/2);
        }

        ctx.restore();
        animationFrameId.current = requestAnimationFrame(loop);
        return;
      }

      // ----------------------
      // PLAYING LOGIC
      // ----------------------
      if (gameState !== GameState.PLAYING) return;

      frameCountRef.current++;
      const player = playerRef.current;

      // 1. Movement
      let moveX = 0, moveY = 0;
      if (keysPressed.current['w'] || keysPressed.current['ArrowUp'] || keysPressed.current['W']) moveY -= 1;
      if (keysPressed.current['s'] || keysPressed.current['ArrowDown'] || keysPressed.current['S']) moveY += 1;
      if (keysPressed.current['a'] || keysPressed.current['ArrowLeft'] || keysPressed.current['A']) moveX -= 1;
      if (keysPressed.current['d'] || keysPressed.current['ArrowRight'] || keysPressed.current['D']) moveX += 1;

      if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY);
        moveX = (moveX / len) * PLAYER_SPEED;
        moveY = (moveY / len) * PLAYER_SPEED;
        player.x = Math.max(player.radius, Math.min(width - player.radius, player.x + moveX));
        player.y = Math.max(player.radius, Math.min(height - player.radius, player.y + moveY));
      }

      // 2. Boss Spawning Logic
      if (!bossRef.current) {
        // Boss A Check: Exactly at 21 kills.
        if (score === 21) {
          spawnBossA(width, height);
        } 
        // Long Boss Check: Every 10 kills, but NOT if Boss A is supposed to spawn (20->21).
        // The prompt says "If number of vines destroyed is divisible by 10".
        // Wait, if score is 20, we spawn Long Boss. Killing it makes score 21? Or is boss separate?
        // Let's assume killing boss allows score to progress. 
        else if (score > 0 && score % 10 === 0 && score !== 20) { // Conflict at 20? 
           // Prompt says: "When character hits 21 vines then Boss A".
           // Prompt says: "Divisible by 10 -> Boss".
           // At 20, we spawn Long Boss. Killing it -> Score 21 -> Boss A spawns.
           // So yes, at 20 we spawn Long Boss.
           spawnLongBoss(width, height);
        }
      }

      // 3. Spawn Vines (Only if no boss active)
      if (!bossRef.current && frameCountRef.current % Math.max(20, 100 - (level * 5)) === 0) {
         // Logic for normal vine spawn
         const side = Math.floor(Math.random() * 4);
         let sx = 0, sy = 0;
         if (side === 0) { sx = Math.random() * width; sy = -50; }
         else if (side === 1) { sx = width + 50; sy = Math.random() * height; }
         else if (side === 2) { sx = Math.random() * width; sy = height + 50; }
         else { sx = -50; sy = Math.random() * height; }

         vinesRef.current.push({
           id: Math.random().toString(),
           x: sx,
           y: sy,
           radius: 15,
           speed: VINE_BASE_SPEED + (level * 0.2),
           angle: 0,
           active: true,
           wiggleOffset: Math.random() * 100,
           color: Math.random() > 0.9 ? COLORS.vineDark : COLORS.vine
         });
      }

      // Attack Cooldown
      if (player.attackCooldown > 0) player.attackCooldown--;
      if (player.attackCooldown < ATTACK_COOLDOWN) player.isAttacking = false;

      // --- COLLISIONS & UPDATES ---

      const checkHit = (tx: number, ty: number, tr: number) => {
         if (!player.isAttacking) return false;
         
         // Check Front Swing
         const dist = Math.hypot(tx - player.x, ty - player.y);
         if (dist <= player.weaponLength + tr && dist > player.radius) {
            const angleToTarget = Math.atan2(ty - player.y, tx - player.x);
            let angleDiff = angleToTarget - player.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            if (Math.abs(angleDiff) < 1.0) return true;
         }

         // Check Back Swing (If Double Staff)
         if (player.weaponLevel === 2) {
            // Angle is player.angle + PI
            const backAngle = player.angle + Math.PI;
            const angleToTarget = Math.atan2(ty - player.y, tx - player.x);
            let angleDiff = angleToTarget - backAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            if (Math.abs(angleDiff) < 1.0 && dist <= player.weaponLength + tr) return true;
         }
         return false;
      };

      // BOSS LOGIC
      if (bossRef.current) {
        const boss = bossRef.current;

        if (boss.type === 'LONG_VINE') {
          // Move leader segment towards player
          const dx = player.x - boss.x;
          const dy = player.y - boss.y;
          boss.angle = Math.atan2(dy, dx);
          boss.x += Math.cos(boss.angle) * boss.speed;
          boss.y += Math.sin(boss.angle) * boss.speed;

          // Drag segments
          let prevX = boss.x;
          let prevY = boss.y;
          
          boss.segments.forEach((seg, idx) => {
             const dist = Math.hypot(prevX - seg.x, prevY - seg.y);
             const angle = Math.atan2(prevY - seg.y, prevX - seg.x);
             const spacing = 15;
             
             seg.x = prevX - Math.cos(angle) * spacing;
             seg.y = prevY - Math.sin(angle) * spacing;
             
             prevX = seg.x;
             prevY = seg.y;

             // Collision Player
             if (Math.hypot(player.x - seg.x, player.y - seg.y) < player.radius + seg.radius) {
               triggerGameOver();
               return;
             }

             // Collision Attack
             if (!seg.destroyed && seg.isWeakPoint && checkHit(seg.x, seg.y, seg.radius)) {
                seg.destroyed = true;
                boss.health--;
                spawnParticles(seg.x, seg.y, COLORS.bossLong, 10);
                
                if (boss.health <= 0) {
                   // Boss Dead
                   bossRef.current = null;
                   player.weaponLevel = 2; // Upgrade Weapon
                   spawnParticles(boss.x, boss.y, '#FFD700', 30); // Gold particles
                   setScore(s => s + 1); // Allow progress
                }
             }
          });
          // Head Collision
          if (Math.hypot(player.x - boss.x, player.y - boss.y) < player.radius + boss.radius) {
             triggerGameOver();
             return;
          }
        } 
        else if (boss.type === 'BOSS_A') {
           // Boss A Logic
           // Move towards player slowly
           const dx = player.x - boss.x;
           const dy = player.y - boss.y;
           boss.angle = Math.atan2(dy, dx);
           boss.x += Math.cos(boss.angle) * boss.speed;
           boss.y += Math.sin(boss.angle) * boss.speed;

           // Define Head and Tail positions based on angle
           const length = 80;
           const hx = boss.x + Math.cos(boss.angle) * (length/2);
           const hy = boss.y + Math.sin(boss.angle) * (length/2);
           const tx = boss.x - Math.cos(boss.angle) * (length/2);
           const ty = boss.y - Math.sin(boss.angle) * (length/2);

           boss.headPosition = {x: hx, y: hy};
           boss.tailPosition = {x: tx, y: ty};

           // Collision Player
           if (Math.hypot(player.x - boss.x, player.y - boss.y) < player.radius + length/2) {
              triggerGameOver();
              return;
           }

           // Attack Hit Checks
           if (checkHit(hx, hy, 25)) {
              // Hit Head -> Trap -> Spawn Spiders
              // Only spawn if cooldown allows or just once? Prompt says "if hit on head... spiders jump out".
              // Let's just spawn spiders every time head is hit (punishment).
              spawnSpiders();
              spawnParticles(hx, hy, COLORS.spider, 5);
              // Knockback boss slightly
              boss.x -= Math.cos(boss.angle) * 20;
              boss.y -= Math.sin(boss.angle) * 20;
           }

           if (checkHit(tx, ty, 25)) {
              // Hit Tail -> Damage
              boss.health--;
              spawnParticles(tx, ty, COLORS.bossA, 8);
               // Knockback boss slightly
              boss.x -= Math.cos(boss.angle) * 10;
              boss.y -= Math.sin(boss.angle) * 10;
              
              if (boss.health <= 0) {
                 bossRef.current = null;
                 spawnParticles(boss.x, boss.y, '#FFD700', 50);
                 setScore(s => s + 5); // Bonus points
              }
           }
        }
      }

      // Spiders Logic
      for (let i = spidersRef.current.length - 1; i >= 0; i--) {
        const spider = spidersRef.current[i];
        const dx = player.x - spider.x;
        const dy = player.y - spider.y;
        const angle = Math.atan2(dy, dx);
        
        spider.x += Math.cos(angle) * spider.speed;
        spider.y += Math.sin(angle) * spider.speed;

        if (Math.hypot(dx, dy) < player.radius + spider.radius) {
           triggerGameOver();
           return;
        }

        if (checkHit(spider.x, spider.y, spider.radius)) {
           spider.health -= 5; // Takes 2 hits (10HP)
           spawnParticles(spider.x, spider.y, COLORS.spider, 3);
           // Knockback
           spider.x -= Math.cos(angle) * 20;
           spider.y -= Math.sin(angle) * 20;

           if (spider.health <= 0) {
             spidersRef.current.splice(i, 1);
             spawnParticles(spider.x, spider.y, COLORS.rubble, 5);
           }
        }
      }

      // Normal Vines Logic
      for (let i = vinesRef.current.length - 1; i >= 0; i--) {
        const vine = vinesRef.current[i];
        const dx = player.x - vine.x;
        const dy = player.y - vine.y;
        vine.angle = Math.atan2(dy, dx);
        vine.x += Math.cos(vine.angle) * vine.speed;
        vine.y += Math.sin(vine.angle) * vine.speed;

        if (Math.hypot(dx, dy) < player.radius + vine.radius) {
          triggerGameOver();
          return;
        }

        if (checkHit(vine.x, vine.y, vine.radius)) {
           spawnParticles(vine.x, vine.y, COLORS.vine, 5);
           vinesRef.current.splice(i, 1);
           const newScore = score + 1;
           setScore(newScore);
           if (newScore % 10 === 0) setLevel(l => l + 1);
        }
      }

      // Particles Logic
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particlesRef.current.splice(i, 1);
      }

      // --- DRAWING ---
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);

      // Background
      ctx.save();
      ctx.fillStyle = COLORS.rubble;
      PILLARS.forEach((pillar) => {
        ctx.beginPath();
        ctx.rect(pillar.x - 30, pillar.y - 30, 60, 60);
        ctx.fill();
        ctx.font = '20px Cinzel';
        ctx.fillStyle = '#737373';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pillar.label, pillar.x, pillar.y);
      });
      ctx.restore();

      // Particles
      particlesRef.current.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Spiders
      spidersRef.current.forEach(spider => {
         ctx.beginPath();
         ctx.arc(spider.x, spider.y, spider.radius, 0, Math.PI * 2);
         ctx.fillStyle = COLORS.spider;
         ctx.fill();
         // Legs
         for(let k=0; k<8; k++) {
           const legAngle = k * (Math.PI/4);
           ctx.beginPath();
           ctx.moveTo(spider.x, spider.y);
           ctx.lineTo(spider.x + Math.cos(legAngle)*20, spider.y + Math.sin(legAngle)*20);
           ctx.strokeStyle = COLORS.spider;
           ctx.lineWidth = 2;
           ctx.stroke();
         }
      });

      // Boss
      if (bossRef.current) {
         const boss = bossRef.current;
         if (boss.type === 'LONG_VINE') {
            boss.segments.forEach(seg => {
               if(seg.destroyed) return;
               ctx.beginPath();
               ctx.arc(seg.x, seg.y, seg.radius, 0, Math.PI*2);
               ctx.fillStyle = seg.isWeakPoint ? '#ef4444' : COLORS.bossLong;
               ctx.fill();
            });
            // Head
            ctx.beginPath();
            ctx.arc(boss.x, boss.y, boss.radius + 5, 0, Math.PI*2);
            ctx.fillStyle = COLORS.bossLong;
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(boss.x-5, boss.y-5, 5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(boss.x+5, boss.y-5, 5, 0, Math.PI*2); ctx.fill();
         } else if (boss.type === 'BOSS_A') {
             ctx.save();
             ctx.translate(boss.x, boss.y);
             ctx.rotate(boss.angle);
             
             // Body
             ctx.fillStyle = COLORS.bossA;
             ctx.fillRect(-40, -20, 80, 40);
             
             // Head (Front)
             ctx.fillStyle = '#ef4444'; // Red for Trap
             ctx.beginPath(); ctx.arc(40, 0, 25, 0, Math.PI*2); ctx.fill();
             
             // Tail (Back)
             ctx.fillStyle = '#22c55e'; // Green for Weakness
             ctx.beginPath(); ctx.arc(-40, 0, 25, 0, Math.PI*2); ctx.fill();
             
             ctx.restore();
         }
      }

      // Vines
      vinesRef.current.forEach(vine => {
        ctx.save();
        ctx.translate(vine.x, vine.y);
        ctx.rotate(vine.angle);
        ctx.beginPath();
        ctx.arc(0, 0, vine.radius, 0, Math.PI * 2);
        ctx.fillStyle = vine.color;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const wiggle = Math.sin((frameCountRef.current + vine.wiggleOffset) * 0.2) * 10;
        ctx.quadraticCurveTo(-20, wiggle, -40, 0);
        ctx.strokeStyle = vine.color;
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(5, -5, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, 5, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // Player
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);

      // WEAPON
      const drawStick = (rotation: number) => {
         ctx.save();
         ctx.rotate(rotation);
         ctx.beginPath();
         ctx.moveTo(0, 0);
         ctx.lineTo(player.weaponLength, 0);
         ctx.strokeStyle = COLORS.stick;
         ctx.lineWidth = 8;
         ctx.lineCap = 'round';
         ctx.stroke();
         ctx.restore();
      };

      if (player.isAttacking) {
        const progress = 1 - (player.attackCooldown - ATTACK_COOLDOWN) / ATTACK_DURATION;
        const swipeArc = Math.PI / 1.5;
        const currentSwipe = -swipeArc/2 + (swipeArc * progress); 
        
        ctx.save();
        ctx.rotate(currentSwipe);
        drawStick(0);
        if (player.weaponLevel === 2) drawStick(Math.PI); // Double staff
        ctx.restore();

        // Swipe Trails
        ctx.beginPath();
        ctx.arc(0, 0, player.weaponLength, currentSwipe - 0.2, currentSwipe + 0.2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 20;
        ctx.stroke();

        if (player.weaponLevel === 2) {
           ctx.beginPath();
           ctx.arc(0, 0, player.weaponLength, currentSwipe + Math.PI - 0.2, currentSwipe + Math.PI + 0.2);
           ctx.stroke();
        }

      } else {
        // Idle
        drawStick(Math.PI/4);
        if (player.weaponLevel === 2) drawStick(Math.PI/4 + Math.PI);
      }

      // Hero Body
      ctx.beginPath();
      ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.player;
      ctx.fill();
      ctx.restore();

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [gameState, level, score, setLevel, setScore, triggerGameOver]);

  return <canvas ref={canvasRef} className="block cursor-crosshair" />;
};