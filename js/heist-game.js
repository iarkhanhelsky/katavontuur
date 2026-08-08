(() => {
  'use strict';

  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const ui = {
    title: document.querySelector('#title-screen'),
    start: document.querySelector('#start-button'),
    sound: document.querySelector('#sound-toggle'),
    hud: document.querySelector('#hud'),
    loot: document.querySelector('#loot-count'),
    lives: document.querySelector('#lives-count'),
    objective: document.querySelector('#objective-text'),
    toast: document.querySelector('#toast'),
    touch: document.querySelector('#touch-controls'),
    end: document.querySelector('#end-screen'),
    endKicker: document.querySelector('#end-kicker'),
    endTitle: document.querySelector('#end-title'),
    endSummary: document.querySelector('#end-summary'),
    restart: document.querySelector('#restart-button')
  };

  const VIEW_W = canvas.width;
  const VIEW_H = canvas.height;
  const WORLD_W = 7480;
  const REQUIRED_LOOT = 10;
  const GRAVITY = 2150;
  const input = { left: false, right: false, jump: false, dash: false, jumpPressed: false, dashPressed: false };
  const game = {
    mode: 'title',
    time: 0,
    lastTime: performance.now(),
    cameraX: 0,
    shake: 0,
    sound: true,
    loot: 0,
    totalLoot: 0,
    checkpoint: { x: 130, y: 490 },
    toastTimer: 0,
    objective: 'Reach the old cemetery gate',
    ghostUnlocked: false,
    vaultHinted: false,
    secretOpened: false,
    endStarted: false,
    guardsBonked: 0
  };

  const assets = {};
  const assetSources = {
    background: 'assets/backgrounds/heist-manor.webp',
    idle: 'assets/animations/cat3/idle.png',
    walk: 'assets/animations/cat3/walk.png',
    run: 'assets/animations/cat3/run.png',
    jump: 'assets/animations/cat3/jump.png',
    attack: 'assets/animations/cat3/attack.png'
  };

  const platforms = [
    { x: -80, y: 590, w: 930, h: 160, kind: 'earth' },
    { x: 670, y: 478, w: 170, h: 34, kind: 'stone' },
    { x: 885, y: 415, w: 150, h: 32, kind: 'stone' },
    { x: 1035, y: 590, w: 760, h: 160, kind: 'earth' },
    { x: 1180, y: 480, w: 190, h: 32, kind: 'stone' },
    { x: 1430, y: 398, w: 175, h: 32, kind: 'stone' },
    { x: 1810, y: 550, w: 340, h: 200, kind: 'wall' },
    { x: 1980, y: 445, w: 175, h: 34, kind: 'wall' },
    { x: 2190, y: 590, w: 500, h: 160, kind: 'courtyard' },
    { x: 2380, y: 470, w: 155, h: 31, kind: 'stone' },
    { x: 2730, y: 535, w: 250, h: 215, kind: 'wall' },
    { x: 2940, y: 428, w: 150, h: 32, kind: 'stone' },
    { x: 3130, y: 590, w: 710, h: 160, kind: 'courtyard' },
    { x: 3260, y: 475, w: 160, h: 32, kind: 'stone' },
    { x: 3470, y: 390, w: 160, h: 32, kind: 'stone' },
    { x: 3860, y: 550, w: 300, h: 200, kind: 'roof' },
    { x: 4030, y: 432, w: 160, h: 32, kind: 'roof' },
    { x: 4225, y: 340, w: 165, h: 32, kind: 'roof' },
    { x: 4415, y: 460, w: 170, h: 32, kind: 'roof' },
    { x: 4610, y: 590, w: 630, h: 160, kind: 'manor' },
    { x: 4720, y: 455, w: 160, h: 32, kind: 'roof' },
    { x: 4940, y: 370, w: 175, h: 32, kind: 'roof' },
    { x: 5280, y: 535, w: 280, h: 215, kind: 'manor' },
    { x: 5480, y: 420, w: 170, h: 32, kind: 'roof' },
    { x: 5680, y: 590, w: 470, h: 160, kind: 'vault' },
    { x: 5870, y: 470, w: 160, h: 32, kind: 'stone' },
    { x: 6190, y: 540, w: 250, h: 210, kind: 'vault' },
    { x: 6400, y: 430, w: 165, h: 32, kind: 'vault' },
    { x: 6600, y: 590, w: 880, h: 160, kind: 'vault' },
    { x: 6810, y: 465, w: 160, h: 32, kind: 'stone' },
    { x: 7040, y: 375, w: 190, h: 32, kind: 'stone' }
  ];

  const hazardsTemplate = [
    { x: 850, y: 570, w: 185, h: 22, type: 'thorns' },
    { x: 2690, y: 568, w: 40, h: 22, type: 'spikes' },
    { x: 3840, y: 568, w: 26, h: 22, type: 'spikes' },
    { x: 4565, y: 568, w: 45, h: 22, type: 'spikes' },
    { x: 6150, y: 568, w: 40, h: 22, type: 'spikes' },
    { x: 6440, y: 516, w: 80, h: 18, type: 'spikes' }
  ];

  const lootTemplate = [
    { x: 310, y: 520, type: 'candy' }, { x: 740, y: 412, type: 'coin' },
    { x: 955, y: 350, type: 'gem' }, { x: 1290, y: 415, type: 'candy' },
    { x: 1510, y: 330, type: 'coin' }, { x: 2030, y: 380, type: 'gem' },
    { x: 2470, y: 405, type: 'candy' }, { x: 2820, y: 470, type: 'coin' },
    { x: 3020, y: 365, type: 'gem' }, { x: 3340, y: 410, type: 'candy' },
    { x: 3550, y: 325, type: 'coin' }, { x: 4105, y: 365, type: 'gem' },
    { x: 4310, y: 275, type: 'candy' }, { x: 4500, y: 395, type: 'coin' },
    { x: 4800, y: 390, type: 'gem' }, { x: 5030, y: 305, type: 'candy' },
    { x: 5550, y: 355, type: 'coin' }, { x: 5950, y: 405, type: 'gem' },
    { x: 6480, y: 365, type: 'candy' }, { x: 6890, y: 400, type: 'gem' },
    { x: 7135, y: 310, type: 'moon' }
  ];

  const enemyTemplate = [
    { x: 1210, y: 526, min: 1080, max: 1710, speed: 72, type: 'raccoon' },
    { x: 2260, y: 526, min: 2200, max: 2630, speed: 82, type: 'raccoon' },
    { x: 3190, y: 526, min: 3140, max: 3780, speed: 88, type: 'raccoon' },
    { x: 3990, y: 270, min: 3940, max: 4500, speed: 65, type: 'bat' },
    { x: 4660, y: 526, min: 4630, max: 5180, speed: 95, type: 'raccoon' },
    { x: 5400, y: 250, min: 5300, max: 6100, speed: 70, type: 'bat' },
    { x: 5720, y: 526, min: 5700, max: 6100, speed: 102, type: 'raccoon' },
    { x: 6650, y: 526, min: 6620, max: 7180, speed: 112, type: 'raccoon' }
  ];

  const checkpoints = [
    { x: 1870, y: 480, label: 'Cemetery gate cracked' },
    { x: 3900, y: 480, label: 'Made it to the rooftops' },
    { x: 5705, y: 520, label: 'Vault wing reached' }
  ];

  const decor = [
    { x: 210, y: 590, type: 'sign' }, { x: 490, y: 590, type: 'grave' },
    { x: 1140, y: 590, type: 'lamp' }, { x: 1710, y: 590, type: 'pumpkin' },
    { x: 2240, y: 590, type: 'lamp' }, { x: 2600, y: 590, type: 'grave' },
    { x: 3200, y: 590, type: 'secret' }, { x: 3720, y: 590, type: 'pumpkin' },
    { x: 4690, y: 590, type: 'lamp' }, { x: 5160, y: 590, type: 'pumpkin' },
    { x: 5750, y: 590, type: 'lamp' }, { x: 6710, y: 590, type: 'lamp' }
  ];

  let hazards = [];
  let loot = [];
  let enemies = [];
  let particles = [];
  let player;
  let audioContext;
  let toastTimeout;

  function loadAssets() {
    for (const [key, src] of Object.entries(assetSources)) {
      const image = new Image();
      image.src = src;
      assets[key] = image;
    }
  }

  function makePlayer() {
    return {
      x: 130, y: 490, w: 52, h: 68, vx: 0, vy: 0,
      grounded: false, facing: 1, lives: 3, invulnerable: 0,
      coyote: 0, jumpBuffer: 0, dashTime: 0, dashCooldown: 0,
      anim: 'idle', animTime: 0, frame: 0, landed: false
    };
  }

  function resetGame() {
    player = makePlayer();
    hazards = hazardsTemplate.map(item => ({ ...item }));
    loot = lootTemplate.map(item => ({ ...item, taken: false, bob: Math.random() * Math.PI * 2 }));
    enemies = enemyTemplate.map((enemy, index) => ({ ...enemy, dir: index % 2 ? -1 : 1, stunned: 0, phase: index * 1.7 }));
    particles = [];
    game.time = 0;
    game.cameraX = 0;
    game.shake = 0;
    game.loot = 0;
    game.totalLoot = loot.length;
    game.checkpoint = { x: 130, y: 490 };
    game.objective = 'Reach the old cemetery gate';
    game.ghostUnlocked = false;
    game.vaultHinted = false;
    game.secretOpened = false;
    game.endStarted = false;
    game.guardsBonked = 0;
    checkpoints.forEach(checkpoint => { checkpoint.reached = false; });
    updateHud();
  }

  function beginGame() {
    ensureAudio();
    resetGame();
    game.mode = 'playing';
    ui.title.classList.remove('screen--visible');
    ui.end.classList.remove('screen--visible');
    window.setTimeout(() => { ui.title.hidden = true; ui.end.hidden = true; }, 360);
    ui.hud.hidden = false;
    const touchDevice = matchMedia('(pointer: coarse)').matches || innerWidth < 820;
    ui.touch.hidden = !touchDevice;
    showToast('Keep low. Look innocent. Steal everything.', 2600);
    blip(390, 0.08, 'triangle', 0.05);
  }

  function finishGame(success) {
    if (game.endStarted) return;
    game.endStarted = true;
    game.mode = success ? 'won' : 'lost';
    ui.hud.hidden = true;
    ui.touch.hidden = true;
    ui.end.hidden = false;
    ui.endKicker.textContent = success ? 'Heist complete' : 'Busted… sort of';
    ui.endTitle.textContent = success ? 'Clean getaway!' : 'Nine lives spent';
    ui.endSummary.textContent = success
      ? `You lifted ${game.loot} treasures, embarrassed ${game.guardsBonked} guards, and escaped with your whiskers intact.`
      : `The manor keeps its secrets tonight—but cat burglars always land on their feet.`;
    requestAnimationFrame(() => ui.end.classList.add('screen--visible'));
    chord(success ? [523, 659, 784] : [220, 185, 147]);
  }

  function update(dt) {
    game.time += dt;
    if (game.toastTimer > 0) game.toastTimer -= dt;
    updateParticles(dt);
    if (game.mode !== 'playing') return;

    updatePlayer(dt);
    updateEnemies(dt);
    collectNearbyLoot();
    updateCheckpoints();
    updateSecrets();

    const targetCamera = clamp(player.x - VIEW_W * 0.34, 0, WORLD_W - VIEW_W);
    game.cameraX += (targetCamera - game.cameraX) * Math.min(1, dt * 5.2);
    game.shake = Math.max(0, game.shake - dt * 22);
  }

  function updatePlayer(dt) {
    const wasGrounded = player.grounded;
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.dashTime = Math.max(0, player.dashTime - dt);
    player.coyote = player.grounded ? 0.12 : Math.max(0, player.coyote - dt);
    player.jumpBuffer = input.jumpPressed ? 0.14 : Math.max(0, player.jumpBuffer - dt);
    input.jumpPressed = false;

    const axis = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (axis) player.facing = axis;

    if (input.dashPressed && player.dashCooldown <= 0) {
      player.dashTime = 0.18;
      player.dashCooldown = 0.72;
      player.vx = player.facing * 650;
      player.vy *= 0.2;
      burst(player.x + player.w / 2, player.y + player.h / 2, '#ffb057', 9, -player.facing);
      blip(170, 0.06, 'sawtooth', 0.035);
    }
    input.dashPressed = false;

    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = -790;
      player.grounded = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      burst(player.x + player.w / 2, player.y + player.h, '#bea8d7', 7, 0);
      blip(310, 0.07, 'square', 0.025);
    }

    if (player.dashTime <= 0) {
      const acceleration = player.grounded ? 2650 : 1750;
      const maxSpeed = input.dash ? 410 : 330;
      if (axis) player.vx = approach(player.vx, axis * maxSpeed, acceleration * dt);
      else player.vx = approach(player.vx, 0, (player.grounded ? 3000 : 520) * dt);
      player.vy += GRAVITY * dt;
      if (!input.jump && player.vy < -280) player.vy += 1600 * dt;
    }

    player.vy = Math.min(player.vy, 1050);
    moveAndCollide(player, dt);

    if (!wasGrounded && player.grounded) {
      player.landed = true;
      burst(player.x + player.w / 2, player.y + player.h, '#8d789f', 8, 0);
    }

    if (player.y > VIEW_H + 170) hurtPlayer('That was not the quiet route.');

    for (const hazard of hazards) {
      if (overlap(player, hazard)) hurtPlayer('Ouch. Haunted landscaping.');
    }

    const speed = Math.abs(player.vx);
    const nextAnim = !player.grounded ? 'jump' : player.dashTime > 0 ? 'attack' : speed > 345 ? 'run' : speed > 35 ? 'walk' : 'idle';
    if (nextAnim !== player.anim) { player.anim = nextAnim; player.animTime = 0; player.frame = 0; }
    player.animTime += dt;
    const fps = player.anim === 'idle' ? 7 : player.anim === 'jump' ? 9 : 12;
    player.frame = Math.floor(player.animTime * fps) % 7;
  }

  function moveAndCollide(body, dt) {
    body.x += body.vx * dt;
    for (const platform of platforms) {
      if (!overlap(body, platform)) continue;
      if (body.vx > 0) body.x = platform.x - body.w;
      else if (body.vx < 0) body.x = platform.x + platform.w;
      body.vx = 0;
    }

    body.y += body.vy * dt;
    body.grounded = false;
    for (const platform of platforms) {
      if (!overlap(body, platform)) continue;
      if (body.vy > 0) {
        body.y = platform.y - body.h;
        body.vy = 0;
        body.grounded = true;
      } else if (body.vy < 0) {
        body.y = platform.y + platform.h;
        body.vy = 0;
      }
    }
    body.x = clamp(body.x, -20, WORLD_W - body.w);
  }

  function updateEnemies(dt) {
    for (const enemy of enemies) {
      enemy.phase += dt;
      enemy.stunned = Math.max(0, enemy.stunned - dt);
      if (enemy.stunned <= 0) {
        enemy.x += enemy.speed * enemy.dir * dt;
        if (enemy.x <= enemy.min || enemy.x >= enemy.max) {
          enemy.dir *= -1;
          enemy.x = clamp(enemy.x, enemy.min, enemy.max);
        }
      }

      const hitbox = enemy.type === 'bat'
        ? { x: enemy.x - 25, y: enemy.y + Math.sin(enemy.phase * 3) * 28 - 16, w: 50, h: 34 }
        : { x: enemy.x - 29, y: enemy.y, w: 58, h: 60 };
      if (!overlap(player, hitbox) || enemy.stunned > 0) continue;
      const attacking = player.dashTime > 0 || (player.vy > 250 && player.y + player.h < hitbox.y + hitbox.h * 0.65);
      if (attacking) {
        if (!enemy.bonked) {
          enemy.bonked = true;
          game.guardsBonked += 1;
        }
        enemy.stunned = 4.5;
        player.vy = -410;
        player.dashTime = 0;
        burst(enemy.x, hitbox.y + 20, '#c8f560', 14, 0);
        showToast(enemy.type === 'bat' ? 'Bat: bamboozled.' : 'Guard taking an unscheduled nap.');
        blip(120, 0.09, 'square', 0.04);
      } else {
        hurtPlayer('Spotted! Relocating paws…');
      }
    }
  }

  function collectNearbyLoot() {
    for (const item of loot) {
      if (item.taken) continue;
      const dx = player.x + player.w / 2 - item.x;
      const dy = player.y + player.h / 2 - item.y;
      if (dx * dx + dy * dy > 52 * 52) continue;
      item.taken = true;
      game.loot += 1;
      burst(item.x, item.y, item.type === 'gem' ? '#dca5ff' : '#ffb057', 12, 0);
      blip(620 + game.loot * 18, 0.08, 'sine', 0.035);
      updateHud();
      if (game.loot === 1) showToast('One shiny thing. Entirely according to plan.');
      if (game.loot === 5) showToast('Loot bag: suspiciously jingly.');
      if (game.loot === 7 && !game.ghostUnlocked) {
        game.ghostUnlocked = true;
        showToast('A tiny ghost has joined the crew!', 2800);
        chord([440, 554, 659]);
      }
      if (game.loot === REQUIRED_LOOT) {
        game.objective = 'The moon vault is open — make the getaway!';
        showToast('Enough loot! The vault lock clicks open.', 2800);
        updateHud();
      }
    }
  }

  function updateCheckpoints() {
    for (const checkpoint of checkpoints) {
      if (checkpoint.reached || player.x < checkpoint.x) continue;
      checkpoint.reached = true;
      game.checkpoint = { x: checkpoint.x + 20, y: checkpoint.y };
      showToast(checkpoint.label);
      if (checkpoint.x < 2000) game.objective = 'Cross the pumpkin courtyard';
      else if (checkpoint.x < 5000) game.objective = 'Sneak over the manor roofs';
      else game.objective = game.loot >= REQUIRED_LOOT ? 'Reach the open moon vault' : `Find ${REQUIRED_LOOT - game.loot} more treasures`;
      updateHud();
    }

    if (player.x > 7120 && player.y < 430) {
      if (game.loot >= REQUIRED_LOOT) finishGame(true);
      else if (!game.vaultHinted) {
        game.vaultHinted = true;
        showToast(`Vault needs ${REQUIRED_LOOT - game.loot} more treasures. Rude.`, 2800);
      }
    }
  }

  function updateSecrets() {
    if (!game.secretOpened && player.dashTime > 0 && player.x > 3120 && player.x < 3260 && player.y > 450) {
      game.secretOpened = true;
      const bonus = [
        { x: 3255, y: 515, type: 'moon', taken: false, bob: 0 },
        { x: 3300, y: 520, type: 'gem', taken: false, bob: 1 },
        { x: 3345, y: 515, type: 'moon', taken: false, bob: 2 }
      ];
      loot.push(...bonus);
      game.totalLoot += bonus.length;
      burst(3200, 530, '#ff9b42', 20, 0);
      showToast('Secret snack cache! Raccoons are excellent architects.', 3000);
      updateHud();
    }
  }

  function hurtPlayer(message) {
    if (player.invulnerable > 0 || game.mode !== 'playing') return;
    player.lives -= 1;
    player.invulnerable = 1.5;
    game.shake = 12;
    burst(player.x + player.w / 2, player.y + player.h / 2, '#ff6b69', 18, 0);
    blip(90, 0.18, 'sawtooth', 0.04);
    updateHud();
    if (player.lives <= 0) {
      finishGame(false);
      return;
    }
    showToast(message);
    player.x = game.checkpoint.x;
    player.y = game.checkpoint.y;
    player.vx = 0;
    player.vy = 0;
  }

  function updateHud() {
    ui.loot.textContent = `${game.loot} / ${game.totalLoot || lootTemplate.length}`;
    ui.lives.textContent = Array.from({ length: 3 }, (_, i) => i < (player?.lives ?? 3) ? '♥' : '♡').join(' ');
    ui.objective.textContent = game.objective;
  }

  function showToast(message, duration = 2000) {
    ui.toast.textContent = message;
    ui.toast.classList.add('toast--visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => ui.toast.classList.remove('toast--visible'), duration);
  }

  function updateParticles(dt) {
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 520 * dt;
    }
    particles = particles.filter(p => p.life > 0);
  }

  function burst(x, y, color, count, bias) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 170;
      particles.push({
        x, y, color, life: .35 + Math.random() * .55, maxLife: .9,
        size: 2 + Math.random() * 5,
        vx: Math.cos(angle) * speed + (bias || 0) * 70,
        vy: Math.sin(angle) * speed - 70
      });
    }
  }

  function render() {
    const shakeX = game.shake ? (Math.random() - .5) * game.shake : 0;
    const shakeY = game.shake ? (Math.random() - .5) * game.shake : 0;
    drawBackground(shakeX, shakeY);
    if (game.mode === 'title') return;

    ctx.save();
    ctx.translate(-game.cameraX + shakeX, shakeY);
    drawWorldBack();
    drawPlatforms();
    drawHazards();
    drawDecor();
    drawLoot();
    drawEnemies();
    if (game.ghostUnlocked) drawGhost();
    drawPlayer();
    drawParticles();
    drawVault();
    ctx.restore();
  }

  function drawBackground(shakeX, shakeY) {
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    gradient.addColorStop(0, '#110b25');
    gradient.addColorStop(.62, '#352153');
    gradient.addColorStop(1, '#100916');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    const image = assets.background;
    if (image?.complete && image.naturalWidth) {
      const scale = Math.max(VIEW_W / image.width, VIEW_H / image.height);
      const sw = VIEW_W / scale;
      const sh = VIEW_H / scale;
      const travel = Math.max(0, image.width - sw);
      const sx = game.mode === 'title' ? travel * .1 : travel * (game.cameraX / Math.max(1, WORLD_W - VIEW_W));
      const sy = Math.max(0, (image.height - sh) * .38);
      ctx.globalAlpha = .88;
      ctx.drawImage(image, sx, sy, sw, sh, shakeX, shakeY, VIEW_W, VIEW_H);
      ctx.globalAlpha = 1;
    }

    const veil = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    veil.addColorStop(0, 'rgba(12,7,28,.05)');
    veil.addColorStop(.55, 'rgba(16,8,31,.18)');
    veil.addColorStop(1, 'rgba(5,4,12,.72)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    ctx.save();
    ctx.globalAlpha = .09;
    ctx.fillStyle = '#d9c6ff';
    for (let i = 0; i < 7; i++) {
      const x = ((i * 290 - game.cameraX * .12 + game.time * 9) % 1800) - 250;
      ctx.beginPath();
      ctx.ellipse(x, 500 + Math.sin(i * 2.4) * 42, 260, 34, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWorldBack() {
    ctx.fillStyle = 'rgba(7,5,14,.34)';
    for (let x = 250; x < WORLD_W; x += 420) {
      const h = 90 + ((x * 17) % 110);
      ctx.fillRect(x, 590 - h, 18, h);
      ctx.beginPath();
      ctx.moveTo(x - 35, 590 - h + 55);
      ctx.lineTo(x + 9, 590 - h - 35);
      ctx.lineTo(x + 50, 590 - h + 55);
      ctx.fill();
    }
  }

  function drawPlatforms() {
    for (const p of platforms) {
      const palette = platformPalette(p.kind);
      ctx.fillStyle = palette.side;
      roundedRect(ctx, p.x, p.y, p.w, p.h, Math.min(10, p.h / 3));
      ctx.fill();
      ctx.fillStyle = palette.top;
      roundedRect(ctx, p.x, p.y, p.w, Math.min(14, p.h), 7);
      ctx.fill();
      ctx.strokeStyle = palette.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x + 7, p.y + 14);
      ctx.lineTo(p.x + p.w - 7, p.y + 14);
      ctx.stroke();

      if (p.h > 50) {
        ctx.strokeStyle = 'rgba(255,255,255,.055)';
        ctx.lineWidth = 2;
        for (let y = p.y + 36; y < Math.min(VIEW_H + 30, p.y + p.h); y += 34) {
          ctx.beginPath();
          ctx.moveTo(p.x, y);
          ctx.lineTo(p.x + p.w, y);
          ctx.stroke();
          for (let x = p.x + ((Math.floor(y / 34) % 2) ? 28 : 0); x < p.x + p.w; x += 58) {
            ctx.beginPath(); ctx.moveTo(x, y - 20); ctx.lineTo(x, y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = 'rgba(200,245,96,.15)';
      for (let x = p.x + 12; x < p.x + p.w; x += 48) {
        if ((x * 13) % 5 < 2) ctx.fillRect(x, p.y - 3, 22, 4);
      }
    }
  }

  function platformPalette(kind) {
    if (kind === 'earth') return { top: '#334d3f', side: '#171927', line: '#71915d' };
    if (kind === 'roof') return { top: '#6b3f70', side: '#24172f', line: '#b86f75' };
    if (kind === 'courtyard') return { top: '#4f495f', side: '#252030', line: '#858093' };
    if (kind === 'vault') return { top: '#61536f', side: '#201b2b', line: '#aa8c75' };
    if (kind === 'manor') return { top: '#4d3b5d', side: '#1d1729', line: '#8b667f' };
    return { top: '#4c5261', side: '#22202f', line: '#80879a' };
  }

  function drawHazards() {
    for (const h of hazards) {
      ctx.fillStyle = h.type === 'thorns' ? '#42223f' : '#a5a1b0';
      const count = Math.max(2, Math.floor(h.w / 18));
      for (let i = 0; i < count; i++) {
        const x = h.x + i * (h.w / count);
        ctx.beginPath();
        ctx.moveTo(x, h.y + h.h);
        ctx.lineTo(x + h.w / count * .5, h.y);
        ctx.lineTo(x + h.w / count, h.y + h.h);
        ctx.fill();
      }
    }
  }

  function drawDecor() {
    for (const item of decor) {
      if (item.type === 'lamp') drawLamp(item.x, item.y);
      else if (item.type === 'grave') drawGrave(item.x, item.y);
      else if (item.type === 'pumpkin' || item.type === 'secret') drawPumpkin(item.x, item.y, item.type === 'secret');
      else if (item.type === 'sign') drawSign(item.x, item.y);
    }
  }

  function drawLamp(x, y) {
    const glow = ctx.createRadialGradient(x, y - 108, 4, x, y - 108, 70);
    glow.addColorStop(0, 'rgba(255,180,82,.28)'); glow.addColorStop(1, 'rgba(255,180,82,0)');
    ctx.fillStyle = glow; ctx.fillRect(x - 75, y - 185, 150, 150);
    ctx.fillStyle = '#18121f'; ctx.fillRect(x - 4, y - 105, 8, 105);
    ctx.fillStyle = '#ffb052'; roundedRect(ctx, x - 14, y - 133, 28, 32, 5); ctx.fill();
    ctx.strokeStyle = '#241829'; ctx.lineWidth = 5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 20, y - 133); ctx.lineTo(x, y - 151); ctx.lineTo(x + 20, y - 133); ctx.stroke();
  }

  function drawGrave(x, y) {
    ctx.fillStyle = '#393747'; roundedRect(ctx, x - 28, y - 72, 56, 72, 22); ctx.fill();
    ctx.fillStyle = '#777282'; ctx.fillRect(x - 4, y - 54, 8, 35); ctx.fillRect(x - 15, y - 44, 30, 7);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 22, y - 8, 44, 8);
  }

  function drawPumpkin(x, y, secret) {
    if (secret && game.secretOpened) {
      ctx.strokeStyle = '#ff9b42'; ctx.lineWidth = 3; ctx.strokeRect(x - 35, y - 78, 70, 78);
      return;
    }
    ctx.fillStyle = secret ? '#7a3a47' : '#cc663e';
    ctx.beginPath(); ctx.ellipse(x, y - 25, 31, 25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f3944f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, y - 25, 15, 25, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#263c2f'; ctx.fillRect(x - 3, y - 58, 6, 13);
    ctx.fillStyle = '#ffd46a';
    ctx.beginPath(); ctx.moveTo(x - 16, y - 31); ctx.lineTo(x - 7, y - 37); ctx.lineTo(x - 5, y - 26); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 5, y - 26); ctx.lineTo(x + 7, y - 37); ctx.lineTo(x + 16, y - 31); ctx.fill();
    if (secret) { ctx.fillRect(x - 12, y - 17, 24, 3); }
  }

  function drawSign(x, y) {
    ctx.fillStyle = '#352233'; ctx.fillRect(x - 4, y - 90, 8, 90);
    ctx.fillStyle = '#5d3740'; roundedRect(ctx, x - 48, y - 108, 96, 39, 5); ctx.fill();
    ctx.fillStyle = '#f2c888'; ctx.font = '600 13px "DM Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillText('MANOR →', x, y - 83); ctx.textAlign = 'left';
  }

  function drawLoot() {
    for (const item of loot) {
      if (item.taken) continue;
      const y = item.y + Math.sin(game.time * 3 + item.bob) * 8;
      const glow = ctx.createRadialGradient(item.x, y, 2, item.x, y, 34);
      glow.addColorStop(0, item.type === 'gem' ? 'rgba(220,165,255,.4)' : 'rgba(255,176,87,.38)');
      glow.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = glow; ctx.fillRect(item.x - 38, y - 38, 76, 76);
      ctx.save(); ctx.translate(item.x, y); ctx.rotate(Math.sin(game.time * 2 + item.bob) * .08);
      if (item.type === 'gem') {
        ctx.fillStyle = '#dca5ff'; ctx.beginPath(); ctx.moveTo(0, -17); ctx.lineTo(15, -4); ctx.lineTo(9, 16); ctx.lineTo(-9, 16); ctx.lineTo(-15, -4); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fff0ff'; ctx.lineWidth = 2; ctx.stroke();
      } else if (item.type === 'coin' || item.type === 'moon') {
        ctx.fillStyle = item.type === 'moon' ? '#c8f560' : '#ffc05f'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8e513f'; ctx.font = 'bold 15px serif'; ctx.textAlign = 'center'; ctx.fillText(item.type === 'moon' ? '☾' : '₵', 0, 5); ctx.textAlign = 'left';
      } else {
        ctx.fillStyle = '#ff6978'; roundedRect(ctx, -15, -10, 30, 20, 7); ctx.fill();
        ctx.fillStyle = '#ffd272'; ctx.beginPath(); ctx.moveTo(-15,-7); ctx.lineTo(-25,-14); ctx.lineTo(-23,0); ctx.lineTo(-25,14); ctx.lineTo(-15,7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(15,-7); ctx.lineTo(25,-14); ctx.lineTo(23,0); ctx.lineTo(25,14); ctx.lineTo(15,7); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawEnemies() {
    for (const enemy of enemies) {
      const y = enemy.type === 'bat' ? enemy.y + Math.sin(enemy.phase * 3) * 28 : enemy.y;
      ctx.save(); ctx.translate(enemy.x, y);
      if (enemy.dir < 0) ctx.scale(-1, 1);
      ctx.globalAlpha = enemy.stunned > 0 ? .55 : 1;
      if (enemy.type === 'bat') drawBat(enemy);
      else drawRaccoon(enemy);
      ctx.restore();
      if (enemy.stunned > 0) {
        ctx.fillStyle = '#c8f560'; ctx.font = '18px serif';
        ctx.fillText('✦ z z', enemy.x - 20, y - 18);
      }
    }
  }

  function drawRaccoon(enemy) {
    if (enemy.stunned <= 0) {
      const cone = ctx.createLinearGradient(18, 18, 160, 30);
      cone.addColorStop(0, 'rgba(255,208,112,.18)'); cone.addColorStop(1, 'rgba(255,208,112,0)');
      ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(20, 12); ctx.lineTo(170, -22); ctx.lineTo(170, 62); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#4f4d5d'; ctx.beginPath(); ctx.ellipse(0, 34, 30, 25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#686777'; ctx.beginPath(); ctx.arc(10, 12, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2c2937';
    ctx.beginPath(); ctx.moveTo(-8,-2); ctx.lineTo(-2,-20); ctx.lineTo(8,0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(20,-3); ctx.lineTo(30,-19); ctx.lineTo(34,5); ctx.fill();
    ctx.beginPath(); ctx.ellipse(12, 11, 23, 11, -.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6da88'; ctx.beginPath(); ctx.arc(5, 9, 3.5, 0, Math.PI * 2); ctx.arc(20, 8, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#191520'; ctx.beginPath(); ctx.arc(31, 17, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b2835'; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-24, 34); ctx.quadraticCurveTo(-55, 23, -60, 43); ctx.stroke();
    ctx.strokeStyle = '#888493'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-41, 30); ctx.lineTo(-45, 44); ctx.moveTo(-54, 34); ctx.lineTo(-56, 42); ctx.stroke();
    ctx.fillStyle = '#b36654'; ctx.fillRect(-13, 46, 47, 8);
  }

  function drawBat() {
    ctx.fillStyle = '#17111f';
    ctx.beginPath(); ctx.moveTo(0,8); ctx.quadraticCurveTo(-28,-22,-45,-2); ctx.quadraticCurveTo(-27,-5,-24,19); ctx.quadraticCurveTo(-10,7,0,17); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0,8); ctx.quadraticCurveTo(28,-22,45,-2); ctx.quadraticCurveTo(27,-5,24,19); ctx.quadraticCurveTo(10,7,0,17); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5e4770'; ctx.beginPath(); ctx.ellipse(0, 10, 14, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c8f560'; ctx.beginPath(); ctx.arc(-5, 6, 2, 0, Math.PI * 2); ctx.arc(5, 6, 2, 0, Math.PI * 2); ctx.fill();
  }

  function drawPlayer() {
    if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2) return;
    const image = assets[player.anim];
    ctx.save();
    const centerX = player.x + player.w / 2;
    const centerY = player.y + player.h / 2;
    ctx.translate(centerX, centerY);
    if (player.facing < 0) ctx.scale(-1, 1);
    if (image?.complete && image.naturalWidth) {
      const fw = image.naturalWidth / 7;
      const fh = image.naturalHeight;
      const size = 126;
      ctx.drawImage(image, player.frame * fw, 0, fw, fh, -size * .53, -size * .6, size, size);
    } else {
      drawFallbackCat();
    }
    if (player.dashCooldown <= 0 && game.mode === 'playing') {
      ctx.fillStyle = '#c8f560'; ctx.beginPath(); ctx.arc(-2, -44, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawFallbackCat() {
    ctx.fillStyle = '#4b4a59'; ctx.beginPath(); ctx.ellipse(0, 10, 30, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(18, -12, 22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4,-25); ctx.lineTo(8,-48); ctx.lineTo(19,-30); ctx.moveTo(25,-31); ctx.lineTo(37,-47); ctx.lineTo(39,-20); ctx.fill();
    ctx.fillStyle = '#c8f560'; ctx.beginPath(); ctx.arc(13,-13,4,0,Math.PI*2); ctx.arc(28,-13,4,0,Math.PI*2); ctx.fill();
  }

  function drawGhost() {
    const gx = player.x - player.facing * 75 + Math.sin(game.time * 2.1) * 12;
    const gy = player.y - 18 + Math.sin(game.time * 3) * 8;
    ctx.save(); ctx.globalAlpha = .52; ctx.translate(gx, gy);
    ctx.fillStyle = '#c7eff2';
    ctx.beginPath(); ctx.arc(0, 0, 18, Math.PI, 0); ctx.lineTo(18, 25); ctx.lineTo(9, 18); ctx.lineTo(0, 25); ctx.lineTo(-9, 18); ctx.lineTo(-18,25); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#35294a'; ctx.beginPath(); ctx.arc(-6,-1,2.5,0,Math.PI*2); ctx.arc(6,-1,2.5,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawVault() {
    const x = 7190;
    ctx.save(); ctx.translate(x, 590);
    const open = game.loot >= REQUIRED_LOOT;
    const glow = ctx.createRadialGradient(0, -88, 5, 0, -88, 115);
    glow.addColorStop(0, open ? 'rgba(200,245,96,.35)' : 'rgba(255,155,66,.2)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(-120, -210, 240, 210);
    ctx.fillStyle = '#18121f'; roundedRect(ctx, -58, -156, 116, 156, 55); ctx.fill();
    ctx.strokeStyle = open ? '#c8f560' : '#9a718b'; ctx.lineWidth = 8; ctx.stroke();
    ctx.fillStyle = open ? '#c8f560' : '#ff9b42'; ctx.font = '44px serif'; ctx.textAlign = 'center'; ctx.fillText(open ? '☾' : '♙', 0, -77); ctx.textAlign = 'left';
    if (open) {
      ctx.fillStyle = 'rgba(200,245,96,.6)'; ctx.fillRect(-4, -150, 8, 145);
    }
    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min(.033, Math.max(.001, (now - game.lastTime) / 1000));
    game.lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function bindControls() {
    const codes = {
      ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
      ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', ShiftLeft: 'dash', ShiftRight: 'dash', KeyK: 'dash'
    };
    addEventListener('keydown', event => {
      if (game.mode === 'title' && ['Enter', 'Space'].includes(event.code)) { event.preventDefault(); beginGame(); return; }
      const action = codes[event.code];
      if (!action) return;
      event.preventDefault();
      if (action === 'jump' && !input.jump) input.jumpPressed = true;
      if (action === 'dash' && !input.dash) input.dashPressed = true;
      input[action] = true;
    });
    addEventListener('keyup', event => {
      const action = codes[event.code];
      if (action) input[action] = false;
    });
    addEventListener('blur', clearInput);

    document.querySelectorAll('[data-control]').forEach(button => {
      const action = button.dataset.control;
      const press = event => {
        event.preventDefault();
        if (action === 'jump' && !input.jump) input.jumpPressed = true;
        if (action === 'dash' && !input.dash) input.dashPressed = true;
        input[action] = true;
        button.classList.add('is-pressed');
        button.setPointerCapture?.(event.pointerId);
      };
      const release = event => {
        event.preventDefault();
        input[action] = false;
        button.classList.remove('is-pressed');
      };
      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    });
  }

  function clearInput() {
    for (const key of Object.keys(input)) input[key] = false;
    document.querySelectorAll('.is-pressed').forEach(button => button.classList.remove('is-pressed'));
  }

  function ensureAudio() {
    if (!game.sound) return;
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
  }

  function blip(frequency, duration, type = 'sine', volume = .03) {
    if (!game.sound) return;
    ensureAudio();
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(); osc.stop(audioContext.currentTime + duration);
  }

  function chord(notes) {
    notes.forEach((note, i) => setTimeout(() => blip(note, .18, 'triangle', .035), i * 90));
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function approach(value, target, amount) { return value < target ? Math.min(value + amount, target) : Math.max(value - amount, target); }

  function roundedRect(context, x, y, w, h, radius) {
    const r = Math.min(radius, Math.abs(w) / 2, Math.abs(h) / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }

  ui.start.addEventListener('click', beginGame);
  ui.restart.addEventListener('click', beginGame);
  ui.sound.addEventListener('click', () => {
    game.sound = !game.sound;
    ui.sound.textContent = game.sound ? 'Sound on' : 'Sound off';
    ui.sound.setAttribute('aria-pressed', String(game.sound));
    if (game.sound) blip(440, .08, 'sine', .03);
  });
  document.addEventListener('visibilitychange', () => { game.lastTime = performance.now(); clearInput(); });

  loadAssets();
  resetGame();
  bindControls();
  requestAnimationFrame(loop);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
