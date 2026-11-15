import { useEffect, useRef } from 'react';

export default function TruchetFlowBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const TILE = 56;
    let w = 0, h = 0, cols = 0, rows = 0, tiles = [];
    let rafId = null, last = 0, t = 0, resizeTimer = null;

    function setup() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / TILE) + 1;
      rows = Math.ceil(h / TILE) + 1;
      tiles = Array.from({ length: cols * rows }, () => (Math.random() < 0.5 ? 0 : 1));
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const r = TILE / 2;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.setLineDash([TILE * 0.35, TILE * 0.45]);
      ctx.lineDashOffset = -t * 18;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * TILE, py = y * TILE;
          const alpha = 0.06 + 0.05 * Math.sin(t * 0.6 + (x + y) * 0.35);
          ctx.strokeStyle = `rgba(15, 76, 129, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          if (tiles[y * cols + x] === 0) {
            ctx.moveTo(px + r, py);
            ctx.arc(px, py, r, 0, Math.PI / 2);
            ctx.moveTo(px + TILE - r, py + TILE);
            ctx.arc(px + TILE, py + TILE, r, Math.PI, Math.PI * 1.5);
          } else {
            ctx.moveTo(px + TILE, py + r);
            ctx.arc(px + TILE, py, r, Math.PI / 2, Math.PI);
            ctx.moveTo(px, py + TILE - r);
            ctx.arc(px, py + TILE, r, Math.PI * 1.5, Math.PI * 2);
          }
          ctx.stroke();
        }
      }
    }

    function loop(now) {
      rafId = requestAnimationFrame(loop);
      if (now - last < 1000 / 30) return; // cap at 30 fps
      t += (now - last) / 1000 || 0;
      last = now;
      draw();
    }

    function start() {
      if (reduceMotion || rafId) return;
      last = performance.now();
      rafId = requestAnimationFrame(loop);
    }

    function stop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { setup(); draw(); }, 150);
    }

    setup();
    draw();
    start();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="bg-truchet-flow-root" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
