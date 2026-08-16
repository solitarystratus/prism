(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });

  const ui = {
    menu: document.getElementById('menu'),
    pause: document.getElementById('pauseOverlay'),
    level: document.getElementById('levelOverlay'),
    finish: document.getElementById('finishOverlay'),
    hud: document.getElementById('hud'),
    boost: document.getElementById('boostMeter'),
    boostFill: document.getElementById('boostFill'),
    touch: document.getElementById('touchControls'),
    toast: document.getElementById('toast'),
    levelText: document.getElementById('levelText'),
    prismText: document.getElementById('prismText'),
    prismGoal: document.getElementById('prismGoal'),
    muteBtn: document.getElementById('muteBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    continueBtn: document.getElementById('continueBtn'),
    levelEyebrow: document.getElementById('levelEyebrow'),
    levelTitle: document.getElementById('levelTitle'),
    rewardPrism: document.getElementById('rewardPrism'),
    rewardTime: document.getElementById('rewardTime'),
    rewardName: document.getElementById('rewardName'),
    nextBtn: document.getElementById('nextBtn'),
    finalScore: document.getElementById('finalScore')
  };

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const smoothstep = t => t * t * (3 - 2 * t);

  let DPR = 1;
  let W = 0, H = 0;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const saveKey = 'prismfall-save-v1';
  let save = { unlocked: 1, totalPrism: 0, best: {}, reward: 'silver' };
  try {
    const stored = JSON.parse(localStorage.getItem(saveKey) || 'null');
    if (stored && typeof stored === 'object') save = { ...save, ...stored };
  } catch (_) {}
  const persist = () => {
    try { localStorage.setItem(saveKey, JSON.stringify(save)); } catch (_) {}
  };

  const state = {
    scene: 'menu',
    levelIndex: 0,
    levelTime: 0,
    totalTime: 0,
    prism: 0,
    paused: false,
    muted: false,
    screenShake: 0,
    flash: 0,
    cameraX: 0,
    cameraY: 0,
    targetCameraX: 0,
    targetCameraY: 0,
    pointerX: W / 2,
    pointerY: H / 2,
    rainIntensity: .85,
    weatherHue: 210,
    firstInput: false,
    lastTs: performance.now()
  };

  class AudioEngine {
    constructor() { this.ctx = null; this.master = null; }
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = .11;
      this.master.connect(this.ctx.destination);
    }
    tone(freq = 440, dur = .12, type = 'sine', vol = .35, bend = 0) {
      if (state.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (bend) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + bend), t + dur);
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + .01);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + .02);
    }
    collect(n = 0) { this.tone(560 + n * 45, .16, 'triangle', .5, 180); }
    jump() { this.tone(220, .13, 'sine', .35, 100); }
    burst() { this.tone(160, .28, 'sawtooth', .22, 900); }
    land() { this.tone(95, .07, 'sine', .18, -25); }
    hurt() { this.tone(120, .25, 'square', .15, -70); }
    complete() { [0, 4, 7, 12].forEach((s, i) => setTimeout(() => this.tone(330 * Math.pow(2, s/12), .34, 'triangle', .28, 40), i * 95)); }
  }
  const audio = new AudioEngine();

  const keys = new Set();
  const pressed = new Set();
  window.addEventListener('keydown', e => {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) e.preventDefault();
    if (!keys.has(e.code)) pressed.add(e.code);
    keys.add(e.code);
    state.firstInput = true;
    audio.init();
    if (e.code === 'Escape' && state.scene === 'playing') togglePause();
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('pointermove', e => { state.pointerX = e.clientX; state.pointerY = e.clientY; }, { passive: true });

  const touch = { left:false, right:false, jump:false, burst:false };
  document.querySelectorAll('[data-touch]').forEach(btn => {
    const k = btn.dataset.touch;
    const on = e => { e.preventDefault(); touch[k] = true; pressed.add(`Touch${k}`); btn.classList.add('active'); state.firstInput = true; audio.init(); };
    const off = e => { e.preventDefault(); touch[k] = false; btn.classList.remove('active'); };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointercancel', off);
    btn.addEventListener('pointerleave', off);
  });

  function inputDown(name) {
    if (name === 'left') return keys.has('ArrowLeft') || keys.has('KeyA') || touch.left;
    if (name === 'right') return keys.has('ArrowRight') || keys.has('KeyD') || touch.right;
    if (name === 'jump') return keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW') || touch.jump;
    if (name === 'burst') return keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyX') || touch.burst;
    return false;
  }
  function inputPressed(name) {
    if (name === 'jump') return pressed.has('Space') || pressed.has('ArrowUp') || pressed.has('KeyW') || pressed.has('Touchjump');
    if (name === 'burst') return pressed.has('ShiftLeft') || pressed.has('ShiftRight') || pressed.has('KeyX') || pressed.has('Touchburst');
    return false;
  }

  const LEVELS = [
    {
      name: 'Silver Drizzle', hue: 210, goal: 8, reward: 'Mist Trail', width: 3300, start: [180, 420], portal: [3100, 250],
      platforms: [
        [60,520,500,44,'cloud'], [560,487,90,28,'cloud'], [650,455,320,42,'cloud'], [970,500,110,28,'cloud'],
        [1080,545,350,44,'cloud'], [1430,482,70,28,'cloud'], [1500,420,300,42,'spring'], [1800,470,100,28,'cloud'],
        [1900,520,360,44,'cloud'], [2260,455,120,28,'cloud'], [2380,390,300,42,'spring'], [2680,445,100,28,'cloud'], [2780,500,430,44,'cloud']
      ],
      prisms: [[420,425],[760,370],[1160,455],[1370,455],[1590,325],[2020,430],[2500,300],[2920,410]],
      storms: [[990,390,90],[1800,330,95],[2300,530,80]],
      currents: [[1210,200,200,330,220],[2490,130,180,340,300]]
    },
    {
      name: 'Thunder Garden', hue: 246, goal: 10, reward: 'Cyan Aura', width: 4200, start: [160, 390], portal: [3950, 220],
      platforms: [
        [40,510,420,44,'cloud'], [460,465,100,28,'cloud'], [560,420,260,42,'spring'], [820,475,120,28,'cloud'],
        [940,530,260,44,'cloud'], [1200,455,100,28,'cloud'], [1300,380,250,42,'cloud'], [1550,450,100,28,'cloud'],
        [1650,520,300,44,'spring'], [1950,455,110,28,'cloud'], [2060,390,260,42,'cloud'], [2320,472,110,28,'cloud'],
        [2430,555,290,44,'cloud'], [2720,472,110,28,'cloud'], [2830,390,260,42,'spring'], [3090,455,110,28,'cloud'],
        [3200,520,300,44,'cloud'], [3500,440,90,28,'cloud'], [3590,360,460,44,'cloud']
      ],
      prisms: [[340,425],[650,325],[1030,440],[1390,295],[1760,420],[2170,300],[2550,465],[2920,295],[3310,430],[3790,270]],
      storms: [[820,250,105],[1210,570,90],[2000,260,105],[2730,300,90],[3450,440,110]],
      currents: [[1040,150,170,350,-240],[2250,130,200,390,280],[3300,120,170,380,-250]]
    },
    {
      name: 'Prismatic Tempest', hue: 198, goal: 12, reward: 'Aurora Crown', width: 5200, start: [150, 420], portal: [4940, 180],
      platforms: [
        [20,520,420,44,'cloud'], [440,485,120,28,'cloud'], [560,450,250,40,'spring'], [810,400,120,28,'cloud'],
        [930,350,230,40,'cloud'], [1160,435,110,28,'cloud'], [1270,520,250,42,'spring'], [1520,460,130,28,'cloud'],
        [1650,400,260,40,'cloud'], [1910,480,130,28,'cloud'], [2040,560,250,42,'cloud'], [2290,480,130,28,'cloud'],
        [2420,400,240,40,'spring'], [2660,342,130,28,'cloud'], [2790,285,220,40,'cloud'], [3010,382,140,28,'cloud'],
        [3150,480,260,42,'cloud'], [3410,410,110,28,'cloud'], [3520,340,240,40,'spring'], [3760,435,130,28,'cloud'],
        [3890,530,260,42,'cloud'], [4150,445,110,28,'cloud'], [4260,360,250,40,'spring'], [4510,420,150,28,'cloud'], [4660,480,430,44,'cloud']
      ],
      prisms: [[340,430],[640,360],[1010,260],[1370,430],[1760,310],[2160,470],[2510,300],[2870,195],[3260,390],[3600,250],[4020,440],[4770,390]],
      storms: [[820,550,95],[1200,240,100],[1570,520,90],[2300,260,110],[3040,410,100],[3470,570,100],[4180,260,105],[4580,530,95]],
      currents: [[1050,100,180,400,280],[1840,100,200,430,-320],[2850,80,190,390,330],[3910,80,180,420,-310],[4570,90,160,350,260]]
    }
  ];

  let level = null;
  let player = null;
  let particles = [];
  let rain = [];
  let cloudsBg = [];
  let rings = [];
  let stars = [];

  function makeAmbient() {
    rain = Array.from({ length: Math.min(260, Math.floor(W * H / 3800)) }, () => ({ x:rand(0,W), y:rand(0,H), z:rand(.3,1), len:rand(8,28), speed:rand(440,980) }));
    cloudsBg = Array.from({ length: 16 }, () => ({ x:rand(-100,W+100), y:rand(40,H*.72), s:rand(.45,1.7), a:rand(.035,.12), drift:rand(4,16), layer:rand(.1,.7) }));
    stars = Array.from({ length: 55 }, () => ({ x:Math.random(), y:Math.random()*.62, a:rand(.08,.5), s:rand(.4,1.4) }));
  }
  makeAmbient();
  window.addEventListener('resize', makeAmbient);

  function buildLevel(index) {
    const spec = LEVELS[index];
    level = {
      ...spec,
      platforms: spec.platforms.map(p => ({ x:p[0], y:p[1], w:p[2], h:p[3], type:p[4], pulse:Math.random()*TAU })),
      prisms: spec.prisms.map((p,i) => ({ x:p[0], y:p[1], r:13, got:false, phase:i*.8 })),
      storms: spec.storms.map((s,i) => ({ x:s[0], y:s[1], r:s[2], phase:i*.9, vx:rand(-20,20) })),
      currents: spec.currents.map(c => ({ x:c[0], y:c[1], w:c[2], h:c[3], force:c[4], phase:Math.random()*TAU })),
      portal: { x:spec.portal[0], y:spec.portal[1], r:54, active:false, phase:0 }
    };
    player = {
      x: spec.start[0], y: spec.start[1], vx:0, vy:0, r:18,
      grounded:false, coyote:0, jumpBuffer:0, burst:1, burstCooldown:0,
      invuln:0, trail:[], facing:1, squash:1, stretch:1
    };
    state.levelIndex = index;
    state.prism = 0;
    state.levelTime = 0;
    state.weatherHue = spec.hue;
    state.rainIntensity = .75 + index * .08;
    state.cameraX = 0;
    state.cameraY = 0;
    particles = [];
    rings = [];
    updateHud();
  }

  function updateHud() {
    if (!level) return;
    ui.levelText.textContent = state.levelIndex + 1;
    ui.prismText.textContent = state.prism;
    ui.prismGoal.textContent = level.goal;
    ui.boostFill.style.transform = `scaleX(${clamp(player?.burst ?? 1, 0, 1)})`;
  }

  function toast(text) {
    ui.toast.textContent = text;
    ui.toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => ui.toast.classList.remove('show'), 1400);
  }

  function showGameUI(on) {
    ui.hud.classList.toggle('hidden', !on);
    ui.boost.classList.toggle('hidden', !on);
    const coarse = matchMedia('(pointer: coarse)').matches || W < 820;
    ui.touch.classList.toggle('hidden', !(on && coarse));
  }

  function hideOverlays() {
    [ui.menu, ui.pause, ui.level, ui.finish].forEach(el => el.classList.remove('visible'));
  }

  function startGame(index = 0) {
    audio.init();
    buildLevel(index);
    state.scene = 'playing';
    state.paused = false;
    hideOverlays();
    showGameUI(true);
    state.lastTs = performance.now();
    toast(level.name.toUpperCase());
  }

  function togglePause(force) {
    if (state.scene !== 'playing') return;
    state.paused = force ?? !state.paused;
    ui.pause.classList.toggle('visible', state.paused);
    showGameUI(!state.paused);
    state.lastTs = performance.now();
  }

  function finishLevel() {
    if (state.scene !== 'playing') return;
    audio.complete();
    state.scene = 'levelComplete';
    showGameUI(false);
    const number = state.levelIndex + 1;
    save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, number + 1));
    save.totalPrism += state.prism;
    save.best[number] = Math.min(save.best[number] ?? Infinity, state.levelTime);
    save.reward = level.reward;
    persist();

    ui.rewardPrism.textContent = `${state.prism}/${level.goal}`;
    ui.rewardTime.textContent = formatTime(state.levelTime);
    ui.rewardName.textContent = level.reward;
    ui.levelEyebrow.textContent = state.levelIndex === LEVELS.length - 1 ? 'TEMPEST CLEARED' : 'SKY RESTORED';
    ui.levelTitle.textContent = level.name.toUpperCase();

    if (state.levelIndex === LEVELS.length - 1) {
      ui.finalScore.textContent = save.totalPrism;
      setTimeout(() => ui.finish.classList.add('visible'), 450);
    } else {
      setTimeout(() => ui.level.classList.add('visible'), 450);
    }
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  function addParticle(x,y,opts={}) {
    particles.push({
      x,y, vx:opts.vx ?? rand(-80,80), vy:opts.vy ?? rand(-100,10),
      life:opts.life ?? rand(.35,.8), maxLife:opts.life ?? rand(.35,.8),
      r:opts.r ?? rand(2,5), type:opts.type ?? 'mist', hue:opts.hue ?? state.weatherHue
    });
  }

  function burstParticles(x,y) {
    for (let i=0;i<36;i++) {
      const a = (i/36)*TAU + rand(-.12,.12), sp = rand(100,340);
      addParticle(x,y,{vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(.35,.75),r:rand(2,6),type:'prism',hue:(i/36)*360});
    }
    rings.push({x,y,r:12,life:.55,max:.55});
  }

  function respawn() {
    if (!player || player.invuln > 0) return;
    player.invuln = 1.2;
    player.x = Math.max(level.start[0], state.cameraX + W * .16);
    player.y = 120;
    player.vx = 0;
    player.vy = 40;
    state.screenShake = 10;
    audio.hurt();
    for (let i=0;i<20;i++) addParticle(player.x,player.y,{type:'mist',life:rand(.3,.8)});
    toast('CAUGHT BY THE STORM');
  }

  function update(dt) {
    if (state.scene !== 'playing' || state.paused || !player) return;
    state.levelTime += dt;
    state.totalTime += dt;
    state.flash = Math.max(0, state.flash - dt * 2.8);
    state.screenShake = Math.max(0, state.screenShake - dt * 18);

    if (player.invuln > 0) player.invuln -= dt;
    if (player.burstCooldown > 0) player.burstCooldown -= dt;
    player.burst = clamp(player.burst + dt * .12, 0, 1);
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    player.coyote = Math.max(0, player.coyote - dt);

    if (inputPressed('jump')) player.jumpBuffer = .20;

    const left = inputDown('left');
    const right = inputDown('right');
    const accel = player.grounded ? 1650 : 1040;
    const maxSpeed = player.grounded ? 330 : 360;
    if (left) { player.vx -= accel * dt; player.facing = -1; }
    if (right) { player.vx += accel * dt; player.facing = 1; }
    if (!left && !right) player.vx *= Math.pow(player.grounded ? .0006 : .13, dt);
    player.vx = clamp(player.vx, -maxSpeed, maxSpeed);

    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = -650;
      player.grounded = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      player.stretch = 1.35;
      audio.jump();
      for (let i=0;i<8;i++) addParticle(player.x,player.y+16,{vx:rand(-100,100),vy:rand(20,110),life:.35,type:'mist'});
    }

    if (!inputDown('jump') && player.vy < -150) player.vy += 700 * dt;

    if (inputPressed('burst') && player.burst >= .55 && player.burstCooldown <= 0) {
      const dir = left ? -1 : right ? 1 : player.facing;
      player.vx = dir * 760;
      player.vy *= .25;
      player.burst -= .55;
      player.burstCooldown = .18;
      player.invuln = Math.max(player.invuln, .25);
      state.screenShake = 5;
      state.flash = .45;
      burstParticles(player.x, player.y);
      audio.burst();
    }

    player.vy += 1180 * dt;
    player.vy = Math.min(player.vy, 920);

    for (const cur of level.currents) {
      if (player.x > cur.x && player.x < cur.x + cur.w && player.y > cur.y && player.y < cur.y + cur.h) {
        player.vx += cur.force * dt;
        player.vy -= 150 * dt;
        if (Math.random() < dt * 16) addParticle(rand(cur.x,cur.x+cur.w),rand(cur.y,cur.y+cur.h),{vx:cur.force*.16,vy:rand(-80,-10),life:.55,type:'wind'});
      }
    }

    const prevY = player.y;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.x = clamp(player.x, 16, level.width - 16);
    player.grounded = false;

    for (const p of level.platforms) {
      const px = clamp(player.x, p.x, p.x+p.w);
      const py = clamp(player.y, p.y, p.y+p.h);
      const dx = player.x-px, dy = player.y-py;
      if (dx*dx + dy*dy < player.r*player.r) {
        if (prevY + player.r <= p.y + 10 && player.vy >= 0) {
          player.y = p.y - player.r;
          const impact = player.vy;
          if (!player.grounded && impact > 140) {
            player.squash = 1.25;
            audio.land();
            for (let i=0;i<Math.min(10,impact/60);i++) addParticle(player.x+rand(-18,18),p.y,{vx:rand(-90,90),vy:rand(-80,-10),life:.38,type:'mist'});
          }
          player.grounded = true;
          player.coyote = .18;
          if (p.type === 'spring' && impact > 120) {
            player.vy = -820;
            player.grounded = false;
            player.coyote = 0;
            player.stretch = 1.45;
            state.screenShake = 3;
            audio.tone(280,.18,'triangle',.3,240);
          } else {
            player.vy = 0;
          }
        } else if (player.x < p.x) { player.x = p.x - player.r; player.vx = Math.min(0, player.vx); }
        else if (player.x > p.x+p.w) { player.x = p.x+p.w + player.r; player.vx = Math.max(0, player.vx); }
      }
    }

    player.squash = lerp(player.squash, 1, 1-Math.pow(.002,dt));
    player.stretch = lerp(player.stretch, 1, 1-Math.pow(.002,dt));

    for (const gem of level.prisms) {
      if (gem.got) continue;
      const dx = player.x-gem.x, dy = player.y-gem.y;
      if (dx*dx + dy*dy < (player.r+gem.r+18)**2) {
        gem.got = true;
        state.prism++;
        player.burst = clamp(player.burst + .18,0,1);
        state.flash = .18;
        audio.collect(state.prism % 5);
        for (let i=0;i<16;i++) addParticle(gem.x,gem.y,{type:'prism',hue:(i/16)*360,life:rand(.35,.7)});
        rings.push({x:gem.x,y:gem.y,r:8,life:.45,max:.45});
        if (state.prism === level.goal) {
          level.portal.active = true;
          toast('RAINBOW GATE AWAKENED');
          audio.complete();
        }
        updateHud();
      }
    }

    for (const s of level.storms) {
      s.phase += dt;
      const sx = s.x + Math.sin(s.phase*.8)*34;
      const sy = s.y + Math.cos(s.phase*.65)*20;
      const dx = player.x-sx, dy = player.y-sy;
      if (dx*dx+dy*dy < (s.r*.65+player.r)**2 && player.invuln <= 0) respawn();
    }

    if (level.portal.active) {
      level.portal.phase += dt;
      const dx=player.x-level.portal.x, dy=player.y-level.portal.y;
      if (dx*dx+dy*dy < (level.portal.r+player.r)**2) finishLevel();
    }

    if (player.y > H + 420) respawn();

    player.trail.push({x:player.x,y:player.y,life:.36});
    if (player.trail.length > 18) player.trail.shift();
    player.trail.forEach(t => t.life -= dt);
    player.trail = player.trail.filter(t => t.life > 0);

    particles.forEach(p => { p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy += (p.type==='wind' ? -25 : 120)*dt; p.vx*=Math.pow(.18,dt); });
    particles = particles.filter(p => p.life>0);
    rings.forEach(r=>{r.life-=dt; r.r+=280*dt;}); rings=rings.filter(r=>r.life>0);

    state.targetCameraX = clamp(player.x - W * .34, 0, Math.max(0, level.width - W));
    state.targetCameraY = clamp(player.y - H * .52, -80, 150);
    state.cameraX = lerp(state.cameraX, state.targetCameraX, 1-Math.pow(.00008,dt));
    state.cameraY = lerp(state.cameraY, state.targetCameraY, 1-Math.pow(.003,dt));

    updateHud();
    pressed.clear();
  }

  function worldToScreen(x,y) { return [x-state.cameraX, y-state.cameraY]; }

  function roundedRect(x,y,w,h,r) {
    const rr=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath();
  }

  function drawSky(t) {
    const hue = state.weatherHue;
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, `hsl(${hue+18} 44% 12%)`);
    grad.addColorStop(.52, `hsl(${hue+4} 42% 20%)`);
    grad.addColorStop(1, `hsl(${hue-8} 43% 30%)`);
    ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);

    const mx = (state.pointerX/W-.5)*24, my=(state.pointerY/H-.5)*12;
    const glow=ctx.createRadialGradient(W*.72+mx,H*.18+my,0,W*.72,H*.18,Math.max(W,H)*.52);
    glow.addColorStop(0,'rgba(162,219,255,.18)'); glow.addColorStop(.45,'rgba(135,169,255,.05)'); glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow; ctx.fillRect(0,0,W,H);

    for (const s of stars) {
      ctx.globalAlpha=s.a*(.7+.3*Math.sin(t*.001+s.x*20)); ctx.fillStyle='#eaf6ff'; ctx.beginPath(); ctx.arc(s.x*W,s.y*H,s.s,0,TAU); ctx.fill();
    }
    ctx.globalAlpha=1;

    for (const c of cloudsBg) {
      const x=((c.x + t*.001*c.drift)%(W+300))-150 + mx*c.layer;
      const y=c.y+my*c.layer;
      drawCloudShape(x,y,140*c.s,54*c.s,c.a,false);
    }
  }

  function drawCloudShape(x,y,w,h,a=.2,bright=true) {
    ctx.save(); ctx.globalAlpha=a;
    const g=ctx.createLinearGradient(x,y-h,x,y+h);
    g.addColorStop(0, bright?'#f0f8ff':'#a8c4db'); g.addColorStop(1, bright?'#a8c7dc':'#486179');
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.ellipse(x,y,w*.29,h*.5,0,0,TAU); ctx.ellipse(x+w*.2,y-h*.18,w*.25,h*.62,0,0,TAU); ctx.ellipse(x-w*.22,y-h*.11,w*.22,h*.52,0,0,TAU); ctx.ellipse(x,y+h*.16,w*.47,h*.42,0,0,TAU); ctx.fill();
    ctx.restore();
  }

  function drawRain(dt,t) {
    ctx.save();
    ctx.lineCap='round';
    for (const r of rain) {
      r.y += r.speed * r.z * dt * state.rainIntensity;
      r.x -= r.speed * .12 * r.z * dt;
      if (r.y>H+40 || r.x<-40) { r.y=rand(-120,-10); r.x=rand(0,W+180); }
      ctx.globalAlpha=.09+.28*r.z;
      ctx.strokeStyle='#b9e8ff'; ctx.lineWidth=.6+1.2*r.z;
      ctx.beginPath(); ctx.moveTo(r.x,r.y); ctx.lineTo(r.x-r.len*.18,r.y-r.len); ctx.stroke();
    }
    ctx.restore();
  }

  function drawRainbowArc(x,y,r,alpha=1) {
    const colors=['#ff6f91','#ffb45f','#ffe66f','#63e6a9','#65d8ff','#7a9cff','#b687ff'];
    ctx.save(); ctx.globalAlpha=alpha; ctx.lineCap='round';
    colors.forEach((c,i)=>{ ctx.strokeStyle=c; ctx.lineWidth=5.5; ctx.beginPath(); ctx.arc(x,y,r-i*5,Math.PI,TAU); ctx.stroke(); });
    ctx.restore();
  }

  function drawPlatforms(t) {
    for (const p of level.platforms) {
      const [x,y]=worldToScreen(p.x,p.y);
      if (x>W+200 || x+p.w<-200) continue;
      p.pulse += .012;
      ctx.save();
      ctx.shadowBlur=22; ctx.shadowColor=p.type==='spring'?'rgba(135,218,255,.25)':'rgba(168,214,238,.16)';
      drawCloudShape(x+p.w*.5,y+10,p.w*.62,42,p.type==='spring'?.92:.78,true);
      if (p.type==='spring') {
        ctx.globalAlpha=.35+.18*Math.sin(t*.004+p.pulse);
        const g=ctx.createLinearGradient(x,y,x+p.w,y); g.addColorStop(0,'#6ddcff'); g.addColorStop(.5,'#c7f7ff'); g.addColorStop(1,'#917cff');
        ctx.fillStyle=g; roundedRect(x+28,y-4,p.w-56,4,4); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawCurrents(t) {
    for (const c of level.currents) {
      const [x,y]=worldToScreen(c.x,c.y);
      if (x>W+200||x+c.w<-200) continue;
      ctx.save();
      ctx.globalAlpha=.12;
      const g=ctx.createLinearGradient(x,y,x+c.w,y); g.addColorStop(0,'rgba(120,220,255,0)'); g.addColorStop(.5,'rgba(180,240,255,.7)'); g.addColorStop(1,'rgba(120,220,255,0)');
      ctx.fillStyle=g; roundedRect(x,y,c.w,c.h,35); ctx.fill();
      ctx.globalAlpha=.35;
      ctx.strokeStyle='#d7f7ff'; ctx.lineWidth=1;
      for(let i=0;i<5;i++){
        const yy=y+((i*73+t*.07)%c.h); ctx.beginPath();
        const dir=Math.sign(c.force); const sx=dir>0?x+12:x+c.w-12; ctx.moveTo(sx,yy); ctx.quadraticCurveTo(x+c.w*.5,yy-18,x+c.w-(sx-x),yy-4); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawStorms(t) {
    for (const s of level.storms) {
      const sx=s.x+Math.sin(s.phase*.8)*34, sy=s.y+Math.cos(s.phase*.65)*20;
      const [x,y]=worldToScreen(sx,sy);
      if (x<-180||x>W+180) continue;
      const pulse=1+Math.sin(t*.006+s.phase)*.05;
      ctx.save();
      const rg=ctx.createRadialGradient(x,y,0,x,y,s.r*pulse); rg.addColorStop(0,'rgba(26,20,56,.86)'); rg.addColorStop(.5,'rgba(44,45,93,.38)'); rg.addColorStop(1,'rgba(42,53,91,0)');
      ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(x,y,s.r*pulse,0,TAU);ctx.fill();
      ctx.globalAlpha=.5; drawCloudShape(x,y,s.r*.9,s.r*.35,.6,false);
      ctx.strokeStyle='rgba(180,197,255,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+3,y+5);ctx.lineTo(x-8,y+27);ctx.lineTo(x+5,y+24);ctx.lineTo(x-3,y+45);ctx.stroke();
      ctx.restore();
    }
  }

  function drawPrisms(t) {
    for (const gem of level.prisms) {
      if (gem.got) continue;
      const [x,y0]=worldToScreen(gem.x,gem.y); const y=y0+Math.sin(t*.004+gem.phase)*7;
      if(x<-80||x>W+80)continue;
      ctx.save(); ctx.translate(x,y); ctx.rotate(t*.0015+gem.phase); ctx.shadowBlur=24; ctx.shadowColor='rgba(143,232,255,.75)';
      const g=ctx.createLinearGradient(-12,-16,15,15); g.addColorStop(0,'#ffffff'); g.addColorStop(.28,'#79e6ff'); g.addColorStop(.58,'#a78bfa'); g.addColorStop(.82,'#ff89b5'); g.addColorStop(1,'#ffe07d');
      ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(0,-16);ctx.lineTo(12,0);ctx.lineTo(0,16);ctx.lineTo(-12,0);ctx.closePath();ctx.fill();
      ctx.globalAlpha=.55;ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-1,-12);ctx.lineTo(8,0);ctx.lineTo(1,4);ctx.closePath();ctx.fill();ctx.restore();
    }
  }

  function drawPortal(t) {
    const p=level.portal; const [x,y]=worldToScreen(p.x,p.y);
    if(x<-180||x>W+180)return;
    ctx.save();
    ctx.globalAlpha=p.active?1:.18;
    drawRainbowArc(x,y+34,p.r, .88);
    const glow=ctx.createRadialGradient(x,y+10,0,x,y+10,90); glow.addColorStop(0,p.active?'rgba(210,248,255,.28)':'rgba(150,170,190,.08)');glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,90,0,TAU);ctx.fill();
    if (!p.active) { ctx.globalAlpha=.45;ctx.fillStyle='#d8e5ef';ctx.font='700 9px Inter, sans-serif';ctx.textAlign='center';ctx.fillText(`${state.prism}/${level.goal} PRISM`,x,y+58); }
    ctx.restore();
  }

  function drawParticles() {
    for(const p of particles){
      const [x,y]=worldToScreen(p.x,p.y); const a=clamp(p.life/p.maxLife,0,1);
      ctx.save();ctx.globalAlpha=a;
      if(p.type==='prism'){ctx.fillStyle=`hsl(${p.hue} 95% 72%)`;ctx.shadowBlur=12;ctx.shadowColor=ctx.fillStyle;}
      else if(p.type==='wind'){ctx.fillStyle='rgba(215,248,255,.7)';}
      else ctx.fillStyle='rgba(220,244,255,.48)';
      ctx.beginPath();ctx.arc(x,y,p.r*(.6+a*.6),0,TAU);ctx.fill();ctx.restore();
    }
    for(const r of rings){const [x,y]=worldToScreen(r.x,r.y);ctx.save();ctx.globalAlpha=r.life/r.max;ctx.strokeStyle='#dff8ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r.r,0,TAU);ctx.stroke();ctx.restore();}
  }

  function drawPlayer(t) {
    if(!player)return;
    const [x,y]=worldToScreen(player.x,player.y);
    ctx.save();
    if(player.invuln>0 && Math.floor(player.invuln*14)%2===0)ctx.globalAlpha=.35;
    player.trail.forEach((tr,i)=>{const [tx,ty]=worldToScreen(tr.x,tr.y);const a=tr.life/.36;ctx.globalAlpha=.12*a;ctx.fillStyle=`hsl(${180+i*8} 90% 72%)`;ctx.beginPath();ctx.arc(tx,ty,player.r*(.3+i/player.trail.length*.35),0,TAU);ctx.fill();});
    ctx.globalAlpha=1;
    ctx.translate(x,y);ctx.scale(1/player.squash*player.stretch,player.squash/player.stretch);
    const g=ctx.createRadialGradient(-6,-8,2,0,0,24); g.addColorStop(0,'#f5fdff');g.addColorStop(.28,'#bcecff');g.addColorStop(.76,'#6cc8f0');g.addColorStop(1,'#508bc2');
    ctx.fillStyle=g;ctx.shadowBlur=24;ctx.shadowColor='rgba(100,211,255,.55)';
    ctx.beginPath();ctx.moveTo(0,-22);ctx.bezierCurveTo(18,-5,23,8,12,19);ctx.bezierCurveTo(5,26,-8,24,-15,17);ctx.bezierCurveTo(-25,6,-15,-8,0,-22);ctx.fill();
    ctx.shadowBlur=0;ctx.globalAlpha=.75;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(-6,-7,4,7,-.45,0,TAU);ctx.fill();
    ctx.globalAlpha=.9;ctx.fillStyle='#1d4970';ctx.beginPath();ctx.arc(5,2,2,0,TAU);ctx.arc(-5,2,2,0,TAU);ctx.fill();
    ctx.restore();
  }

  function drawForegroundMist(t) {
    ctx.save();
    const grad=ctx.createLinearGradient(0,H*.62,0,H);grad.addColorStop(0,'rgba(216,241,255,0)');grad.addColorStop(1,'rgba(195,226,241,.13)');ctx.fillStyle=grad;ctx.fillRect(0,H*.58,W,H*.42);
    ctx.globalAlpha=.08; for(let i=0;i<5;i++){const x=((i*310+t*.012)%(W+500))-250;drawCloudShape(x,H-30+Math.sin(t*.001+i)*15,220,65,.16,true);}ctx.restore();
  }

  function draw(t,dt) {
    ctx.save();
    const shakeX=state.screenShake?rand(-state.screenShake,state.screenShake):0;
    const shakeY=state.screenShake?rand(-state.screenShake,state.screenShake):0;
    ctx.translate(shakeX,shakeY);
    drawSky(t);
    drawRain(dt,t);
    if(level){drawCurrents(t);drawPortal(t);drawPlatforms(t);drawStorms(t);drawPrisms(t);drawParticles();drawPlayer(t);}
    drawForegroundMist(t);
    if(state.flash>0){ctx.globalAlpha=state.flash*.28;ctx.fillStyle='#dff8ff';ctx.fillRect(-20,-20,W+40,H+40);ctx.globalAlpha=1;}
    ctx.restore();
  }

  function loop(ts) {
    let dt=(ts-state.lastTs)/1000; state.lastTs=ts; dt=Math.min(dt,.033);
    if(state.scene!=='playing' || !state.paused) update(dt);
    draw(ts,dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  document.getElementById('playBtn').addEventListener('click',()=>startGame(0));
  ui.continueBtn.addEventListener('click',()=>startGame(Math.max(0,Math.min(LEVELS.length-1,save.unlocked-1))));
  ui.pauseBtn.addEventListener('click',()=>togglePause(true));
  document.getElementById('resumeBtn').addEventListener('click',()=>togglePause(false));
  document.getElementById('restartBtn').addEventListener('click',()=>startGame(state.levelIndex));
  document.getElementById('menuBtn').addEventListener('click',()=>{state.scene='menu';state.paused=false;hideOverlays();ui.menu.classList.add('visible');showGameUI(false);});
  document.getElementById('replayBtn').addEventListener('click',()=>startGame(state.levelIndex));
  ui.nextBtn.addEventListener('click',()=>startGame(Math.min(LEVELS.length-1,state.levelIndex+1)));
  document.getElementById('againBtn').addEventListener('click',()=>startGame(0));
  document.getElementById('finishMenuBtn').addEventListener('click',()=>{state.scene='menu';hideOverlays();ui.menu.classList.add('visible');showGameUI(false);});
  ui.muteBtn.addEventListener('click',()=>{state.muted=!state.muted;ui.muteBtn.textContent=state.muted?'♩':'♫';toast(state.muted?'SOUND OFF':'SOUND ON');});

  if (save.unlocked > 1) ui.continueBtn.classList.remove('hidden');
})();
