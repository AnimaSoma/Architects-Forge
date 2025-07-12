import React, { useRef, useEffect, useState, useCallback } from "react";

export default function ProjectFluctusSim({ style }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const pointerRef = useRef({ x: 0, y: 0 });
  const activeRef = useRef(false);
  const fpsRef = useRef({ value: 60, lastTime: 0, frames: 0 });
  const deviceTypeRef = useRef('desktop');
  
  /* ------------------------------------------------------------------ */
  /* Temperature state: 0 = freezing, 100 = boiling                      */
  /* ------------------------------------------------------------------ */
  const [temperature, setTemperature] = useState(50); // default mid-range
  /* keep latest temperature accessible inside animation loop */
  const temperatureRef = useRef(temperature);

  // Detect device type for performance optimization
  useEffect(() => {
    const detectDeviceType = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                      window.innerWidth < 768 ||
                      ('ontouchstart' in window);
      deviceTypeRef.current = isMobile ? 'mobile' : 'desktop';
    };
    
    detectDeviceType();
    window.addEventListener('resize', detectDeviceType);
    
    return () => window.removeEventListener('resize', detectDeviceType);
  }, []);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        // Use clientHeight for container height, but ensure minimum height
        const height = Math.max(containerRef.current.clientHeight, 400);
        setDimensions({ width, height });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle pointer events (both mouse and touch)
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    const updatePointerPosition = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    // Mouse event handlers
    const handleMouseMove = (e) => {
      updatePointerPosition(e.clientX, e.clientY);
    };

    const handleMouseEnter = () => {
      activeRef.current = true;
    };

    const handleMouseLeave = () => {
      activeRef.current = false;
    };

    // Touch event handlers
    const handleTouchStart = (e) => {
      e.preventDefault(); // Prevent scrolling when touching the canvas
      activeRef.current = true;
      if (e.touches.length > 0) {
        updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault(); // Prevent scrolling when touching the canvas
      if (e.touches.length > 0) {
        updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      activeRef.current = false;
    };

    // Click/tap handler to reset particles
    const handlePointerDown = () => {
      // Reset all particles to high coherence on click/tap
      particlesRef.current.forEach(p => {
        p.coherence = 1.0;
      });
    };

    // Add event listeners
    canvas.addEventListener('mousemove', handleMouseMove, { passive: true });
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mousedown', handlePointerDown);
    
    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      // Remove event listeners
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('mousedown', handlePointerDown);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  // Calculate particle count based on device and performance
  const getOptimalParticleCount = useCallback(() => {
    const baseCount = deviceTypeRef.current === 'mobile' ? 100 : 300;
    const fps = fpsRef.current.value;
    
    // Adjust particle count based on FPS
    if (fps < 30) {
      return Math.max(50, baseCount * 0.5); // Reduce by 50% if FPS is low
    } else if (fps < 45) {
      return Math.max(75, baseCount * 0.75); // Reduce by 25% if FPS is medium
    }
    
    return baseCount;
  }, []);

  // Initialize particles and animation
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Create particles - dynamically adjust count based on device
    const numParticles = Math.floor(getOptimalParticleCount());
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
    const animate = (timestamp) => {
      // FPS calculation for performance monitoring
      if (!fpsRef.current.lastTime) {
        fpsRef.current.lastTime = timestamp;
        fpsRef.current.frames = 0;
      }
      
      fpsRef.current.frames++;
      const elapsed = timestamp - fpsRef.current.lastTime;
      
      if (elapsed >= 1000) {
        fpsRef.current.value = Math.round((fpsRef.current.frames * 1000) / elapsed);
        fpsRef.current.lastTime = timestamp;
        fpsRef.current.frames = 0;
      }

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
      // Optimize by reducing connection checks on mobile
      const connectionCheckStep = deviceTypeRef.current === 'mobile' ? 2 : 1;
      
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + connectionCheckStep; j < particles.length; j += connectionCheckStep) {
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
        
        // Apply pointer influence if active
        if (activeRef.current) {
          const dx = p.x - pointerRef.current.x;
          const dy = p.y - pointerRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Increase influence radius on mobile for easier interaction
          const influenceRadius = deviceTypeRef.current === 'mobile' ? 200 : 150;
          
          if (distance < influenceRadius) {
            // Repel from pointer
            const force = 0.2 * (1 - distance / influenceRadius);
            p.vx += dx / distance * force;
            p.vy += dy / distance * force;
            
            // Decrease coherence near pointer
            p.coherence = Math.max(0.1, p.coherence - 0.01);
          } else {
            // Slowly recover coherence
            p.coherence = Math.min(1.0, p.coherence + 0.002);
          }
        } else {
          // Recover coherence when pointer is not active
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
        
        // Draw connections - limit on mobile for performance
        const maxConnections = deviceTypeRef.current === 'mobile' ? 3 : p.connections.length;
        p.connections.slice(0, maxConnections).forEach(other => {
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

      // Display stats - adjust font size for mobile
      const fontSize = deviceTypeRef.current === 'mobile' ? 12 : 14;
      ctx.fillStyle = 'white';
      ctx.font = `${fontSize}px Arial`;
      ctx.textAlign = 'left';
      ctx.fillText(`Project Fluctus`, 20, 30);
      ctx.fillText(`Particles: ${particles.length}`, 20, 50);
      ctx.fillText(`Avg. Coherence: ${(totalCoherence / particles.length).toFixed(2)}`, 20, 70);
      ctx.fillText(`Temp: ${temp}°C`, 20, 90);
      
      // Adjust instructions based on device type
      if (deviceTypeRef.current === 'mobile') {
        ctx.fillText(`Touch = Disrupt`, 20, 110);
        ctx.fillText(`Tap = Restore`, 20, 130);
      } else {
        ctx.fillText(`Move mouse = Disrupt`, 20, 110);
        ctx.fillText(`Click = Restore`, 20, 130);
      }
      
      // Display FPS in debug mode (uncomment if needed)
      // ctx.fillText(`FPS: ${fpsRef.current.value}`, 20, 150);

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, getOptimalParticleCount]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full min-h-[400px]" 
      style={{ backgroundColor: "black", overflow: "hidden", ...style }}
    >
      {/* ---------------- Temperature Slider Overlay ---------------- */}
      <div
        className="absolute top-4 right-4 z-30 flex flex-col items-center bg-black/30 p-3 rounded-lg backdrop-blur-sm text-white select-none"
        style={{ pointerEvents: "auto" }}
      >
        <label htmlFor="tempRange" className="mb-2 text-sm md:text-base font-medium">
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
          /* Mobile-friendly slider with larger touch target */
          className="w-32 md:w-40 appearance-none h-2 md:h-3 rounded-lg outline-none bg-gradient-to-r from-blue-500 to-red-600 cursor-pointer touch-manipulation"
          style={{
            // Custom slider styling for better touch targets
            WebkitAppearance: 'none',
            margin: '10px 0',
          }}
        />
        <style jsx>{`
          /* Larger thumb for touch devices */
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: 2px solid rgba(255,255,255,0.5);
            box-shadow: 0 0 5px rgba(0,0,0,0.5);
          }
          
          input[type=range]::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: 2px solid rgba(255,255,255,0.5);
            box-shadow: 0 0 5px rgba(0,0,0,0.5);
          }
        `}</style>
        <div className="w-full flex justify-between text-[10px] md:text-xs mt-1">
          <span>Freezing</span>
          <span>Liquid</span>
          <span>Boiling</span>
        </div>
      </div>
      
      {/* Mobile instruction overlay */}
      <div className="md:hidden absolute bottom-4 left-4 z-30 bg-black/50 text-white text-xs p-2 rounded">
        Touch to disrupt molecules<br/>
        Tap to restore order
      </div>
      
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full touch-manipulation"
      />
    </div>
  );
}
