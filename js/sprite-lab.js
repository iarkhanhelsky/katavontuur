(() => {
  'use strict';

  const CELL = 192;
  const ANCHOR_X = 104;
  const FOOT_Y = 178;
  const animations = {
    idle: { frames: 7, fps: 7 },
    walk: { frames: 7, fps: 10 },
    run: { frames: 7, fps: 12 },
    jump: { frames: 7, fps: 9 },
    attack: { frames: 3, fps: 12 }
  };

  const stage = document.querySelector('#stage');
  const strip = document.querySelector('#strip');
  const ctx = stage.getContext('2d');
  const stripCtx = strip.getContext('2d');
  const ui = {
    animation: document.querySelector('#animation'),
    previous: document.querySelector('#previous'),
    play: document.querySelector('#play'),
    next: document.querySelector('#next'),
    onion: document.querySelector('#onion'),
    guides: document.querySelector('#guides'),
    fps: document.querySelector('#fps'),
    fpsValue: document.querySelector('#fpsValue'),
    readout: document.querySelector('#readout')
  };

  const images = {};
  let current = 'idle';
  let frame = 0;
  let playing = true;
  let lastStep = performance.now();

  for (const name of Object.keys(animations)) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name[0].toUpperCase() + name.slice(1);
    ui.animation.append(option);
    const image = new Image();
    image.src = `assets/animations/cat4/${name}.png`;
    images[name] = image;
  }

  function drawChecker(context, width, height) {
    context.fillStyle = '#171224';
    context.fillRect(0, 0, width, height);
    context.fillStyle = 'rgba(255,255,255,.025)';
    const size = 32;
    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        if ((x / size + y / size) % 2) context.fillRect(x, y, size, size);
      }
    }
  }

  function drawFrame(context, name, index, anchorX, baseline, scale, alpha = 1) {
    const image = images[name];
    if (!image.complete || !image.naturalWidth) return;
    context.save();
    context.globalAlpha = alpha;
    context.drawImage(
      image,
      index * CELL, 0, CELL, CELL,
      anchorX - ANCHOR_X * scale,
      baseline - FOOT_Y * scale,
      CELL * scale,
      CELL * scale
    );
    context.restore();
  }

  function drawStage() {
    drawChecker(ctx, stage.width, stage.height);
    const centerX = stage.width / 2;
    const baseline = 430;
    const scale = 2.05;

    if (ui.onion.checked) {
      const count = animations[current].frames;
      drawFrame(ctx, current, (frame + count - 1) % count, centerX, baseline, scale, .12);
      drawFrame(ctx, current, (frame + 1) % count, centerX, baseline, scale, .12);
    }
    drawFrame(ctx, current, frame, centerX, baseline, scale);

    if (ui.guides.checked) {
      ctx.save();
      ctx.strokeStyle = '#c8f560';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(70, baseline + 1);
      ctx.lineTo(stage.width - 70, baseline + 1);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,176,87,.75)';
      ctx.beginPath();
      ctx.moveTo(centerX, 70);
      ctx.lineTo(centerX, baseline + 30);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = '#f8ecdc';
    ctx.font = '700 24px "DM Mono", monospace';
    ctx.fillText(`${current.toUpperCase()} · ${frame + 1}/${animations[current].frames}`, 28, 42);
  }

  function drawStrip() {
    drawChecker(stripCtx, strip.width, strip.height);
    const count = animations[current].frames;
    const slot = strip.width / count;
    const scale = Math.min(.72, slot / CELL * .9);
    const baseline = 166;
    for (let index = 0; index < count; index++) {
      if (index === frame) {
        stripCtx.fillStyle = 'rgba(200,245,96,.1)';
        stripCtx.fillRect(index * slot + 3, 3, slot - 6, strip.height - 6);
      }
      drawFrame(stripCtx, current, index, index * slot + slot / 2, baseline, scale, index === frame ? 1 : .58);
      stripCtx.fillStyle = index === frame ? '#c8f560' : '#988aa8';
      stripCtx.font = '13px "DM Mono", monospace';
      stripCtx.fillText(String(index + 1), index * slot + 10, 22);
    }
  }

  function render() {
    drawStage();
    drawStrip();
    ui.readout.textContent = `${current} · frame ${frame + 1}/${animations[current].frames} · ${ui.fps.value} FPS · anchor (${ANCHOR_X}, ${FOOT_Y})`;
  }

  function setFrame(next) {
    const count = animations[current].frames;
    frame = (next + count) % count;
    lastStep = performance.now();
    render();
  }

  ui.animation.addEventListener('change', () => {
    current = ui.animation.value;
    frame = 0;
    ui.fps.value = animations[current].fps;
    ui.fpsValue.textContent = ui.fps.value;
    render();
  });
  ui.previous.addEventListener('click', () => { playing = false; ui.play.textContent = 'Play'; setFrame(frame - 1); });
  ui.next.addEventListener('click', () => { playing = false; ui.play.textContent = 'Play'; setFrame(frame + 1); });
  ui.play.addEventListener('click', () => { playing = !playing; ui.play.textContent = playing ? 'Pause' : 'Play'; lastStep = performance.now(); });
  ui.onion.addEventListener('change', render);
  ui.guides.addEventListener('change', render);
  ui.fps.addEventListener('input', () => { ui.fpsValue.textContent = ui.fps.value; render(); });
  strip.addEventListener('pointerdown', event => {
    const rect = strip.getBoundingClientRect();
    const index = Math.floor((event.clientX - rect.left) / rect.width * animations[current].frames);
    playing = false;
    ui.play.textContent = 'Play';
    setFrame(index);
  });

  function loop(now) {
    if (playing && now - lastStep >= 1000 / Number(ui.fps.value)) setFrame(frame + 1);
    requestAnimationFrame(loop);
  }

  Promise.all(Object.values(images).map(image => image.decode())).then(() => {
    render();
    requestAnimationFrame(loop);
  }).catch(error => { ui.readout.textContent = `Sprite load failed: ${error.message}`; });
})();
