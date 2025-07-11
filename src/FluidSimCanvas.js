import React, { useRef, useEffect } from 'react';
import { updateSimulation, initMolecules } from './FluidSimEngine';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const FluidSimCanvas = ({ mode, params }) => {
  const canvasRef = useRef(null);
  const molecules = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    molecules.current = initMolecules(1000);

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      updateSimulation(molecules.current, mode, params);

      for (const m of molecules.current) {
        ctx.beginPath();
        ctx.arc(m.x, m.y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(0, 150, 255, ${m.energy})`;
        ctx.fill();
      }
      requestAnimationFrame(render);
    };

    render();
  }, [mode, params]);

  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-auto" />;
};

export default FluidSimCanvas;