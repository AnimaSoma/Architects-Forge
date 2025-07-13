import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * NetworkVisualWithAnimation Component
 * 
 * A simplified network visualization with forced animation effects.
 * This component prioritizes visible animation over complex simulation logic.
 * Mobile-optimized with responsive design and touch support.
 */

// Inline CSS with keyframe animations
const AnimationStyles = () => (
  <style
    dangerouslySetInnerHTML={{
      __html: `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1); opacity: 0.7; }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }
      
      @keyframes colorShift {
        0% { fill: rgba(59, 130, 246, 0.7); }
        50% { fill: rgba(239, 68, 68, 0.7); }
        100% { fill: rgba(59, 130, 246, 0.7); }
      }
      
      @keyframes flashConnection {
        0% { stroke-width: 1; stroke-opacity: 0.2; }
        50% { stroke-width: 4; stroke-opacity: 0.8; }
        100% { stroke-width: 1; stroke-opacity: 0.2; }
      }
      
      .node-pulse {
        animation: pulse 4s infinite;
      }
      
      .node-float {
        animation: float 6s infinite ease-in-out;
      }
      
      .node-color-shift {
        animation: colorShift 10s infinite;
      }
      
      .connection-flash {
        animation: flashConnection 6s infinite;
      }
      
      .spin-slow {
        animation: spin 40s infinite linear;
      }
      
      .physical-system {
        transition: all 0.5s;
      }
      
      .observer-system {
        transition: all 0.3s;
      }
      
      .consensus-flash {
        animation: pulse 1s infinite;
      }

      /* Reduced animations for mobile devices */
      @media (max-width: 768px) {
        .spin-slow {
          animation-duration: 60s; /* Even slower spin on mobile */
        }
        
        .node-float {
          animation-duration: 8s; /* Slower float on mobile */
        }
        
        .connection-flash {
          animation-duration: 8s; /* Slower flash on mobile */
        }
      }
      `,
    }}
  />
);

const NetworkVisualWithAnimation = () => {
  // Device detection
  const [isMobile, setIsMobile] = useState(false);
  
  // Animation frame counter - visibly increments to show activity
  const [frameCount, setFrameCount] = useState(0);
  
  // Performance monitoring
  const [fps, setFps] = useState(60);
  const fpsRef = useRef({ value: 60, frames: 0, lastTime: 0 });
  
  // Simple simulation state
  const [simState, setState] = useState({
    running: false,
    observerValue: 0.5,
    physicalSystems: [],
    thresholdMet: false,
    updateTriggered: false,
    demoMode: false, // Special mode that runs animations without complex simulation
    performanceMode: false, // Automatically enabled on low-performance devices
    // Threshold for OS update (as percentage of PS nodes)
    updateThreshold: 0.5
  });
  
  // Time tracking
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Animation references
  const animationRef = useRef(null);
  const observerSystemRef = useRef(null);
  const nodeRefs = useRef([]);
  const connectionRefs = useRef([]);
  const containerRef = useRef(null);
  
  // Node count (simplified parameter) - reduce on mobile
  const nodeCount = isMobile ? 4 : 6;
  
  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                    window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Enable performance mode on mobile by default
      if (mobile && !simState.performanceMode) {
        setState(prev => ({ ...prev, performanceMode: true }));
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [simState.performanceMode]);
  
  // Initialize physical system nodes
  const initializeNodes = useCallback(() => {
    const physicalSystems = [];
    
    for (let i = 0; i < nodeCount; i++) {
      physicalSystems.push({
        id: i,
        value: 0.5,
        active: false,
        energy: 1.0,
        // Add animation phase offset for each node
        phaseOffset: i * (Math.PI / nodeCount)
      });
    }
    
    setState(prev => ({
      ...prev,
      physicalSystems,
      observerValue: 0.5,
      thresholdMet: false,
      updateTriggered: false
    }));
    
    // Reset refs array
    nodeRefs.current = physicalSystems.map(() => React.createRef());
    
    // Initialize connection refs
    connectionRefs.current = Array(nodeCount).fill().map(() => React.createRef());
  }, [nodeCount]);
  
  // Initialize on mount and when nodeCount changes
  useEffect(() => {
    initializeNodes();
  }, [initializeNodes, nodeCount]);
  
  // Calculate node positions in a circle
  const getNodePosition = (index, total, radius = isMobile ? 140 : 180) => {
    const angle = (index / total) * Math.PI * 2;
    const x = 250 + radius * Math.cos(angle);
    const y = 250 + radius * Math.sin(angle);
    return { x, y };
  };
  
  // Animation step - with forced visual changes
  const animationStep = useCallback((timestamp) => {
    // FPS calculation
    if (!fpsRef.current.lastTime) {
      fpsRef.current.lastTime = timestamp;
      fpsRef.current.frames = 0;
    }
    
    fpsRef.current.frames++;
    const elapsed = timestamp - fpsRef.current.lastTime;
    
    if (elapsed >= 1000) {
      const currentFps = Math.round((fpsRef.current.frames * 1000) / elapsed);
      setFps(currentFps);
      fpsRef.current.value = currentFps;
      fpsRef.current.lastTime = timestamp;
      fpsRef.current.frames = 0;
      
      // Auto-enable performance mode if FPS drops too low
      if (currentFps < 30 && !simState.performanceMode) {
        setState(prev => ({ ...prev, performanceMode: true }));
      }
    }
    
    // Update frame counter (visible proof of animation)
    setFrameCount(prev => (prev + 1) % 1000);
    
    // Update elapsed time (slower progression)
    setElapsedTime(prev => +(prev + 0.05).toFixed(2));
    
    setState(prev => {
      // Update each physical system with animation-focused changes
      const newPhysicalSystems = prev.physicalSystems.map((ps, i) => {
        // Create phase-shifted values for each physical system
        const nodeTime = elapsedTime + ps.phaseOffset;
        const newValue = 0.5 + 0.4 * Math.sin(nodeTime * 0.25); // slower oscillation
        
        // Determine if node is active based on simple time-based pattern
        // This ensures some nodes will always be active for visual interest
        const active = Math.sin(nodeTime) > 0.3;
        
        // Energy oscillates for visual effect
        const energy = 0.5 + 0.5 * Math.sin(nodeTime * 0.2);
        
        return {
          ...ps,
          value: newValue,
          active,
          energy,
          phaseOffset: ps.phaseOffset
        };
      });
      
      // Count active physical systems
      const activeCount = newPhysicalSystems.filter(ps => ps.active).length;
      
      // Check if threshold is met
      const thresholdMet = activeCount >= Math.ceil(newPhysicalSystems.length * prev.updateThreshold);
      
      // Determine if observer should update based on threshold
      let newObserverValue = prev.observerValue;
      let updateTriggered = false;
      
      if (thresholdMet) {
        // Calculate average value of active physical systems
        const activeValues = newPhysicalSystems
          .filter(ps => ps.active)
          .map(ps => ps.value);
          
        const avgValue = activeValues.reduce((sum, val) => sum + val, 0) / activeValues.length;
        
        // Gradually update observer value (slower update for better visualization)
        newObserverValue = prev.observerValue + (avgValue - prev.observerValue) * 0.1;
        
        // Periodically trigger update visual for better feedback
        updateTriggered = Math.sin(elapsedTime * 0.15) > 0.7;
      }
      
      return {
        ...prev,
        physicalSystems: newPhysicalSystems,
        observerValue: newObserverValue,
        thresholdMet,
        updateTriggered: thresholdMet && updateTriggered
      };
    });
    
    // Direct DOM manipulation for animations if needed
    if (observerSystemRef.current) {
      // Pulse effect on observer system when threshold is met
      const scale = simState.thresholdMet 
        ? 1 + 0.15 * Math.sin(elapsedTime * 2)
        : 1;
      observerSystemRef.current.style.transform = `scale(${scale})`;
    }
    
    // Continue animation if running
    if (simState.running) {
      animationRef.current = requestAnimationFrame(animationStep);
    }
  }, [elapsedTime, simState.running, simState.performanceMode, simState.thresholdMet]);
  
  // Start animation
  const startAnimation = useCallback(() => {
    setState(prev => ({ ...prev, running: true }));
  }, []);
  
  // Stop animation
  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setState(prev => ({ ...prev, running: false }));
  }, []);
  
  // Toggle animation
  const toggleAnimation = useCallback(() => {
    if (simState.running) {
      stopAnimation();
    } else {
      startAnimation();
    }
  }, [simState.running, startAnimation, stopAnimation]);
  
  // Toggle demo mode
  const toggleDemoMode = useCallback(() => {
    setState(prev => ({ ...prev, demoMode: !prev.demoMode }));
  }, []);
  
  // Toggle performance mode
  const togglePerformanceMode = useCallback(() => {
    setState(prev => ({ ...prev, performanceMode: !prev.performanceMode }));
  }, []);
  
  // Reset simulation
  const resetAnimation = useCallback(() => {
    stopAnimation();
    setElapsedTime(0);
    setFrameCount(0);
    initializeNodes();
  }, [stopAnimation, initializeNodes]);
  
  // Animation effect
  useEffect(() => {
    if (simState.running) {
      animationRef.current = requestAnimationFrame(animationStep);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [simState.running, animationStep]);
  
  // Demo mode effect - force animations even when not running simulation
  useEffect(() => {
    let demoInterval = null;
    
    if (simState.demoMode && !simState.running) {
      // Run a simplified animation in demo mode
      demoInterval = setInterval(() => {
        setFrameCount(prev => (prev + 1) % 1000);
        
        // Rotate through node states for visual effect
        setState(prev => {
          const newPhysicalSystems = prev.physicalSystems.map((ps, i) => ({
            ...ps,
            active: (i + frameCount) % 3 === 0
          }));
          
          // Count active physical systems
          const activeCount = newPhysicalSystems.filter(ps => ps.active).length;
          const thresholdMet = activeCount >= Math.ceil(newPhysicalSystems.length * prev.updateThreshold);
          
          return {
            ...prev,
            physicalSystems: newPhysicalSystems,
            thresholdMet,
            updateTriggered: thresholdMet && (frameCount % 30 < 15)
          };
        });
      }, 500);
    }
    
    return () => {
      if (demoInterval) clearInterval(demoInterval);
    };
  }, [simState.demoMode, simState.running, frameCount]);
  
  // Handle touch interactions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleTouchStart = (e) => {
      // Prevent default behavior to avoid scrolling while interacting
      e.preventDefault();
      
      // Toggle animation on tap
      toggleAnimation();
    };
    
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
    };
  }, [toggleAnimation]);
  
  // Adjust threshold
  const adjustThreshold = useCallback((newValue) => {
    setState(prev => ({
      ...prev,
      updateThreshold: Math.max(0.1, Math.min(1.0, newValue))
    }));
  }, []);
  
  return (
    <div className="bg-gradient-to-r from-purple-900/60 to-indigo-900/60 backdrop-blur-sm rounded-lg p-4 md:p-8 text-center">
      {/* Include animation styles */}
      <AnimationStyles />
      
      <h3 className="text-xl md:text-2xl font-semibold mb-4">Adaptation emerges from the regulation of coherence under energetic constraint.</h3>
      <p className="mb-6 text-sm md:text-base text-gray-300">
        This visualization demonstrates how an Observer System (OS) updates its state only when a threshold 
        of Physical Systems (PS) become active, creating a more stable and energy-efficient form of adaptation.
      </p>
      
      {/* Animation Frame Counter - visible proof of animation */}
      <div className="my-4 flex flex-wrap justify-center items-center gap-2 md:gap-4">
        <div className="bg-black/40 px-3 py-2 rounded-lg">
          <span className="text-xs text-gray-400">FRAME</span>
          <div className="font-mono text-lg md:text-2xl text-white animate-pulse">
            {frameCount.toString().padStart(4, '0')}
          </div>
        </div>
        
        <div className="bg-black/40 px-3 py-2 rounded-lg">
          <span className="text-xs text-gray-400">TIME</span>
          <div className="font-mono text-lg md:text-2xl text-green-300 animate-pulse">
            {elapsedTime.toFixed(1)}s
          </div>
        </div>
        
        {/* Visual activity indicator */}
        <div className="bg-black/40 px-3 py-2 rounded-lg flex items-center">
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500 mr-2 animate-ping"></div>
          <span className="text-green-300 text-sm md:text-base">Active</span>
        </div>
        
        {/* FPS counter - only visible in performance mode */}
        {simState.performanceMode && (
          <div className="bg-black/40 px-3 py-2 rounded-lg">
            <span className="text-xs text-gray-400">FPS</span>
            <div className={`font-mono text-lg md:text-2xl ${fps < 30 ? 'text-red-400' : 'text-green-300'}`}>
              {fps}
            </div>
          </div>
        )}
      </div>
      
      {/* Threshold control */}
      <div className="mb-6 bg-black/30 p-3 rounded-lg max-w-md mx-auto">
        <label className="flex justify-between mb-1 text-sm">
          <span>Update Threshold: {Math.round(simState.updateThreshold * 100)}%</span>
          <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Percentage of PS nodes that must be active to update OS">?</span>
        </label>
        <input 
          type="range" 
          min="10" 
          max="100" 
          step="10" 
          value={simState.updateThreshold * 100}
          onChange={(e) => adjustThreshold(parseInt(e.target.value, 10) / 100)}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="text-xs text-gray-400 mt-1">
          OS updates when {Math.ceil(simState.physicalSystems.length * simState.updateThreshold)} of {simState.physicalSystems.length} PS nodes are active
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-6 md:mb-8">
        <button
          onClick={toggleAnimation}
          className={`py-2 px-4 md:px-6 rounded-md shadow text-base md:text-lg transition-colors touch-manipulation ${
            simState.running 
              ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {simState.running ? 'Pause' : 'Start'}
        </button>
        
        <button
          onClick={resetAnimation}
          className="py-2 px-4 md:px-6 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 rounded-md shadow text-base md:text-lg touch-manipulation"
        >
          Reset
        </button>
        
        {!isMobile && (
          <button
            onClick={toggleDemoMode}
            className={`py-2 px-4 md:px-6 rounded-md shadow text-base md:text-lg touch-manipulation ${
              simState.demoMode 
                ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800' 
                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
            }`}
          >
            {simState.demoMode ? 'Disable Demo' : 'Enable Demo'}
          </button>
        )}
        
        <button
          onClick={togglePerformanceMode}
          className={`py-2 px-4 md:px-6 rounded-md shadow text-base md:text-lg touch-manipulation ${
            simState.performanceMode 
              ? 'bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800' 
              : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
          }`}
        >
          {simState.performanceMode ? 'High Perf Mode' : 'Quality Mode'}
        </button>
      </div>
      
      {/* Network Visualization */}
      <div 
        ref={containerRef}
        className="bg-black/30 rounded-lg p-2 md:p-4 mb-6 md:mb-8 relative touch-manipulation" 
        style={{ height: isMobile ? '350px' : '500px' }}
      >
        {/* Mobile touch instruction overlay */}
        {isMobile && (
          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs p-2 rounded z-10 pointer-events-none">
            Tap to start/pause
          </div>
        )}
        
        {/* Background animation elements - simplified on mobile */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute w-full h-full spin-slow">
            <div className="absolute top-1/2 left-1/2 w-3/4 h-3/4 border-2 border-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            {!simState.performanceMode && (
              <>
                <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 border-2 border-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute top-1/2 left-1/2 w-1/4 h-1/4 border-2 border-purple-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              </>
            )}
          </div>
        </div>
        
        <svg width="100%" height="100%" viewBox="0 0 500 500" className="overflow-visible">
          {/* Threshold indicator circle */}
          <circle
            cx="250"
            cy="250"
            r={isMobile ? 155 : 195}
            fill="none"
            stroke={simState.thresholdMet ? "rgba(52, 211, 153, 0.3)" : "rgba(255, 255, 255, 0.1)"}
            strokeWidth="2"
            strokeDasharray="5,5"
            className={simState.thresholdMet ? "animate-pulse" : ""}
          />
          
          {/* Connections from PS nodes to central OS - reduce on mobile or in performance mode */}
          {simState.physicalSystems.map((ps, i) => {
            const pos = getNodePosition(i, simState.physicalSystems.length);
            const isActive = ps.active;
            
            return (
              <line
                key={`conn-${i}`}
                ref={el => connectionRefs.current[i] = el}
                x1={pos.x}
                y1={pos.y}
                x2="250"
                y2="250"
                stroke={isActive ? "rgba(52, 211, 153, 0.6)" : "rgba(255, 255, 255, 0.1)"}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isActive ? "none" : "5,5"}
                className={isActive && !simState.performanceMode ? "connection-flash" : ""}
              />
            );
          })}
          
          {/* Observer System (center node) with forced animation */}
          <g ref={observerSystemRef} className={simState.performanceMode ? "" : "node-float"}>
            <circle
              cx="250"
              cy="250"
              r={isMobile ? "30" : "40"}
              fill={simState.thresholdMet 
                ? `rgba(52, 211, 153, ${0.5 + simState.observerValue * 0.5})` 
                : `rgba(59, 130, 246, ${0.3 + simState.observerValue * 0.3})`}
              stroke={simState.thresholdMet ? "#34D399" : "white"}
              strokeWidth={simState.thresholdMet ? "3" : "2"}
              className={`observer-system ${simState.thresholdMet && !simState.performanceMode ? "node-pulse" : ""}`}
            />
            <text
              x="250"
              y="245"
              textAnchor="middle"
              fill="white"
              fontSize={isMobile ? "10" : "12"}
              fontWeight="bold"
            >
              Observer System
            </text>
            <text
              x="250"
              y="265"
              textAnchor="middle"
              fill="white"
              fontSize={isMobile ? "10" : "12"}
              className={simState.performanceMode ? "" : "animate-pulse"}
            >
              {simState.observerValue.toFixed(2)}
            </text>
          </g>
          
          {/* Physical System nodes with forced animation */}
          {simState.physicalSystems.map((ps, i) => {
            const pos = getNodePosition(i, simState.physicalSystems.length);
            const isActive = ps.active;
            
            // Calculate animation delay based on node index
            const animationDelay = `${i * 0.2}s`;
            
            return (
              <g key={`node-${i}`} ref={el => nodeRefs.current[i] = el}>
                {/* Physical System node */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isActive ? (isMobile ? 25 : 30) : (isMobile ? 15 : 20)}
                  fill={isActive 
                    ? `rgba(239, 68, 68, ${0.5 + ps.value * 0.5})` 
                    : `rgba(59, 130, 246, ${0.3 + ps.value * 0.3})`}
                  stroke={isActive ? "#ef4444" : "white"}
                  strokeWidth={isActive ? 3 : 1}
                  className={`physical-system ${isActive && !simState.performanceMode ? "node-pulse" : (simState.performanceMode ? "" : "node-color-shift")}`}
                  style={{ animationDelay }}
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={isMobile ? "9" : "10"}
                  fontWeight="bold"
                >
                  PS{i+1}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + (isMobile ? 12 : 15)}
                  textAnchor="middle"
                  fill="white"
                  fontSize={isMobile ? "8" : "9"}
                  className={simState.performanceMode ? "" : "animate-pulse"}
                  style={{ animationDelay }}
                >
                  {ps.value.toFixed(2)}
                </text>
                
                {/* Energy indicator with animation - simplified on mobile */}
                {(!isMobile || !simState.performanceMode) && (
                  <>
                    <rect
                      x={pos.x - (isMobile ? 12 : 15)}
                      y={pos.y + (isMobile ? 20 : 25)}
                      width={isMobile ? "24" : "30"}
                      height="4"
                      fill="none"
                      stroke="white"
                      strokeWidth="1"
                    />
                    <rect
                      x={pos.x - (isMobile ? 12 : 15)}
                      y={pos.y + (isMobile ? 20 : 25)}
                      width={(isMobile ? 24 : 30) * ps.energy}
                      height="4"
                      fill={ps.energy < 0.3 ? "rgb(239, 68, 68)" : "rgb(52, 211, 153)"}
                      className="transition-all duration-300"
                    />
                  </>
                )}
              </g>
            );
          })}
          
          {/* Update indicator with forced animation */}
          {simState.updateTriggered && (
            <g className={simState.performanceMode ? "" : "consensus-flash"}>
              <rect
                x={isMobile ? "125" : "150"}
                y={isMobile ? "100" : "120"}
                width={isMobile ? "250" : "200"}
                height={isMobile ? "30" : "40"}
                rx="5"
                fill="rgba(52, 211, 153, 0.3)"
                stroke="#34D399"
                strokeWidth="2"
              />
              <text
                x="250"
                y={isMobile ? "120" : "145"}
                textAnchor="middle"
                fill="#34D399"
                fontSize={isMobile ? "12" : "14"}
                fontWeight="bold"
              >
                OS Update Triggered!
              </text>
            </g>
          )}
          
          {/* Threshold indicator */}
          <text
            x="250"
            y={isMobile ? "320" : "380"}
            textAnchor="middle"
            fill={simState.thresholdMet ? "rgb(52, 211, 153)" : "white"}
            fontSize={isMobile ? "10" : "12"}
            className={simState.thresholdMet ? "animate-pulse" : ""}
          >
            {simState.physicalSystems.filter(ps => ps.active).length}/{simState.physicalSystems.length} PS Active
            {simState.thresholdMet ? " - Threshold Met!" : ""}
          </text>
          
          {/* Visual activity indicators - always animated, reduced on mobile */}
          {!simState.performanceMode && (
            <>
              <circle 
                cx="30" 
                cy="30" 
                r={isMobile ? "8" : "10"} 
                fill="rgba(52, 211, 153, 0.5)" 
                className="animate-ping"
              />
              <circle 
                cx="470" 
                cy="30" 
                r={isMobile ? "8" : "10"} 
                fill="rgba(239, 68, 68, 0.5)" 
                className="animate-ping"
                style={{ animationDelay: "0.5s" }}
              />
              <circle 
                cx="30" 
                cy="470" 
                r={isMobile ? "8" : "10"} 
                fill="rgba(59, 130, 246, 0.5)" 
                className="animate-ping"
                style={{ animationDelay: "1s" }}
              />
              <circle 
                cx="470" 
                cy="470" 
                r={isMobile ? "8" : "10"} 
                fill="rgba(139, 92, 246, 0.5)" 
                className="animate-ping"
                style={{ animationDelay: "1.5s" }}
              />
            </>
          )}
        </svg>
      </div>
      
      {/* Always-changing statistics to show animation */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4 mb-6 md:mb-8">
        <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center justify-center">
          <span>Animation Statistics</span>
          <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
          <div>
            <p className="text-xs md:text-sm text-gray-300">Frame Count</p>
            <p className="text-lg md:text-2xl animate-pulse">{frameCount}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-300">Elapsed Time</p>
            <p className="text-lg md:text-2xl animate-pulse">{elapsedTime.toFixed(1)}s</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-300">Observer Value</p>
            <p className="text-lg md:text-2xl animate-pulse">{simState.observerValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-300">Active PS Nodes</p>
            <p className="text-lg md:text-2xl animate-pulse">
              {simState.physicalSystems.filter(ps => ps.active).length}/{simState.physicalSystems.length}
            </p>
          </div>
        </div>
      </div>
      
      {/* Explanation - Responsive grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-10">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-12 h-12 md:w-16 md:h-16 bg-blue-500/20 rounded-full animate-ping"></div>
          <h3 className="text-base md:text-lg font-semibold mb-2 relative z-10">Threshold-Based Updates</h3>
          <p className="text-gray-300 text-xs md:text-sm relative z-10">
            The Observer System (OS) only updates when a sufficient number of Physical Systems (PS) 
            become active. This threshold mechanism prevents premature or unnecessary updates, 
            creating a more stable and energy-efficient system.
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4 relative overflow-hidden">
          <div className="absolute -left-4 -top-4 w-12 h-12 md:w-16 md:h-16 bg-green-500/20 rounded-full animate-ping" style={{ animationDelay: "0.5s" }}></div>
          <h3 className="text-base md:text-lg font-semibold mb-2 relative z-10">Energy Constraints</h3>
          <p className="text-gray-300 text-xs md:text-sm relative z-10">
            Each PS node has limited energy for signaling. The threshold mechanism ensures the OS
            only updates when enough evidence has accumulated, preventing wasteful updates based on
            noisy or insufficient data from individual PS nodes.
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-12 h-12 md:w-16 md:h-16 bg-purple-500/20 rounded-full animate-ping" style={{ animationDelay: "1s" }}></div>
          <h3 className="text-base md:text-lg font-semibold mb-2 relative z-10">Emergent Consciousness</h3>
          <p className="text-gray-300 text-xs md:text-sm relative z-10">
            This model demonstrates how a central Observer System can integrate information from multiple
            Physical Systems, updating only when sufficient evidence accumulates. This mirrors how
            consciousness might emerge as a threshold-based integration of distributed neural activity.
          </p>
        </div>
      </div>
      
      {/* Mobile performance note */}
      {isMobile && (
        <div className="mt-4 text-xs text-gray-400 italic">
          Note: Some visual effects are reduced on mobile devices for better performance.
        </div>
      )}
    </div>
  );
};

// Helper function to get node color based on state
function getNodeColor(ps) {
  if (ps.active) {
    return `rgba(239, 68, 68, ${0.5 + ps.energy * 0.5})`;
  } else {
    return `rgba(59, 130, 246, ${0.5 + ps.energy * 0.5})`;
  }
}

export default NetworkVisualWithAnimation;
