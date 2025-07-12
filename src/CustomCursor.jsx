import React, { useEffect, useRef } from 'react';

// A simple magnetic cursor dot + trailing aura inspired by Lusion sites.
// Uses CSS blend-mode difference so it inverts underlying colors.
export default function CustomCursor() {
  /* Detect coarse-pointer / touch devices early */
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches);

  /* If on a touch device, don't render custom cursor at all  */
  if (isTouchDevice) return null;

  const dotRef = useRef(null);
  const auraRef = useRef(null);
  const energyRef = useRef(0);          // ISRM-like energy tank
  const lastPosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const rafIdRef = useRef(null);        // track rAF id for cleanup

  useEffect(() => {
    const dot = dotRef.current;
    const aura = auraRef.current;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;

    const handleMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      /* accumulate energy based on move distance */
      const { x: lx, y: ly } = lastPosRef.current;
      const dist = Math.hypot(x - lx, y - ly);
      energyRef.current = Math.min(100, energyRef.current + dist * 0.05);
      lastPosRef.current = { x, y };

      // show on first move
      dot.style.opacity = 1;
      aura.style.opacity = 0.4;
    };

    const createRipple = (ex, ey, magnitude) => {
      const r = document.createElement('div');
      r.className = 'cursor-ripple';
      const size = 20 + magnitude * 0.8; // scale ripple to energy
      r.style.width = `${size}px`;
      r.style.height = `${size}px`;
      r.style.left = `${ex - size / 2}px`;
      r.style.top = `${ey - size / 2}px`;
      document.body.appendChild(r);
      r.addEventListener('animationend', () => r.remove());
    };

    let prevEnergy = 0;
    const render = () => {
      // lerp aura for trailing effect
      tx += (x - tx) * 0.1;
      ty += (y - ty) * 0.1;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      aura.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;

      /* energy decay & visual mapping */
      energyRef.current *= 0.97;                // slow decay
      const e = energyRef.current;
      aura.style.opacity = 0.2 + e / 500;       // 0.2 → 0.4 @ e=100

      // trigger ripple when energy crosses threshold upward
      if (e > 40 && prevEnergy <= 40) {
        createRipple(x, y, e);
      }
      prevEnergy = e;

      rafIdRef.current = requestAnimationFrame(render);
    };

    /* Attach listeners & kick off loop */
    window.addEventListener('mousemove', handleMove, { passive: true });
    rafIdRef.current = requestAnimationFrame(render);

    /* ----------  Cleanup on unmount  ---------- */
    return () => {
      window.removeEventListener('mousemove', handleMove, { passive: true });
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return (
    <>
      <div ref={auraRef} className="cursor-aura" />
      <div ref={dotRef} className="cursor-dot" />
    </>
  );
}
