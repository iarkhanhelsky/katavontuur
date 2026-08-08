(() => {
  'use strict';

  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const titleScreen = document.querySelector('#title-screen');
  const startButton = document.querySelector('#start-button');
  const toast = document.querySelector('#toast');
  const motes = Array.from({ length: 34 }, (_, i) => ({
    x: (i * 317) % canvas.width,
    y: (i * 191) % canvas.height,
    size: 1 + (i % 3),
    phase: i * 0.71
  }));

  function paintBackdrop(time = 0) {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#110b25');
    sky.addColorStop(0.56, '#342052');
    sky.addColorStop(1, '#100a19');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const mote of motes) {
      const glow = 0.25 + Math.sin(time * 0.0015 + mote.phase) * 0.2;
      ctx.fillStyle = `rgba(255, 202, 120, ${glow})`;
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(paintBackdrop);
  }

  function previewMessage() {
    toast.textContent = 'The getaway cart is almost ready…';
    toast.classList.add('toast--visible');
    window.setTimeout(() => toast.classList.remove('toast--visible'), 1800);
  }

  startButton.addEventListener('click', previewMessage);
  window.addEventListener('keydown', (event) => {
    if (titleScreen.classList.contains('screen--visible') && ['Enter', 'Space'].includes(event.code)) {
      event.preventDefault();
      previewMessage();
    }
  });

  requestAnimationFrame(paintBackdrop);
})();
