import { useEffect, useRef } from 'react';

export default function TruchetFlowBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduceMotionQuery = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : { matches: false };

    const TILE = 56;
    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let tiles = [];
    let resizeTimer = null;

    function shouldSkipDraw() {
      return window.innerWidth < 768 || reduceMotionQuery.matches;
    }

    function drawStaticPattern() {
      if (shouldSkipDraw()) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

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

      // Deterministic pseudo-random tile layout so resize doesn't flicker
      tiles = Array.from({ length: cols * rows }, (_, idx) => {
        const s = Math.sin((idx + 1) * 12.9898) * 43758.5453;
        return s - Math.floor(s) < 0.5 ? 0 : 1;
      });

      ctx.clearRect(0, 0, w, h);
      const r = TILE / 2;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.setLineDash([TILE * 0.35, TILE * 0.45]);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * TILE;
          const py = y * TILE;
          const alpha = 0.055 + 0.025 * Math.sin((x + y) * 0.35);
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

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        drawStaticPattern();
      }, 200);
    }

    drawStaticPattern();
    window.addEventListener('resize', onResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="bg-truchet-flow-root hidden md:block" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
