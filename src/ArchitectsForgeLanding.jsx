import React, { useEffect, useRef, useState, useCallback } from "react";

import Lenis from "lenis";
import { motion, useScroll, useTransform } from "framer-motion";
import ProjectFluctusSim from './ProjectFluctusSim';
import NetworkVisualWithAnimation from './NetworkVisualWithAnimation';
import p5 from "p5"; // Ensure p5 library is available for ProjectFluctusSim
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

/* Helper ‑ Smooth-scroll hook */
function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smooth: true });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);
}

/* Canvas Starfield (simple 2-D) */
function Starfield({ density = 350, speed = 0.05, className = "" }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: density }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random(),
    }));

    let animationId = null;
    function render() {
      // keep canvas transparent so the fractal layer shows through
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      stars.forEach((s) => {
        s.y += speed * (s.z + 0.2) * 60;
        if (s.y > h) s.y = 0;
        const size = s.z * 2;
        ctx.fillRect(s.x, s.y, size, size);
      });
      animationId = requestAnimationFrame(render);
    }
    render();
    
    return () => {
      window.removeEventListener("resize", resize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [density, speed]);
  return <canvas ref={canvasRef} className={className} />;
}


// Hover component for source citations
const HoverSource = ({ label, source }) => (
  <span className="group relative cursor-help">
    <span className="text-blue-300 underline decoration-dotted">{label}</span>
    <span className="invisible group-hover:visible absolute top-full left-0 w-64 mt-1 bg-gray-800 text-white text-xs p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
      Source: {source}
    </span>
  </span>
);

/* Parallax wrapper using Framer's `useScroll` */
function Parallax({ children, speed = 0.5, className = "" }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, -1000 * speed]);
  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

// Error boundary component to catch rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-900/30 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-sm opacity-80">{this.state.error?.message || "Unknown error"}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-4 py-1 bg-red-700 hover:bg-red-600 rounded text-sm"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple inline USP visualization component
function InlineUSPVisualization() {
  // State for simulation parameters and values
  const [params, setParams] = useState({
    /* More "lively" defaults to make changes apparent */
    alpha: 1.2,         // α - Weight for magnitude
    beta: 0.8,          // β - Weight for variance
    delta: 1.5,         // δ - Prediction error sensitivity
    gamma: 0.1,         // γ - Energy cost factor
    eMax: 80.0,         // Lower max energy – depletes faster
    energyInflux: 4.0,  // Slightly lower recovery to show cost
    updateThreshold: 10.0, // Lower threshold ⇒ more updates
    updateRate: 0.9     // Faster OS catch-up
  });

  // Simulation state
  const [simState, setSimState] = useState({
    time: 0,
    updateSignal: 0,
    salience: 0,
    energyBudget: 100.0,
    predictionError: 0,
    uIntegral: 0,
    physicalSystem: 0.5,
    observerSystem: 0.1,
    running: false,
    updateCount: 0,
    lastUpdateTime: 0,
    shouldUpdate: false // Track update events separately
  });

  // History state for time-series graphs
  const [history, setHistory] = useState({
    times: [],
    updateSignals: [],
    physicalSystems: [],
    observerSystems: [],
    updateEvents: [] // indices where an update occurred
  });

  // Max history length to prevent memory issues
  const MAX_HISTORY_LENGTH = 100;
  
  // Animation frame reference
  const animationRef = useRef(null);
  
  // Mounted ref to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Calculate next simulation state - PURE FUNCTION, no state updates
  const calculateNextState = useCallback((currentState, currentParams) => {
    try {
      const dt = 0.1; // Fixed time step
      
      // Calculate prediction error
      const error = Math.abs(currentState.physicalSystem - currentState.observerSystem);
      const predictionError = currentParams.delta * error;
      
      // Calculate salience - simplified to avoid potential NaN
      const errorVariance = error * 0.1 * (1 + Math.random() * 0.5);
      const salience = currentParams.alpha * error + currentParams.beta * errorVariance;
      
      // Calculate energy budget - with safety checks
      const energyInflux = currentParams.energyInflux * dt;
      const energyBudget = Math.min(
        currentParams.eMax, 
        Math.max(0, currentParams.eMax - currentParams.gamma * currentState.uIntegral + energyInflux)
      );
      
      // Calculate update signal
      const updateSignal = salience * energyBudget * predictionError;
      
      // New physical system state – safer calculation
      // Use fixed time values rather than incrementing to avoid potential NaN
      const time = currentState.time + dt;
      const wave1 = 0.8 * Math.sin(0.2 * time);
      const wave2 = 0.3 * Math.sin(time);
      const chaos = 0.2 * (Math.random() - 0.5);
      
      // Combine and clamp to safe range
      let newPhysicalSystem = wave1 + wave2 + chaos;
      newPhysicalSystem = Math.max(-1, Math.min(1.2, newPhysicalSystem));
      
      // Determine if update should occur
      const shouldUpdate = updateSignal > currentParams.updateThreshold;
      
      // Calculate new observer system
      let newObserverSystem = currentState.observerSystem;
      let updateCount = currentState.updateCount;
      let lastUpdateTime = currentState.lastUpdateTime;
      
      if (shouldUpdate) {
        // Apply update rate with safety bounds
        const updateDelta = currentParams.updateRate * (newPhysicalSystem - currentState.observerSystem);
        newObserverSystem = currentState.observerSystem + updateDelta;
        updateCount += 1;
        lastUpdateTime = time;
      }
      
      // Return new state object - no state updates here
      return {
        time,
        updateSignal,
        salience,
        energyBudget,
        predictionError,
        uIntegral: currentState.uIntegral + updateSignal * dt,
        physicalSystem: newPhysicalSystem,
        observerSystem: newObserverSystem,
        updateCount,
        lastUpdateTime,
        running: currentState.running,
        shouldUpdate // Include the update flag in the return value
      };
    } catch (error) {
      console.error("Calculation error:", error);
      // Return unchanged state on error
      return {
        ...currentState,
        running: false
      };
    }
  }, []);
  
  // Update history based on new state - separate function
  const updateHistory = useCallback((newState) => {
    if (!isMountedRef.current) return;
    
    setHistory(prev => {
      try {
        // Create copies of the arrays to avoid mutating state directly
        const newTimes = [...prev.times, newState.time];
        const newUpdateSignals = [...prev.updateSignals, newState.updateSignal];
        const newPhysicalSystems = [...prev.physicalSystems, newState.physicalSystem];
        const newObserverSystems = [...prev.observerSystems, newState.observerSystem];
        
        // Track update events
        let newUpdateEvents = [...prev.updateEvents];
        if (newState.shouldUpdate) {
          newUpdateEvents.push(newTimes.length - 1);
        }
        
        // If we exceed the max length, remove the oldest entries
        if (newTimes.length > MAX_HISTORY_LENGTH) {
          const removeCount = newTimes.length - MAX_HISTORY_LENGTH;
          newTimes.splice(0, removeCount);
          newUpdateSignals.splice(0, removeCount);
          newPhysicalSystems.splice(0, removeCount);
          newObserverSystems.splice(0, removeCount);
          
          // Adjust update event indices
          newUpdateEvents = newUpdateEvents
            .map(idx => idx - removeCount)
            .filter(idx => idx >= 0);
        }
        
        return {
          times: newTimes,
          updateSignals: newUpdateSignals,
          physicalSystems: newPhysicalSystems,
          observerSystems: newObserverSystems,
          updateEvents: newUpdateEvents
        };
      } catch (error) {
        console.error("History update error:", error);
        return prev; // Return previous state on error
      }
    });
  }, []);
  
  // Animation step - now with proper error handling
  const animationStep = useCallback(() => {
    try {
      if (!isMountedRef.current) return;
      
      // Calculate new state (pure function)
      const newState = calculateNextState(simState, params);
      
      // Update simulation state
      setSimState(newState);
      
      // Update history separately
      updateHistory(newState);
      
      // Continue animation if still running
      if (newState.running && isMountedRef.current) {
        animationRef.current = requestAnimationFrame(animationStep);
      }
    } catch (error) {
      console.error("Animation error:", error);
      // Stop animation on error
      if (isMountedRef.current) {
        setSimState(prev => ({ ...prev, running: false }));
      }
    }
  }, [simState, params, calculateNextState, updateHistory]);
  
  // Toggle simulation running state - with safety checks
  const toggleSimulation = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setSimState(prev => {
      const newRunning = !prev.running;
      return { ...prev, running: newRunning };
    });
  }, []);
  
  // Reset simulation - with safety checks
  const resetSimulation = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Cancel any animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Reset state
    setSimState({
      time: 0,
      updateSignal: 0,
      salience: 0,
      energyBudget: 100.0,
      predictionError: 0,
      uIntegral: 0,
      physicalSystem: 0.5,
      observerSystem: 0.1,
      running: false,
      updateCount: 0,
      lastUpdateTime: 0,
      shouldUpdate: false
    });
    
    // Reset history
    setHistory({
      times: [],
      updateSignals: [],
      physicalSystems: [],
      observerSystems: [],
      updateEvents: []
    });
  }, []);
  
  // Update parameter - with safety checks
  const updateParameter = useCallback((paramName, value) => {
    if (!isMountedRef.current) return;
    
    setParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  }, []);
  
  // Handle animation frame effect - with proper cleanup
  useEffect(() => {
    // Only start animation if running and not already animating
    if (simState.running && !animationRef.current) {
      animationRef.current = requestAnimationFrame(animationStep);
    }
    
    // Clean up animation frame on state change or unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [simState.running, animationStep]);
  
  // Set mounted ref on mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      // Clean up animation frame
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  // Simple bar visualization component
  const BarVisualization = ({ value, maxValue, label, color }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-medium">{value.toFixed(2)}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-4">
        <div 
          className={`h-4 rounded-full ${color}`} 
          style={{ width: `${Math.min(100, (value / maxValue) * 100)}%` }}
        />
      </div>
    </div>
  );

  // Simple SVG-based line graph component
  const SimpleGraph = ({ 
    data = [], 
    width = 600, 
    height = 200, 
    color = "#4299e1", 
    label = "",
    minValue = null,
    maxValue = null,
    showThreshold = false,
    thresholdValue = 0,
    thresholdColor = "#f56565"
  }) => {
    // If no data, show placeholder
    if (!data || data.length < 2) {
      return (
        <div className="flex items-center justify-center bg-black/30 rounded-lg" style={{ height: `${height}px` }}>
          <p className="text-white/70">Waiting for data...</p>
        </div>
      );
    }

    try {
      // Calculate min and max values for scaling if not provided
      const dataMin = minValue !== null ? minValue : Math.min(...data);
      const dataMax = maxValue !== null ? maxValue : Math.max(...data);
      
      // Add a small buffer to the range to avoid flat lines at the edges
      const range = Math.max(0.1, dataMax - dataMin);
      const yMin = dataMin - range * 0.1;
      const yMax = dataMax + range * 0.1;
      
      // Calculate points for the SVG path
      const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - yMin) / (yMax - yMin)) * height;
        return `${x},${y}`;
      }).join(" ");

      return (
        <div className="relative">
          <div className="absolute top-2 left-2 text-xs text-white/70">{label}</div>
          <svg width={width} height={height} className="bg-black/30 rounded-lg">
            {/* Draw grid lines */}
            {[0.25, 0.5, 0.75].map((pos, i) => (
              <line 
                key={i}
                x1="0" 
                y1={height * pos} 
                x2={width} 
                y2={height * pos} 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth="1"
              />
            ))}
            
            {/* Draw threshold line if requested */}
            {showThreshold && (
              <line 
                x1="0" 
                y1={height - ((thresholdValue - yMin) / (yMax - yMin)) * height} 
                x2={width} 
                y2={height - ((thresholdValue - yMin) / (yMax - yMin)) * height} 
                stroke={thresholdColor} 
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}
            
            {/* Draw the line */}
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              points={points}
            />
            
            {/* Add a gradient fill below the line for visual appeal */}
            <linearGradient id={`gradient-${label.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
            
            <polygon
              fill={`url(#gradient-${label.replace(/\s+/g, '-')})`}
              points={`0,${height} ${points} ${width},${height}`}
            />
            
            {/* Y-axis labels */}
            <text x="5" y="15" fill="rgba(255,255,255,0.7)" fontSize="10">
              {yMax.toFixed(2)}
            </text>
            <text x="5" y={height - 5} fill="rgba(255,255,255,0.7)" fontSize="10">
              {yMin.toFixed(2)}
            </text>
          </svg>
        </div>
      );
    } catch (error) {
      console.error("Graph rendering error:", error);
      return (
        <div className="flex items-center justify-center bg-red-900/30 rounded-lg" style={{ height: `${height}px` }}>
          <p className="text-white/70">Error rendering graph</p>
        </div>
      );
    }
  };

  // Dual line graph for comparing two data series
  const DualLineGraph = ({ 
    data1 = [], 
    data2 = [], 
    width = 600, 
    height = 200, 
    color1 = "#4299e1", 
    color2 = "#f56565", 
    label1 = "",
    label2 = "",
    title = ""
  }) => {
    // If no data, show placeholder
    if (!data1 || !data2 || data1.length < 2 || data2.length < 2) {
      return (
        <div className="flex items-center justify-center bg-black/30 rounded-lg" style={{ height: `${height}px` }}>
          <p className="text-white/70">Waiting for data...</p>
        </div>
      );
    }

    try {
      // Calculate min and max values for scaling
      const allValues = [...data1, ...data2];
      const dataMin = Math.min(...allValues);
      const dataMax = Math.max(...allValues);
      
      // Add a small buffer to the range to avoid flat lines at the edges
      const range = Math.max(0.1, dataMax - dataMin);
      const yMin = dataMin - range * 0.1;
      const yMax = dataMax + range * 0.1;
      
      // Calculate points for the SVG paths
      const points1 = data1.map((value, index) => {
        const x = (index / (data1.length - 1)) * width;
        const y = height - ((value - yMin) / (yMax - yMin)) * height;
        return `${x},${y}`;
      }).join(" ");
      
      const points2 = data2.map((value, index) => {
        const x = (index / (data2.length - 1)) * width;
        const y = height - ((value - yMin) / (yMax - yMin)) * height;
        return `${x},${y}`;
      }).join(" ");

      return (
        <div className="relative">
          <div className="absolute top-2 left-2 text-xs text-white/70">{title}</div>
          <div className="absolute top-2 right-2 text-xs flex gap-4">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 mr-1 rounded-full" style={{ backgroundColor: color1 }}></span>
              <span className="text-white/70">{label1}</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 mr-1 rounded-full" style={{ backgroundColor: color2 }}></span>
              <span className="text-white/70">{label2}</span>
            </div>
          </div>
          <svg width={width} height={height} className="bg-black/30 rounded-lg">
            {/* Draw grid lines */}
            {[0.25, 0.5, 0.75].map((pos, i) => (
              <line 
                key={i}
                x1="0" 
                y1={height * pos} 
                x2={width} 
                y2={height * pos} 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth="1"
              />
            ))}
            
            {/* Draw the first line */}
            <polyline
              fill="none"
              stroke={color1}
              strokeWidth="2"
              points={points1}
            />
            
            {/* Draw the second line */}
            <polyline
              fill="none"
              stroke={color2}
              strokeWidth="2"
              points={points2}
            />
            
            {/* Y-axis labels */}
            <text x="5" y="15" fill="rgba(255,255,255,0.7)" fontSize="10">
              {yMax.toFixed(2)}
            </text>
            <text x="5" y={height - 5} fill="rgba(255,255,255,0.7)" fontSize="10">
              {yMin.toFixed(2)}
            </text>
          </svg>
        </div>
      );
    } catch (error) {
      console.error("Dual graph rendering error:", error);
      return (
        <div className="flex items-center justify-center bg-red-900/30 rounded-lg" style={{ height: `${height}px` }}>
          <p className="text-white/70">Error rendering graph</p>
        </div>
      );
    }
  };

  return (
    <ErrorBoundary>
      <div className="bg-gradient-to-r from-blue-900/80 to-purple-900/80 text-white p-6 rounded-lg shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4"></h2>
          
          <p className="text-gray-300 max-w-3xl mx-auto">
            This visualization demonstrates how a system decides when to update its internal model
            based on prediction errors, available energy, and the salience of information.
          </p>
        </div>
        
        {/* Parameter Controls */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-8">
          <h3 className="text-xl font-semibold mb-4">Parameter Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Salience Parameters */}
            <div className="space-y-4">
              <h4 className="font-medium">Salience Parameters</h4>
              
              <div>
                <label className="flex justify-between mb-1">
                  <span>α (Alpha): {params.alpha.toFixed(1)}</span>
                  <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Weight for magnitude component in salience">?</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  step="0.1" 
                  value={params.alpha}
                  onChange={(e) => updateParameter('alpha', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="flex justify-between mb-1">
                  <span>β (Beta): {params.beta.toFixed(1)}</span>
                  <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Weight for variance component in salience">?</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  step="0.1" 
                  value={params.beta}
                  onChange={(e) => updateParameter('beta', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="flex justify-between mb-1">
                  <span>δ (Delta): {params.delta.toFixed(1)}</span>
                  <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Sensitivity parameter for prediction error">?</span>
                </label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="3" 
                  step="0.1" 
                  value={params.delta}
                  onChange={(e) => updateParameter('delta', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            
            {/* Energy Parameters */}
            <div className="space-y-4">
              <h4 className="font-medium">Energy Parameters</h4>
              
              <div>
                <label className="flex justify-between mb-1">
                  <span>E<sub>max</sub>: {params.eMax.toFixed(1)}</span>
                  <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Maximum energy capacity">?</span>
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="200" 
                  step="10" 
                  value={params.eMax}
                  onChange={(e) => updateParameter('eMax', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="flex justify-between mb-1">
                  <span>γ (Gamma): {params.gamma.toFixed(2)}</span>
                  <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Cost scaling factor for energy expenditure">?</span>
                </label>
                <input 
                  type="range" 
                  min="0.01" 
                  max="0.5" 
                  step="0.01" 
                  value={params.gamma}
                  onChange={(e) => updateParameter('gamma', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="flex justify-between mb-1">
                  <span>Energy Influx: {params.energyInflux.toFixed(1)}</span>
                  <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Rate of energy recovery">?</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="0.5" 
                  value={params.energyInflux}
                  onChange={(e) => updateParameter('energyInflux', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="flex justify-between mb-1">
                  <span>Update Threshold: {params.updateThreshold.toFixed(1)}</span>
                  <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Threshold above which an update occurs">?</span>
                </label>
                <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  step="1" 
                  value={params.updateThreshold}
                  onChange={(e) => updateParameter('updateThreshold', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="flex justify-between mb-1">
                  <span>Update Rate: {params.updateRate.toFixed(1)}</span>
                  <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Rate at which the observer system updates when threshold is exceeded">?</span>
                </label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1" 
                  step="0.1" 
                  value={params.updateRate}
                  onChange={(e) => updateParameter('updateRate', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Simulation Controls */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={toggleSimulation}
            className="py-2 px-6 bg-blue-600 hover:bg-blue-700 rounded-md shadow text-lg"
          >
            {simState.running ? 'Pause Simulation' : 'Start Simulation'}
          </button>
          
          <button
            onClick={resetSimulation}
            className="py-2 px-6 bg-gray-600 hover:bg-gray-700 rounded-md shadow text-lg"
          >
            Reset
          </button>
        </div>
        
        {/* Visualizations */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Current Values</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <BarVisualization 
                value={simState.updateSignal} 
                maxValue={params.updateThreshold * 1.5} 
                label="Update Signal" 
                color="bg-blue-500" 
              />
              
              <BarVisualization 
                value={simState.salience} 
                maxValue={5} 
                label="Salience" 
                color="bg-orange-500" 
              />
              
              <BarVisualization 
                value={simState.energyBudget} 
                maxValue={params.eMax} 
                label="Energy Budget" 
                color="bg-green-500" 
              />
              
              <BarVisualization 
                value={simState.predictionError} 
                maxValue={3} 
                label="Prediction Error" 
                color="bg-purple-500" 
              />
            </div>
            
            <div>
              <div className="bg-black/30 p-4 rounded-lg mb-6">
                <h4 className="text-lg font-semibold mb-2">System State</h4>
                
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span>Physical System:</span>
                    <span>{simState.physicalSystem.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-700 h-6 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${(simState.physicalSystem + 1) * 50}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Observer System:</span>
                    <span>{simState.observerSystem.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-700 h-6 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-red-500" 
                      style={{ width: `${(simState.observerSystem + 1) * 50}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-black/30 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-2">Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-300">Simulation Time:</p>
                    <p className="text-xl">{simState.time.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Update Count:</p>
                    <p className="text-xl">{simState.updateCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Update Threshold:</p>
                    <p className="text-xl">{params.updateThreshold.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Last Update:</p>
                    <p className="text-xl">{simState.lastUpdateTime.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────── Visual Metaphor (replaces graphs) ─────────── */}
        <DynamicBridgeVisual
          updateSignal={simState.updateSignal}
          threshold={params.updateThreshold}
          salience={simState.salience}
          energy={simState.energyBudget}
          predictionError={simState.predictionError}
          physical={simState.physicalSystem}
          observer={simState.observerSystem}
          updateOccurred={simState.shouldUpdate}
        />
        
        {/* Component Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Salience</h3>
            <p className="text-gray-300 text-sm">
              (αM(t) + βσ²(t)) combines magnitude and variance to determine which errors deserve attention.
              Higher values indicate errors that are large or uncertain.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Energy Budget</h3>
            <p className="text-gray-300 text-sm">
              (E<sub>max</sub> - γ∫<sub>0</sub><sup>t</sup> U(τ)dτ + I(t)) tracks available resources.
              Updates consume energy that must be replenished over time.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Prediction Error</h3>
            <p className="text-gray-300 text-sm">
              δ|S<sub>PS</sub>(t) - S<sub>OS</sub>(t)| measures the discrepancy between reality (Physical System)
              and internal model (Observer System).
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

/* ---------------- Dynamic Bridge Visual ---------------- */
function DynamicBridgeVisual({
  updateSignal,
  threshold,
  salience,
  energy,
  predictionError,
  physical,
  observer,
  updateOccurred
}) {
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const bridgePct = clamp(updateSignal / (threshold * 1.5), 0, 1);
  const salPct = clamp(salience / 5, 0, 1);
  const enPct = clamp(energy / 100, 0, 1);
  const errPct = clamp(predictionError / 3, 0, 1);
  // subtle scale pulse
  const pulseClass = updateOccurred ? "scale-105" : "";

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 flex flex-col items-center">
      <h3 className="text-xl font-semibold mb-6">System Alignment Visual</h3>
      <div className="relative w-full max-w-xl flex items-center justify-between">
        {/* Physical System node */}
        <div className="flex flex-col items-center">
          {/* fixed wrapper to avoid layout shift */}
          <div
            className="flex items-center justify-center"
            style={{ width: "120px", height: "120px" }}   /* max-size wrapper */
          >
            <div
              className={`rounded-full bg-blue-500 transition-transform duration-300 ${pulseClass}`}
              style={{
                width: "100%",       /* fill wrapper */
                height: "100%",
                transform: `scale(${1 + salPct * 0.5})`, /* scale 1-1.5 */
                boxShadow: `0 0 ${20 + enPct * 20}px rgba(59,130,246,${
                  0.4 + enPct * 0.5
                })`
              }}
            />
          </div>
          <span className="mt-2 text-sm">Physical ({physical.toFixed(2)})</span>
        </div>

        {/* Bridge */}
        <div className="flex-1 mx-4 h-6 relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-red-500 transition-all duration-200"
            style={{ width: `${bridgePct * 100}%`, opacity: 0.8 }}
          />
          {/* Threshold marker */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white/40"
            style={{ left: `${clamp(threshold / (threshold * 1.5), 0, 1) * 100}%` }}
          />
        </div>

        {/* Observer System node */}
        <div className="flex flex-col items-center">
          <div
            className="flex items-center justify-center"
            style={{ width: "120px", height: "120px" }}
          >
            <div
              className={`rounded-full bg-red-500 transition-transform duration-300 ${pulseClass}`}
              style={{
                width: "100%",
                height: "100%",
                transform: `scale(${1 + errPct * 0.5})`,
                boxShadow: `0 0 ${20 + enPct * 20}px rgba(239,68,68,${
                  0.4 + enPct * 0.5
                })`
              }}
            />
          </div>
          {/* flash indicator */}
          <span
            className="absolute -top-2 right-2 rounded-full bg-yellow-400 transition-opacity duration-500"
            style={{
              width: '14px',
              height: '14px',
              opacity: updateOccurred ? 1 : 0
            }}
          />
          <span className="mt-2 text-sm">Observer ({observer.toFixed(2)})</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 w-full max-w-md grid grid-cols-3 gap-4 text-xs">
        <LegendBar label="Salience" color="bg-orange-500" pct={salPct} />
        <LegendBar label="Energy" color="bg-green-500" pct={enPct} />
        <LegendBar label="Pred. Err" color="bg-purple-500" pct={errPct} />
      </div>
    </div>
  );
}

function LegendBar({ label, color, pct }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span>{label}</span>
        <span>{Math.round(pct * 100)}%</span>
      </div>
      <div className="w-full bg-gray-700 h-2 rounded-full">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

export default function ArchitectsForgeLanding() {
  useLenis(); // activate smooth-scroll

  return (
    <div className="bg-black text-white overflow-x-hidden font-sans">
      {/* ───────────────── Hero ───────────────── */}
      <section className="relative h-screen w-full flex items-center justify-center select-none">
        {/* background video (behind stars) */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60 z-0 pointer-events-none"
          src="/forgeIntro.mp4"
        />
        {/* starfield overlay */}
        <Starfield className="absolute inset-0 z-10" />
        <div className="relative z-10 text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            className="text-5xl md:text-7xl font-extrabold tracking-wide"
          >
            Architects-Forge.Org
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="mt-4 text-xl md:text-2xl text-gray-300"
          >
            ISRM: A coherence-driven theory of adaptation from atoms to AI
          </motion.p>
        </div>
        {/* scrolling cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-400"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor">
            <path d="M12 5v14m0 0l-6-6m6 6l6-6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.div>
      </section>

      {/* ──────────────── Divider SVG ──────────────── */}
      <svg viewBox="0 0 1440 150" className="w-full text-black -mt-1" preserveAspectRatio="none">
        <path fill="currentColor" d="M0,0 C480,120 960,0 1440,120 L1440,0 L0,0 Z" />
      </svg>

      {/* ───────────────── About ───────────────── */}
      <section className="bg-white text-black py-32 px-6 md:px-16 relative overflow-hidden">
        <Parallax speed={0.3} className="absolute -top-20 right-0 w-1/2 opacity-100 pointer-events-none">
          <img src="/fractal.png" alt="fractal" className="w-full" />
        </Parallax>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-4xl"
        >
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">What is Consciousness?</h2>
          <p className="text-lg md:text-xl leading-relaxed">
            According to ISRM: Interactionist Self-Regulation Model, consciousness is not a constant state of being, but a metabolically-justified update process that is triggered when the survival cost of ignoring a prediction error exceeds the energetic cost of resolving it.


          </p>
        </motion.div>
      </section>
      {/* ───────────────── Tech Cards ───────────────── */}
      <section className="bg-white text-black py-24 px-6 md:px-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto"
        >
          {[
            { title: "It's a solution to an energy problem", body: "Constantly updating a complex system's model of reality is energetically impossible. Consciousness is the evolutionary adaptation that creates a 'gatekeeper' to decide which pieces of information are actually worth the immense cost of a system-wide update." },
            { title: "It's a calculation", body: "An event becomes 'conscious' only when the core equation is satisfied: when the Salience-Weighted Prediction Error is greater than the current Energetic Cost plus a baseline Threshold. Below that threshold, the information is handled by non-conscious processes." },
            { title: "It's a physical feeling", body: "The subjective experience of consciousness—the 'what it is like' is the feeling of the system's massive metabolic and informational state change during that global update. It is the feeling of your own model of reality breaking and being rebuilt." },
          ].map((item) => (
            <motion.div
              key={item.title}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
              className="p-8 border border-gray-200 rounded-lg shadow-lg backdrop-blur-sm bg-white/60"
            >
              <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-700 leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
      
      {/* ───────────────── Tech Cards ───────────────── */}
      
      

      {/* ───────────────── About ───────────────── */}

      
        
      <section className="bg-white text-black py-32 px-6 md:px-16 relative overflow-hidden">
        <Parallax speed={0.2} className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 opacity-10 pointer-events-none">
  <img src="/fractal2.png" alt="fractal" className="w-full" />
</Parallax>


        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-4xl"
        >
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">How is Consciousness a Product of Constraint?</h2>
          <p className="text-lg md:text-xl leading-relaxed">
            Consciousness is not a luxury, it's an emergency system. It activates when constraint makes automatic behavior insufficient. In the ISRM framework, this process unfolds between two interacting systems: The Physical System 'PS' is the body, brain, or hardware - The part that senses, acts, and metabolizes. It executes behavior automatically when predictions are stable. The Observer System 'OS' is the internal modeler - The part that monitors reality, predicts outcomes, evaluates errors, and decides when to intervene. When the PS encounters rising unpredictability, stress, or energy imbalance, and its automatic responses no longer preserve coherence, the OS steps in. It becomes active only when required, to regulate the PS, restore stability, and minimize energetic waste. Consciousness emerges at the point where the OS must actively model the PS under constraint - making selective, energy-aware decisions in a world that punishes error.


          </p>
        </motion.div>
      </section>
      {/* ───────────────── Tech Cards ───────────────── */}
      <section className="bg-white text-black py-24 px-6 md:px-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto"
        >
          {[
            { title: "Constraint forces choices", body: "Without limits — of energy, time, attention, or survival — there would be no need to choose or regulate anything. If a system could do everything at once with no cost, it wouldn't need consciousness. Consciousness exists because the system must decide what to do next and what to ignore." },
            { title: "Prediction error under constraint demands modeling", body: "When the world becomes unpredictable and resources are limited, the system must: Prioritize attention, Reduce uncertainty, Choose efficient actions. This requires an Observer System (OS) to model the world and itself, and consciousness emerges when that modeling becomes active under pressure." },
            { title: "Updates cost energy, so it only happens when needed", body: "The brain (or any adaptive system) cannot constantly update everything. It's energentically expensive. The system stays unconscious until the cost of staying the same becomes higher than the cost of updating. This trade-off defines consciousness: It is the act of re-aligning the system under constraint to preserve coherence." },
            

          ].map((item) => (
            <motion.div
              key={item.title}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
              className="p-8 border border-gray-200 rounded-lg shadow-lg backdrop-blur-sm bg-white/60"
            >
              <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-700 leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
     
      {/* ───────────────── Tech Cards ───────────────── */}
      {/* ───────────────── About ───────────────── */}
      <section className="bg-white text-black py-32 px-6 md:px-16 relative overflow-hidden">
        <div className="absolute top-60 right-20 max-w-lg text-left z-20">
  <div className="text-2xl md:text-4xl font-mono text-black/30 hover:text-black transition duration-300 cursor-help group">
    <InlineMath math="U(t) = \sum (PE_i \cdot S_i) - E_c" />
    <div className="mt-2 hidden group-hover:block text-sm bg-white/90 text-black border border-gray-300 rounded p-3 shadow-xl">
      <p><strong>U(t)</strong>: Urgency of conscious update at time <em>t</em></p>
      <p><strong>PE<sub>i</sub></strong>: Prediction error for input <em>i</em></p>
      <p><strong>S<sub>i</sub></strong>: Salience of input <em>i</em></p>
      <p><strong>E<sub>c</sub></strong>: Energy cost of updating the model</p>
      <p className="mt-1 italic">When U(t) rises above threshold, consciousness activates.</p>
    </div>
  </div>
</div>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-4xl"
        >
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">Can Consciousness Be Measured?</h2>
          <p className="text-lg md:text-xl leading-relaxed">
            In the ISRM framework — YES!
Consciousness is not magic, nor is it a binary switch. It's a dynamic process that arises when a system must regulate itself under constraint. To calculate it, we track how often and how intensely the system must update its model in response to prediction error, salience, and energy cost.
Below, we break it down into three core components of the ISRM calculation.


          </p>
        </motion.div>
      </section>
      <section className="bg-white text-black py-24 px-6 md:px-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto"
        >
          {[
            { title: "U(t): The Consciousness Urgency Function", body: "U(t) measures the pressure on the Observer System to act. It rises when prediction error is high energy is low, and coherence is collapsing. Consciousness intensifies as U(t) increases, not because the system 'wants' to be conscious, but because it must act to survive or adapt" },
            { title: "Prediction Error x Salience = Update Demand", body: "Not all surprises trigger consciousness. What matters is how important the surprise is (salience) and how wrong the model was (error). ISRM multiplies these factors to calculate when and update is needed, and when the OS must 'wake up' to re-evaluate reality." },
            { title: "Energy Cost of Model Update", body: "Consciousness isn't free. Each update uses energy. The more costly the correction (due to uncertainty, ambiguity, or system overload), the higher the conscious load. If energy constraints are severe, the system either adapts consciously, or collapses into incoherence." },
          ].map((item) => (
            <motion.div
              key={item.title}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
              className="p-8 border border-gray-200 rounded-lg shadow-lg backdrop-blur-sm bg-white/60"
            >
              <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-700 leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
 <footer className="py-10 bg-black text-gray-500 text-center text-sm">
        © {new Date().getFullYear()} Architects-Forge.Org - Schell, J.P. Interactionist Self-Regulation Model (ISRM): A Unifying Principle of Adaptive Systems. 2025. https://isrm-framework.org
      </footer>
      {/* ───────────────── Update Signal Potential Visualization Section ───────────────── */}
      <section className="bg-gradient-to-r from-blue-900 to-purple-900 text-white py-32 px-6 md:px-16 relative overflow-hidden">
        <Parallax speed={0.2} className="absolute top-1/4 right-1/4 w-1/2 opacity-10 pointer-events-none">
          <img src="/fractal.png" alt="fractal" className="w-full" />
        </Parallax>
        
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">Experience the Update Signal Potential</h2>
          <div className="mb-8 text-xl md:text-2xl font-mono bg-black/30 p-4 rounded-lg inline-block">
            <InlineMath math="U(t) = (αM(t) + βσ^2(t)) \cdot (E_{max} - γ\int_0^t U(τ)dτ + I(t)) \cdot δ|S_{PS}(t) - S_{OS}(t)|" />
          </div>
          <p className="text-lg md:text-xl leading-relaxed mb-10">
            The Update Signal Potential equation is the mathematical heart of the ISRM framework. It determines when a system should update its internal model based on prediction errors, available energy, and the salience of incoming information. Rather than just reading about it, you can now interact with this equation and see how changes to parameters affect the system's behavior in real-time.
          </p>
          
          {/* Inline interactive USP simulation */}
          <div className="mt-10">
            <InlineUSPVisualization />
          </div>

          <p className="mt-8 text-sm text-gray-300">
            Adjust parameters like salience weights, energy constraints, and prediction-error sensitivity to observe their impact on update behaviour in real-time.
          </p>
        </motion.div>
      </section>

<footer className="py-10 bg-black text-gray-500 text-center text-sm">
        © {new Date().getFullYear()} Schell, J.P. Interactionist Self-Regulation Model (ISRM): A Unifying Principle of Adaptive Systems. 2025. https://isrm-framework.org
      </footer>
            {/* ───────────────── About ───────────────── */}
      <section className="bg-white text-black py-32 px-6 md:px-16 relative overflow-hidden">
        <div className="absolute top-60 right-20 max-w-lg text-left z-20">
    <div className="text-2xl md:text-4xl font-mono text-black/30 hover:text-black transition duration-300 cursor-help group">
      <InlineMath math="U(t) = C(t) - \sum (P_i(t) \cdot E_i(t))" />
      <div className="mt-2 hidden group-hover:block text-sm bg-white/90 text-black border border-gray-300 rounded p-3 shadow-xl">
        <p><strong>U(t)</strong>: Utility or coherence-sustaining capacity at time <em>t</em></p>
        <p><strong>C(t)</strong>: Coherence level—how well the internal model matches reality</p>
        <p><strong>P<sub>i</sub>(t)</strong>: Prediction error of subsystem <em>i</em></p>
        <p><strong>E<sub>i</sub>(t)</strong>: Energy cost of correcting or updating subsystem <em>i</em></p>
        <p className="mt-1 italic">When U(t) drops too low, the system destabilizes or fails to adapt.</p>
    </div>
  </div>
</div>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-4xl"
        >
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">What About All Adaptive Systems?</h2>
          <p className="text-lg md:text-xl leading-relaxed">
            The Interactionist Self-Regulation Model (ISRM) is a universal framework for understanding how systems—biological, artificial, or physical—maintain coherence over time under energetic constraint. At its core, ISRM tracks the balance between internal prediction errors and the energy required to resolve them. Whether it's a conscious mind navigating uncertainty, a cell repairing damage, or an AI adapting to input, all adaptive behavior can be framed through ISRM's fundamental utility equation. Consciousness is just one specialized expression of this deeper principle.


          </p>
        </motion.div>
      </section>
      <section className="bg-white text-black py-24 px-6 md:px-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto"
        >
          {[
            { title: "Neuroscience & Consciousness Research", body: "ISRM offers a unifying explanation for perception, attention, and awareness by modeling consciousness as the selective regulation of coherence under energetic constraint. Unlike other models that treat consciousness as a binary state or emergent mystery, ISRM frames it as a dynamic utility optimization problem—where prediction error, salience, and limited energy determine what enters awareness and how the system adapts. This enables new insights into trauma, anesthesia, psychedelics, and attentional disorders." },
            { title: "Synthetic Biology & Cellular Engineering", body: "In cellular systems, ISRM provides a powerful lens for understanding how living organisms maintain homeostasis and decision-making across noisy biochemical environments. By treating organelles, signaling networks, and even single cells as embedded Observer Systems regulating coherence, ISRM opens the door to programming synthetic cells that can adaptively respond to injury, mutation, or environmental fluctuation with intelligent energy budgeting—an essential step for regenerative medicine and programmable biology." },
            { title: "Quantum & Atomic Matter", body: "ISRM introduces a new perspective on quantum systems by treating wavefunction collapse as an energetically constrained coherence event. Rather than viewing particles as probabilistic abstractions, ISRM models each quantum system as a self-regulating unit that maintains coherence until prediction error—driven by entanglement, observation, or decoherence—exceeds an energy threshold. At the atomic scale, this explains stable bonding, molecular geometry, and orbital transitions as outcomes of adaptive coherence regulation, not just statistical behavior." },
            { title: "Cosmology & the Expanding Universe", body: "At the largest scales, ISRM provides an alternative lens for understanding entropy, inflation, and cosmic expansion. The universe itself can be modeled as a nested Observer System whose structure evolves to minimize prediction error under finite energetic constraints. Phenomena like dark energy, gravitational clustering, and black hole entropy can be reframed as coherence collapse or redistribution across the fabric of spacetime. ISRM offers a framework where the cosmos isn’t passively decaying—but actively managing its structure to delay systemic breakdown." },
            { title: "The Nature of Time", body: "In ISRM, time is not a fundamental dimension but an emergent consequence of internal state updating. When prediction error forces a coherent system to change—costing energy—time is perceived. Thus, time is the signature of adaptation, the residue of coherence lost and rebuilt. This view unifies biological time (subjective experience), thermodynamic time (entropy increase), and relativistic time (observer-dependent flow) into a single principle: time is the cost of not knowing." },
            { title: "Artificial Intelligence & Autonomous Agents", body: "ISRM redefines AI decision-making by replacing rigid rule-based logic with a coherence-based survival framework. Instead of maximizing reward minimizing error alone, agents maintain operational utility U(t) by weighing the energetic cost of perception and action against the importance of prediction error. This creates agents that behave less like machines and more like resilient organisms—capable of conserving resources, ignoring irrelevant distractions, and surviving novel environments without explicit programming." },
          ].map((item) => (
            <motion.div
              key={item.title}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
              className="p-8 border border-gray-200 rounded-lg shadow-lg backdrop-blur-sm bg-white/60"
            >
              <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-700 leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
{/* ───────────────── ProjectFluctusSim Section ───────────────── */}
      <section
        /* Ensure the simulation has room, dark backdrop and is not hidden */
        className="relative min-h-[800px] flex items-center justify-center z-20 bg-white border-b border-gray-700"
      >
        {/* Title / small description */}
        <div className="absolute top-10 w-full text-center pointer-events-none">
          <h2 className="text-3xl font-bold text-white">Project Fluctus Simulation</h2>
          <p className="text-gray-400 text-sm mt-2">
            Interactive coherence-driven particle field (move mouse / click)
          </p>
        </div>

        {/* Let the component expand to fill the wrapper */}
        {/* fill entire section; width / height via tailwind for validity */}
        <ProjectFluctusSim className="w-full h-full" />
      </section>
      <footer className="py-10 bg-black text-white-500 text-center text-lg">
         A real-time ISRM-based visualization of H₂O coherence, prediction error, and emergent phase behavior. Don't miss the Temperature Slider in the top right corner.
      </footer>
      {/* ───────────────── Network Confirmation Model Section (static mockup) ───────────────── */}
      <section className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white py-32 px-6 md:px-16 relative overflow-hidden">
        <Parallax speed={0.15} className="absolute top-1/3 left-1/4 w-1/2 opacity-10 pointer-events-none">
          <img src="/fractal2.png" alt="fractal background" className="w-full" />
        </Parallax>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-5xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">
            Network Confirmation Model
          </h2>
          <p className="text-lg md:text-xl leading-relaxed mb-10 px-4">
            Explore how multiple Observer Systems collaboratively build consensus
            about a changing Physical System—demonstrating how distributed confirmation
            can give rise to an emergent, energy-efficient form of consciousness.
          </p>

          {/* Interactive Network Visualization */}
          <div className="mt-10">
            <ErrorBoundary>
              <NetworkVisualWithAnimation />
            </ErrorBoundary>
          </div>
        </motion.div>
      </section>

      {/* ──────────────── Divider SVG ──────────────── */}
      <svg viewBox="0 0 1440 150" className="w-full text-black -mt-1" preserveAspectRatio="none">
        <path fill="currentColor" d="M0,0 C480,120 960,0 1440,120 L1440,0 L0,0 Z" />
      </svg>
      
      {/* ───────────────── Vision Section ───────────

      
      
      {/* ───────────────── Vision Section ───────────────── */}
      <section className="relative h-[120vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black">
        <Parallax speed={0.2} className="absolute inset-0">
          <img src="/nebula.jpg" alt="nebula" className="w-full h-full object-cover opacity-30" />
        </Parallax>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-3xl text-center px-6"
        >
          <h2 className="text-4xl md:text-4xl font-bold mb-6">ISRM reveals the path to a better understanding of ALL adaptive systems</h2>
          <p className="text-xl md:text-2xl text-gray-300">
            Join Us In This New Frontier Of Exploration & Discovery!
          </p>
        </motion.div>
      </section>

      {/* ───────────────── Tech Cards ───────────────── */}
      
      <section className="bg-white text-black py-24 px-6 md:px-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto"
        >
          {[
            { title: "ISRM Introduces an explanatory mechanism for emergent order", body: "Traditional thermodynamics and statistical mechanics say 'Order emerges probabilistically due to energy minimization and entropy' ISRM says: 'Order emerges from distributed agents that maintain internal predictive coherence under energetic constraint." },
            { title: "ISRM Bridges micro and macro with a unifying logic", body: "Physics often lacks continuity of explanation across scales. Quantum mechanics explains atoms, thermodynamics explains bulk behavior, Neuroscience explains brains. ISRM applies the same principle (U(t)) minimization) from molecules to brains to the cosmos. This is unique." },
            { title: "ISRM Reinterprets cognition as physical regulation", body: "Rather than cognition being something emergent only in brains, ISRM treats it as a gradient property of any system that predicts and acts to sustain coherence. This offers a naturalized path towards understanding AI, Biological Consciousness, and Adaptive matter." },
            { title: "Does ISRM overstate its usefulness?", body: "Only if misunderstood. ISRM does NOT replace quantum chemistry, relativity, or thermodynamics. It doesn't derive fundamental constants (yet). It doesn't make deterministic predictions for chaotic systems." },
            { title: "Where ISRM is appropriately useful", body: "ISRM adds a new layer of interpretive power. It guides new simulations and experiments. It allows us to model intelligence and regulation using energetic terms. It can integrate AI, physics, and biology under a singel predictive framework." },
            { title: "ISRM in a Nutshell", body: "It's not a 'Theory of Everything.' It's a Framework of Coherent Regulation Across Scales. It doesn't negate other theories, it explains why and when they work, from a constraint-based, observer-centric view." },
          ].map((item) => (
            <motion.div
              key={item.title}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
              className="p-8 border border-gray-200 rounded-lg shadow-lg backdrop-blur-sm bg-white/60"
            >
              <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-700 leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ───────────────── Call-to-Action ───────────────── */}
      <section className="relative py-32 bg-gradient-to-tr from-indigo-700 via-purple-700 to-pink-700 text-center">
        <motion.h2
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-4xl md:text-3xl font-bold mb-6"
        >
          Learn the framework of the Interactionist Self-Regulation Model, at ISRM-Framework.Org
        </motion.h2>
        <motion.a
  href="https://isrm-framework.org"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md transition"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.3 }}
  viewport={{ once: true }}
>
  ISRM-Framework.Org
</motion.a>

      </section>

      {/* ───────────────── Footer ───────────────── */}
      <footer className="py-10 bg-black text-gray-500 text-center text-sm">
        © {new Date().getFullYear()} Architects-Forge.Org - Schell, J.P. Interactionist Self-Regulation Model (ISRM): A Unifying Principle of Adaptive Systems. 2025. https://isrm-framework.org
      </footer>
    </div>
  );
}
