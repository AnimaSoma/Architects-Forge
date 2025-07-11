import React, { useRef, useEffect, useState } from "react";
import p5 from "p5";
export default function ProjectFluctusSim({ style }) {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const activeRef = useRef(false);
  /* ------------------------------------------------------------------ */
  /* Temperature state: 0 = freezing, 100 = boiling                      */
  /* ------------------------------------------------------------------ */
  const [temperature, setTemperature] = useState(50); // default mid-range
  /* keep latest temperature accessible inside animation loop */
  const temperatureRef = useRef(temperature);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;
        setDimensions({ width, height });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }
    };

    const handleMouseEnter = () => {
      activeRef.current = true;
    };

    const handleMouseLeave = () => {
      activeRef.current = false;
    };

    const handleClick = () => {
      // Reset all particles to high coherence on click
      particlesRef.current.forEach(p => {
        p.coherence = 1.0;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mouseenter', handleMouseEnter);
      canvas.addEventListener('mouseleave', handleMouseLeave);
      canvas.addEventListener('click', handleClick);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (canvas) {
        canvas.removeEventListener('mouseenter', handleMouseEnter);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
        canvas.removeEventListener('click', handleClick);
      }
    };
  }, []);

  // Initialize particles and animation
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Create particles
    const numParticles = 300;
    particlesRef.current = Array.from({ length: numParticles }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: Math.random() * 3 + 2,
      coherence: Math.random() * 0.5 + 0.5, // Start with medium-high coherence
      connections: [],
      angle: Math.random() * Math.PI * 2,
      angVel: (Math.random() - 0.5) * 0.02 // rotation speed
    }));

    // Animation function
    const animate = () => {
      // read latest temperature from ref (updated by slider onChange)
      const temp = temperatureRef.current;

      /* -------- background trail tint varies with temperature -------- */
      const r = Math.round(temp * 2.55);       // red 0-255
      const b = Math.round(255 - temp * 2.55); // blue 255-0
      ctx.fillStyle = `rgba(${r},0,${b},0.08)`;       // subtle tint
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      const particles = particlesRef.current;
      let totalCoherence = 0;

      // Clear connections
      particles.forEach(p => {
        p.connections = [];
      });

      // Find connections (do this first to avoid frame lag)
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          /* Connection distance decreases as temperature rises */
          const connDist = 100 - (temp / 100) * 50; // 100→50
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connDist && p1.coherence > 0.7 && p2.coherence > 0.7) {
            p1.connections.push(p2);
            p2.connections.push(p1);
          }
        }
      }

      // Update and draw
      particles.forEach(p => {
        // Temperature-driven random movement
        const speedFactor = 0.2 + (temp / 100) * 2; // 0.2→2.2
        p.vx += (Math.random() - 0.5) * 0.1 * speedFactor;
        p.vy += (Math.random() - 0.5) * 0.1 * speedFactor;
        
        // Apply mouse influence if active
        if (activeRef.current) {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            // Repel from mouse
            const force = 0.2 * (1 - distance / 150);
            p.vx += dx / distance * force;
            p.vy += dy / distance * force;
            
            // Decrease coherence near mouse
            p.coherence = Math.max(0.1, p.coherence - 0.01);
          } else {
            // Slowly recover coherence
            p.coherence = Math.min(1.0, p.coherence + 0.002);
          }
        } else {
          // Recover coherence when mouse is not active
          p.coherence = Math.min(1.0, p.coherence + 0.001);
        }
        
        // Limit velocity
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        /* Velocity cap scales with temperature (faster when hot) */
        const maxSpeed = 3 * speedFactor;
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed;
          p.vy = (p.vy / speed) * maxSpeed;
        }
        
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        
        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        
        // Draw connections
        p.connections.forEach(other => {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(120, 180, 255, ${p.coherence * 0.2})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        });
        
        /* ---------- Render as water molecule (O + 2 H) ---------- */
        // update rotation
        p.angle += p.angVel;
        const bondLen = p.radius * 3.2;           // distance from O to each H
        const halfBondAngle = 1.824 / 2;          // ≈104.5° -> 1.824 rad

        // positions of hydrogens
        const hx1 = p.x + bondLen * Math.cos(p.angle - halfBondAngle);
        const hy1 = p.y + bondLen * Math.sin(p.angle - halfBondAngle);
        const hx2 = p.x + bondLen * Math.cos(p.angle + halfBondAngle);
        const hy2 = p.y + bondLen * Math.sin(p.angle + halfBondAngle);

        // bonds (opacity scales with coherence)
        ctx.strokeStyle = `rgba(200, 200, 255, ${p.coherence})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(hx1, hy1);
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(hx2, hy2);
        ctx.stroke();

        // draw oxygen (blue)
        ctx.fillStyle = `hsl(200, 80%, ${40 + p.coherence * 40}%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // draw hydrogens (white)
        ctx.fillStyle = `rgba(255,255,255,${0.8 + p.coherence * 0.2})`;
        ctx.beginPath();
        ctx.arc(hx1, hy1, p.radius, 0, Math.PI * 2);
        ctx.arc(hx2, hy2, p.radius, 0, Math.PI * 2);
        ctx.fill();
        
        totalCoherence += p.coherence;
      });

      // Display stats
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Project Fluctus`, 20, 30);
      ctx.fillText(`Particles: ${numParticles}`, 20, 50);
      ctx.fillText(`Avg. Coherence: ${(totalCoherence / numParticles).toFixed(2)}`, 20, 70);
      ctx.fillText(`Temp: ${temp}°C`, 20, 90);
      ctx.fillText(`Move mouse = Disrupt`, 20, 100);
      ctx.fillText(`Click = Restore`, 20, 120);

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions]);

  return (
    <div 
      className="relative w-full h-full min-h-[600px]" 
      style={{ backgroundColor: "black", overflow: "hidden", ...style }}
    >
      {/* ---------------- Temperature Slider Overlay ---------------- */}
      <div
        className="absolute top-4 right-4 z-30 flex flex-col items-center text-white text-xs select-none"
        style={{ pointerEvents: "auto" }}
      >
        <label htmlFor="tempRange" className="mb-1">
          Temperature: {temperature}°C
        </label>
        <input
          id="tempRange"
          type="range"
          min={0}
          max={100}
          value={temperature}
          onChange={(e) => {
            const t = parseInt(e.target.value, 10);
            setTemperature(t);
            temperatureRef.current = t;          // keep ref in sync
          }}
          /* Tailwind gradient track, full-width thumb */
          className="w-24 appearance-none h-1 rounded-lg outline-none bg-gradient-to-r from-blue-500 to-red-600 cursor-pointer"
        />
        <div className="w-40 flex justify-between text-[10px] mt-1">
          <span>Freezing</span>
          <span>Liquid</span>
          <span>Boiling</span>
        </div>
      </div>
      <canvas 
        ref={canvasRef} 
        style={{ display: 'block', width: '100%', height: '25%' }}
      />
    </div>
  );
}
