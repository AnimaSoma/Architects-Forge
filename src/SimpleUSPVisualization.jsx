import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * SimpleUSPVisualization Component
 * 
 * A minimal implementation of the Update Signal Potential equation visualization
 * using only basic HTML elements and React. No external libraries required.
 * 
 * U(t) = (αM(t) + βσ²(t)) · (Emax - γ∫₀ᵗ U(τ)dτ + I(t)) · δ|SPS(t) - SOS(t)|
 */
const SimpleUSPVisualization = () => {
  // Energy mode options
  const ENERGY_MODES = {
    NATURAL: 'natural',
    DRAMATIC: 'dramatic',
    EDUCATIONAL: 'educational'
  };

  // Single state object to minimize re-renders
  const [state, setState] = useState({
    // Parameters
    params: {
      alpha: 1.0,         // α - Weight for magnitude
      beta: 0.5,          // β - Weight for variance
      delta: 1.0,         // δ - Prediction error sensitivity
      gamma: 0.3,         // γ - Energy cost factor
      eMax: 100.0,        // Maximum energy capacity
      energyInflux: 0.5,  // Energy recovery rate
      updateThreshold: 20.0, // Threshold for update events
      updateRate: 0.7     // Rate of observer system updates
    },
    // Simulation state
    time: 0,
    updateSignal: 0,
    salience: 0,
    energyBudget: 100.0,
    lastEnergyBudget: 100.0,
    predictionError: 0,
    uIntegral: 0,
    physicalSystem: 0.5,
    observerSystem: 0.1,
    running: false,
    updateCount: 0,
    lastUpdateTime: 0,
    energyDrainEffect: false,
    energyMode: ENERGY_MODES.NATURAL, // Default energy mode
    lastUpdateEnergy: 0, // Energy at last update
    energyPhase: 'stable', // Current phase of energy (for educational mode)
    phaseStartTime: 0, // When the current phase started
    energyChangeRate: 0 // Current rate of energy change
  });

  // Animation frame reference
  const animationRef = useRef(null);
  // Hold latest running flag to avoid stale closure
  const runningRef = useRef(state.running);
  // Educational mode cycle data
  const educationalCycleRef = useRef({
    phase: 'stable', // 'stable', 'depleting', 'recovering'
    startTime: Date.now(),
    duration: 5000, // milliseconds per phase
    nextPhase: {
      stable: 'depleting',
      depleting: 'recovering',
      recovering: 'stable'
    }
  });
  
  // Show update event notification
  const [showUpdateEvent, setShowUpdateEvent] = useState(false);
  // Show energy phase change notification
  const [showPhaseChangeNotice, setShowPhaseChangeNotice] = useState(false);
  
  // State change indicator
  const [stateChangeIndicator, setStateChangeIndicator] = useState({
    active: false,
    phase: 0 // 0: inactive, 1: expanding, 2: color change, 3: contracting
  });

  // Calculate next state based on current state
  const calculateNextState = (prev) => {
    try {
      const {
        params, 
        physicalSystem, 
        observerSystem, 
        uIntegral, 
        time, 
        energyBudget, 
        lastEnergyBudget,
        energyMode,
        energyPhase,
        phaseStartTime
      } = prev;
      
      // Fixed time step - slowed down for smoother simulation
      const dt = 0.05;
      
      // Calculate prediction error
      const error = Math.abs(physicalSystem - observerSystem);
      const predictionError = params.delta * error;
      
      // Calculate salience
      const errorVariance = error * 0.1 * (1 + Math.random() * 0.5);
      const salience = params.alpha * error + params.beta * errorVariance;
      
      // Calculate update signal
      const updateSignal = salience * energyBudget * predictionError;
      
      // New physical system state (smoother oscillation with less randomness)
      const newPhysicalSystem = 0.5 * Math.sin(0.05 * (time + dt)) + 0.05 * (Math.random() - 0.5);
      
      // Determine if update should occur
      const shouldUpdate = updateSignal > params.updateThreshold;
      
      // Calculate new observer system
      let newObserverSystem = observerSystem;
      let updateCount = prev.updateCount;
      let lastUpdateTime = prev.lastUpdateTime;
      let lastUpdateEnergy = prev.lastUpdateEnergy;
      let energyDrainEffect = false;
      
      // Energy calculation based on selected mode
      let energyCost = 0;
      let energyInflux = 0;
      let newEnergyPhase = energyPhase;
      let newPhaseStartTime = phaseStartTime;
      
      // ===== ENERGY MODE HANDLING =====
      
      // Natural Mode: Subtle fluctuations based on parameters
      if (energyMode === ENERGY_MODES.NATURAL) {
        // Base energy recovery
        energyInflux = params.energyInflux * dt;
        
        // Background energy drain (very small)
        const backgroundDrain = 0.02 * dt;
        
        // Update signal based drain (proportional to update signal)
        const signalDrain = params.gamma * updateSignal * dt;
        
        // Calculate total energy cost
        energyCost = backgroundDrain + signalDrain;
        
        // Handle update events
        if (shouldUpdate) {
          // Cost based on error magnitude (10-20% of current energy)
          const updateCost = energyBudget * (0.1 + error * 0.1);
          energyCost += updateCost;
          energyDrainEffect = true;
          lastUpdateEnergy = energyBudget;
        }
      }
      
      // Dramatic Mode: More pronounced fluctuations
      else if (energyMode === ENERGY_MODES.DRAMATIC) {
        // More variable energy recovery
        const recoveryVariation = 0.5 + 0.5 * Math.sin(time * 0.2);
        energyInflux = params.energyInflux * dt * recoveryVariation;
        
        // Higher background drain
        const backgroundDrain = 0.05 * dt;
        
        // More significant signal-based drain
        const signalDrain = params.gamma * updateSignal * dt * 2;
        
        // Random energy events (occasional spikes and drops)
        const randomEvent = Math.random() < 0.03 ? (Math.random() * 10 - 5) : 0;
        
        // Calculate total energy cost
        energyCost = backgroundDrain + signalDrain - randomEvent;
        
        // Handle update events
        if (shouldUpdate) {
          // Higher cost based on error magnitude (20-40% of current energy)
          const updateCost = energyBudget * (0.2 + error * 0.2);
          energyCost += updateCost;
          energyDrainEffect = true;
          lastUpdateEnergy = energyBudget;
        }
      }
      
      // Educational Mode: Clear cyclical pattern
      else if (energyMode === ENERGY_MODES.EDUCATIONAL) {
        const now = Date.now();
        const elapsedTime = now - phaseStartTime;
        const cycle = educationalCycleRef.current;
        
        // Check if we need to transition to next phase
        if (elapsedTime > cycle.duration) {
          newEnergyPhase = cycle.nextPhase[energyPhase];
          newPhaseStartTime = now;
          setShowPhaseChangeNotice(true);
          setTimeout(() => setShowPhaseChangeNotice(false), 2000);
        }
        
        // Energy behavior based on current phase
        if (newEnergyPhase === 'stable') {
          // Stable phase: energy stays high with minor fluctuations
          energyInflux = params.energyInflux * dt * 2;
          energyCost = 0.01 * dt;
          
          // Small random fluctuations
          if (Math.random() < 0.1) {
            energyCost += Math.random() * 0.5;
          }
        }
        else if (newEnergyPhase === 'depleting') {
          // Depleting phase: energy drops steadily
          energyInflux = params.energyInflux * dt * 0.2;
          
          // Progressive drain based on phase progress
          const phaseProgress = elapsedTime / cycle.duration;
          energyCost = 0.1 * dt * (1 + phaseProgress * 3);
          energyDrainEffect = phaseProgress > 0.5;
        }
        else if (newEnergyPhase === 'recovering') {
          // Recovering phase: energy recovers steadily
          const phaseProgress = elapsedTime / cycle.duration;
          energyInflux = params.energyInflux * dt * (2 + phaseProgress * 3);
          energyCost = 0.01 * dt;
        }
        
        // Handle update events
        if (shouldUpdate) {
          // Cost depends on current phase
          let updateCost = 0;
          
          if (newEnergyPhase === 'stable') {
            updateCost = energyBudget * 0.15;
          } else if (newEnergyPhase === 'depleting') {
            updateCost = energyBudget * 0.3;
          } else if (newEnergyPhase === 'recovering') {
            updateCost = energyBudget * 0.1;
          }
          
          energyCost += updateCost;
          energyDrainEffect = true;
          lastUpdateEnergy = energyBudget;
        }
      }
      
      // Handle updates to observer system
      if (shouldUpdate) {
        // Smoother transition to new state
        newObserverSystem = observerSystem + params.updateRate * (newPhysicalSystem - observerSystem) * 0.7;
        updateCount += 1;
        lastUpdateTime = time;
        
        // Show update notification
        setShowUpdateEvent(true);
        setTimeout(() => setShowUpdateEvent(false), 3000);
        
        // Activate state change indicator
        setStateChangeIndicator({
          active: true,
          phase: 1
        });
        
        // State change animation sequence
        setTimeout(() => {
          setStateChangeIndicator({ active: true, phase: 2 });
          
          setTimeout(() => {
            setStateChangeIndicator({ active: true, phase: 3 });
            
            setTimeout(() => {
              setStateChangeIndicator({ active: false, phase: 0 });
            }, 1000);
          }, 1000);
        }, 1000);
      }
      
      // Calculate new energy budget with depletion
      const newEnergyBudget = Math.max(
        0, 
        Math.min(
          params.eMax,
          energyBudget - energyCost + energyInflux
        )
      );
      
      // Calculate energy change rate for visualization
      const energyChangeRate = (newEnergyBudget - energyBudget) / dt;
      
      return {
        ...prev,
        time: time + dt,
        updateSignal,
        salience,
        lastEnergyBudget: energyBudget,
        energyBudget: newEnergyBudget,
        predictionError,
        uIntegral: uIntegral + (updateSignal * dt) - (0.01 * uIntegral * dt), // with decay
        physicalSystem: newPhysicalSystem,
        observerSystem: newObserverSystem,
        updateCount,
        lastUpdateTime,
        lastUpdateEnergy,
        energyDrainEffect,
        energyPhase: newEnergyPhase,
        phaseStartTime: newPhaseStartTime,
        energyChangeRate
      };
    } catch (error) {
      console.error("Calculation error:", error);
      return {
        ...prev,
        running: false
      };
    }
  };
  
  // Animation step
  const animationStep = useCallback(() => {
    // Functional update to always use freshest state
    setState(prev => calculateNextState(prev));

    if (runningRef.current) {
      animationRef.current = requestAnimationFrame(animationStep);
    }
  }, []);
  
  // Toggle simulation running state
  const toggleSimulation = useCallback(() => {
    setState(prev => ({
      ...prev,
      running: !prev.running
    }));
  }, []);
  
  // Change energy mode
  const changeEnergyMode = useCallback((mode) => {
    setState(prev => ({
      ...prev,
      energyMode: mode,
      energyPhase: mode === ENERGY_MODES.EDUCATIONAL ? 'stable' : prev.energyPhase,
      phaseStartTime: mode === ENERGY_MODES.EDUCATIONAL ? Date.now() : prev.phaseStartTime
    }));
    
    // Reset educational cycle reference
    if (mode === ENERGY_MODES.EDUCATIONAL) {
      educationalCycleRef.current = {
        ...educationalCycleRef.current,
        phase: 'stable',
        startTime: Date.now()
      };
    }
  }, []);
  
  // Reset simulation
  const resetSimulation = useCallback(() => {
    setState({
      params: {
        alpha: 1.0,
        beta: 0.5,
        delta: 1.0,
        gamma: 0.3,
        eMax: 100.0,
        energyInflux: 0.5,
        updateThreshold: 20.0,
        updateRate: 0.7
      },
      time: 0,
      updateSignal: 0,
      salience: 0,
      energyBudget: 100.0,
      lastEnergyBudget: 100.0,
      predictionError: 0,
      uIntegral: 0,
      physicalSystem: 0.5,
      observerSystem: 0.1,
      running: false,
      updateCount: 0,
      lastUpdateTime: 0,
      energyDrainEffect: false,
      energyMode: ENERGY_MODES.NATURAL,
      lastUpdateEnergy: 0,
      energyPhase: 'stable',
      phaseStartTime: Date.now(),
      energyChangeRate: 0
    });
    setShowUpdateEvent(false);
    setShowPhaseChangeNotice(false);
    setStateChangeIndicator({ active: false, phase: 0 });
    
    // Reset educational cycle
    educationalCycleRef.current = {
      phase: 'stable',
      startTime: Date.now(),
      duration: 5000,
      nextPhase: {
        stable: 'depleting',
        depleting: 'recovering',
        recovering: 'stable'
      }
    };
  }, []);
  
  // Update parameter
  const updateParameter = useCallback((paramName, value) => {
    setState(prev => ({
      ...prev,
      params: {
        ...prev.params,
        [paramName]: value
      }
    }));
  }, []);
  
  // Handle animation frame effect
  useEffect(() => {
    runningRef.current = state.running;

    if (state.running) {
      animationRef.current = requestAnimationFrame(animationStep);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.running, animationStep]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Reset energy drain effect after a short delay
  useEffect(() => {
    if (state.energyDrainEffect) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, energyDrainEffect: false }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.energyDrainEffect]);

  // Enhanced bar visualization component with special effects for energy
  const BarVisualization = ({ value, maxValue, label, color, isEnergy = false }) => {
    // Special styling for energy when it's low or draining
    let barColor = color;
    let pulseEffect = '';
    
    if (isEnergy) {
      // Change color based on energy level
      if (value < 30) {
        barColor = 'bg-red-500';
        pulseEffect = 'animate-pulse';
      } else if (value < 60) {
        barColor = 'bg-yellow-500';
      }
      
      // Add drain effect
      if (state.energyDrainEffect) {
        barColor = 'bg-red-600';
        pulseEffect = 'animate-pulse';
      }
      
      // Educational mode colors
      if (state.energyMode === ENERGY_MODES.EDUCATIONAL) {
        if (state.energyPhase === 'depleting') {
          barColor = 'bg-orange-500';
        } else if (state.energyPhase === 'recovering') {
          barColor = 'bg-blue-400';
        }
      }
    }
    
    return (
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">{label}</span>
          <span className={`text-sm font-medium ${isEnergy && value < 30 ? 'text-red-400' : ''}`}>
            {value.toFixed(2)}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4">
          <div 
            className={`h-4 rounded-full ${barColor} transition-all duration-700 ${pulseEffect}`} 
            style={{ width: `${Math.min(100, (value / maxValue) * 100)}%` }}
          />
        </div>
        {isEnergy && value < 20 && (
          <div className="text-xs text-red-400 mt-1 animate-pulse">
            Energy critically low! Recovery needed.
          </div>
        )}
        {isEnergy && state.energyMode === ENERGY_MODES.EDUCATIONAL && (
          <div className="text-xs text-purple-300 mt-1">
            Energy Phase: <strong className="capitalize">{state.energyPhase}</strong>
            {state.energyChangeRate > 0 ? 
              <span className="text-green-400"> (Increasing)</span> : 
              <span className="text-red-400"> (Decreasing)</span>
            }
          </div>
        )}
      </div>
    );
  };

  // State change indicator component
  const StateChangeIndicator = () => {
    if (!stateChangeIndicator.active) return null;
    
    let size = "60px";
    let color = "bg-blue-500";
    let transform = "scale(1)";
    
    if (stateChangeIndicator.phase === 1) {
      size = "80px";
      color = "bg-blue-500";
      transform = "scale(1.2)";
    } else if (stateChangeIndicator.phase === 2) {
      size = "80px";
      color = "bg-green-500";
      transform = "scale(1.2)";
    } else if (stateChangeIndicator.phase === 3) {
      size = "60px";
      color = "bg-green-500";
      transform = "scale(1)";
    }
    
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <div 
          className={`rounded-full ${color} flex items-center justify-center transition-all duration-1000 ease-in-out`}
          style={{ 
            width: size, 
            height: size, 
            transform,
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.6)'
          }}
        >
          <div className="text-white font-bold">OS</div>
        </div>
      </div>
    );
  };

  // Energy drain effect component
  const EnergyDrainEffect = () => {
    if (!state.energyDrainEffect) return null;
    
    return (
      <div
        className="absolute inset-0 bg-red-500/20 animate-pulse rounded-lg z-5 pointer-events-none"
        /* Prevents the pulse effect from triggering re-layouts */
        style={{ willChange: 'opacity', contain: 'paint' }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 font-bold text-2xl">
          ENERGY DRAIN
        </div>
      </div>
    );
  };

  // Energy phase indicator for Educational mode
  const EnergyPhaseIndicator = () => {
    if (state.energyMode !== ENERGY_MODES.EDUCATIONAL) return null;
    
    let bgColor = "bg-green-800/70";
    let message = "ENERGY STABLE";
    
    if (state.energyPhase === 'depleting') {
      bgColor = "bg-red-800/70";
      message = "ENERGY DEPLETING";
    } else if (state.energyPhase === 'recovering') {
      bgColor = "bg-blue-800/70";
      message = "ENERGY RECOVERING";
    }
    
    return (
      <div className={`absolute top-2 left-2 ${bgColor} px-2 py-1 rounded text-xs`}>
        {message}
      </div>
    );
  };

  // Energy mode selector component
  const EnergyModeSelector = () => {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-4">Energy Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => changeEnergyMode(ENERGY_MODES.NATURAL)}
            className={`py-2 px-4 rounded-md transition-colors duration-300 ${
              state.energyMode === ENERGY_MODES.NATURAL
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
          >
            <div className="font-medium">Natural</div>
            <div className="text-xs mt-1">Subtle parameter-based fluctuations</div>
          </button>
          
          <button
            onClick={() => changeEnergyMode(ENERGY_MODES.DRAMATIC)}
            className={`py-2 px-4 rounded-md transition-colors duration-300 ${
              state.energyMode === ENERGY_MODES.DRAMATIC
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
          >
            <div className="font-medium">Dramatic</div>
            <div className="text-xs mt-1">Pronounced fluctuations with random events</div>
          </button>
          
          <button
            onClick={() => changeEnergyMode(ENERGY_MODES.EDUCATIONAL)}
            className={`py-2 px-4 rounded-md transition-colors duration-300 ${
              state.energyMode === ENERGY_MODES.EDUCATIONAL
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
          >
            <div className="font-medium">Educational</div>
            <div className="text-xs mt-1">Clear cyclical pattern for demonstration</div>
          </button>
        </div>
        
        <div className="mt-4 bg-black/30 p-3 rounded text-sm">
          <h4 className="font-medium mb-2">Mode Description</h4>
          {state.energyMode === ENERGY_MODES.NATURAL && (
            <p className="text-gray-300">
              Natural mode simulates realistic energy dynamics based directly on your parameter settings.
              Energy costs are proportional to prediction errors and update signals, while recovery
              is determined by the Energy Influx parameter.
            </p>
          )}
          
          {state.energyMode === ENERGY_MODES.DRAMATIC && (
            <p className="text-gray-300">
              Dramatic mode amplifies energy fluctuations with higher costs for updates, random energy events,
              and more variable recovery rates. Great for visualizing the boom-bust cycle of energy expenditure.
            </p>
          )}
          
          {state.energyMode === ENERGY_MODES.EDUCATIONAL && (
            <p className="text-gray-300">
              Educational mode follows a clear three-phase cycle (stable → depleting → recovering) to demonstrate
              how energy constraints affect update decisions. Each phase lasts about 5 seconds and has distinct
              energy behaviors.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="bg-gradient-to-r from-blue-900 to-purple-900 text-white p-6 rounded-lg shadow-xl overflow-hidden isolation-auto"
      style={{ contain: 'content', transform: 'translateZ(0)', willChange: 'transform' }}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Update Signal Potential</h2>
        <div className="mb-6 text-xl font-mono bg-black/30 p-4 rounded-lg inline-block">
          U(t) = (αM(t) + βσ²(t)) · (E<sub>max</sub> - γ∫<sub>0</sub><sup>t</sup> U(τ)dτ + I(t)) · δ|S<sub>PS</sub>(t) - S<sub>OS</sub>(t)|
        </div>
        <p className="text-gray-300 max-w-3xl mx-auto">
          This visualization demonstrates how a system decides when to update its internal model
          based on prediction errors, available energy, and the salience of information.
        </p>
      </div>
      
      {/* Energy Mode Selector */}
      <EnergyModeSelector />
      
      {/* Parameter Controls */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-8">
        <h3 className="text-xl font-semibold mb-4">Parameter Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Salience Parameters */}
          <div className="space-y-4">
            <h4 className="font-medium">Salience Parameters</h4>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>α (Alpha): {state.params.alpha.toFixed(1)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Weight for magnitude component in salience">?</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1" 
                value={state.params.alpha}
                onChange={(e) => updateParameter('alpha', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 mt-1">
                Higher values make large errors more salient
              </div>
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>β (Beta): {state.params.beta.toFixed(1)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Weight for variance component in salience">?</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1" 
                value={state.params.beta}
                onChange={(e) => updateParameter('beta', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 mt-1">
                Higher values make variable errors more salient
              </div>
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>δ (Delta): {state.params.delta.toFixed(1)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Sensitivity parameter for prediction error">?</span>
              </label>
              <input 
                type="range" 
                min="0.1" 
                max="3" 
                step="0.1" 
                value={state.params.delta}
                onChange={(e) => updateParameter('delta', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 mt-1">
                Overall sensitivity to prediction errors
              </div>
            </div>
          </div>
          
          {/* Energy Parameters */}
          <div className="space-y-4">
            <h4 className="font-medium">Energy Parameters</h4>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>E<sub>max</sub>: {state.params.eMax.toFixed(1)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Maximum energy capacity">?</span>
              </label>
              <input 
                type="range" 
                min="50" 
                max="200" 
                step="10" 
                value={state.params.eMax}
                onChange={(e) => updateParameter('eMax', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 mt-1">
                Maximum energy storage capacity
              </div>
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>γ (Gamma): {state.params.gamma.toFixed(2)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Cost scaling factor for energy expenditure">?</span>
              </label>
              <input 
                type="range" 
                min="0.01" 
                max="1.0" 
                step="0.01" 
                value={state.params.gamma}
                onChange={(e) => updateParameter('gamma', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 mt-1">
                Higher values increase energy costs for updates
              </div>
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>Energy Influx: {state.params.energyInflux.toFixed(2)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Rate of energy recovery">?</span>
              </label>
              <input 
                type="range" 
                min="0.1" 
                max="1.0" 
                step="0.1" 
                value={state.params.energyInflux}
                onChange={(e) => updateParameter('energyInflux', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 mt-1">
                Rate at which energy is replenished
              </div>
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>Update Threshold: {state.params.updateThreshold.toFixed(1)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Threshold above which an update occurs">?</span>
              </label>
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="1" 
                value={state.params.updateThreshold}
                onChange={(e) => updateParameter('updateThreshold', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 mt-1">
                Update Signal must exceed this to trigger an update
              </div>
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>Update Rate: {state.params.updateRate.toFixed(1)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Rate at which the observer system updates when threshold is exceeded">?</span>
              </label>
              <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.1" 
                value={state.params.updateRate}
                onChange={(e) => updateParameter('updateRate', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 mt-1">
                How quickly OS moves toward PS during updates
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Simulation Controls */}
      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={toggleSimulation}
          className="py-2 px-6 bg-blue-600 hover:bg-blue-700 rounded-md shadow text-lg transition-colors duration-300"
        >
          {state.running ? 'Pause Simulation' : 'Start Simulation'}
        </button>
        
        <button
          onClick={resetSimulation}
          className="py-2 px-6 bg-gray-600 hover:bg-gray-700 rounded-md shadow text-lg transition-colors duration-300"
        >
          Reset
        </button>
      </div>
      
      {/* Update Event Notification */}
      {showUpdateEvent && (
        <div className="bg-green-600/30 border border-green-500 p-3 rounded-md mb-8 text-center animate-pulse">
          <strong>Update Event Occurred!</strong> The Observer System has updated its internal model.
          {state.energyBudget < 40 && (
            <div className="text-red-400 text-sm mt-1">Warning: Energy reserves depleted!</div>
          )}
        </div>
      )}
      
      {/* Energy Phase Change Notification */}
      {showPhaseChangeNotice && state.energyMode === ENERGY_MODES.EDUCATIONAL && (
        <div className="bg-purple-600/30 border border-purple-500 p-3 rounded-md mb-8 text-center animate-pulse">
          <strong>Energy Phase Change!</strong> Entering <span className="font-bold capitalize">{state.energyPhase}</span> phase.
          <div className="text-blue-300 text-sm mt-1">
            {state.energyPhase === 'stable' && "Energy levels will remain high with minor fluctuations."}
            {state.energyPhase === 'depleting' && "Energy will steadily decrease as resources are consumed."}
            {state.energyPhase === 'recovering' && "Energy will gradually recover back to higher levels."}
          </div>
        </div>
      )}
      
      {/* Visualizations */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 relative">
        <h3 className="text-xl font-semibold mb-4">Current Values</h3>
        
        {/* State Change Indicator */}
        <StateChangeIndicator />
        
        {/* Energy Drain Effect Overlay */}
        <EnergyDrainEffect />
        
        {/* Energy Phase Indicator */}
        <EnergyPhaseIndicator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <BarVisualization 
              value={state.updateSignal} 
              maxValue={state.params.updateThreshold * 1.5} 
              label="Update Signal" 
              color="bg-blue-500" 
            />
            
            <BarVisualization 
              value={state.salience} 
              maxValue={5} 
              label="Salience" 
              color="bg-orange-500" 
            />
            
            <BarVisualization 
              value={state.energyBudget} 
              maxValue={state.params.eMax} 
              label="Energy Budget" 
              color="bg-green-500"
              isEnergy={true}
            />
            
            <BarVisualization 
              value={state.predictionError} 
              maxValue={3} 
              label="Prediction Error" 
              color="bg-purple-500" 
            />
          </div>
          
          <div>
            <div className="bg-black/30 p-4 rounded-lg mb-6">
              <h4 className="text-lg font-semibold mb-2">System State</h4>
              
              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <span>Physical System:</span>
                  <span>{state.physicalSystem.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-700 h-6 rounded-lg overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-1000 ease-in-out" 
                    style={{ width: `${(state.physicalSystem + 1) * 50}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span>Observer System:</span>
                  <span>{state.observerSystem.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-700 h-6 rounded-lg overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-1500 ease-in-out" 
                    style={{ width: `${(state.observerSystem + 1) * 50}%` }}
                  />
                </div>
                
                {/* Visual representation of OS and PS */}
                <div className="mt-8 flex justify-center items-center h-32 relative">
                  {/* Bridge metaphor */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-600 transform -translate-y-1/2"></div>
                  
                  {/* Physical System */}
                  <div 
                    className="absolute w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center transition-all duration-1000 ease-in-out"
                    style={{ 
                      left: `${(state.physicalSystem + 1) * 40}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <span className="text-white font-bold">PS</span>
                  </div>
                  
                  {/* Observer System */}
                  <div 
                    className="absolute w-16 h-16 bg-red-500 rounded-full flex items-center justify-center transition-all duration-1500 ease-in-out"
                    style={{ 
                      left: `${(state.observerSystem + 1) * 40}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <span className="text-white font-bold">OS</span>
                    
                    {/* Connection line between PS and OS */}
                    <div 
                      className="absolute top-1/2 h-0.5 bg-yellow-400 transition-all duration-1000"
                      style={{ 
                        width: `${Math.abs(state.physicalSystem - state.observerSystem) * 80}%`,
                        left: state.physicalSystem > state.observerSystem ? '100%' : 'auto',
                        right: state.physicalSystem <= state.observerSystem ? '100%' : 'auto',
                        opacity: 0.6
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg">
              <h4 className="text-lg font-semibold mb-2">Statistics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-300">Simulation Time:</p>
                  <p className="text-xl">{state.time.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Update Count:</p>
                  <p className="text-xl">{state.updateCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Update Threshold:</p>
                  <p className="text-xl">{state.params.updateThreshold.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Last Update:</p>
                  <p className="text-xl">{state.lastUpdateTime.toFixed(1)}</p>
                </div>
              </div>
              
              {/* Energy status message */}
              {state.energyBudget < 30 && (
                <div className="mt-4 p-2 bg-red-900/50 rounded text-center animate-pulse">
                  <p className="text-red-300 text-sm">Energy critically low - updates restricted</p>
                </div>
              )}
              
              {/* Energy change rate message */}
              {Math.abs(state.energyChangeRate) > 1 && (
                <div className="mt-4 p-2 bg-blue-900/50 rounded text-center">
                  <p className="text-blue-300 text-sm">
                    Energy {state.energyChangeRate > 0 ? 'increasing' : 'decreasing'} at 
                    {' '}{Math.abs(state.energyChangeRate).toFixed(1)} units/sec
                  </p>
                </div>
              )}
              
              {/* Energy mode message */}
              <div className="mt-4 p-2 bg-purple-900/50 rounded text-center">
                <p className="text-purple-300 text-sm">
                  <strong>ENERGY MODE:</strong> {state.energyMode.charAt(0).toUpperCase() + state.energyMode.slice(1)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
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
            Updates consume energy that must be replenished over time. The energy mode determines
            how energy fluctuates and responds to parameters.
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
      
      {/* Energy Mode Explanation */}
      <div className="mt-8 bg-black/30 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Energy Mode Explanation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-900/30 p-3 rounded">
            <h4 className="font-medium text-blue-300 mb-1">Natural Mode</h4>
            <p className="text-sm text-gray-300">
              Simulates realistic energy dynamics with subtle fluctuations. Energy costs are directly
              proportional to prediction errors and update signals. Parameters directly affect energy behavior.
              Best for understanding the mathematical model.
            </p>
          </div>
          
          <div className="bg-purple-900/30 p-3 rounded">
            <h4 className="font-medium text-purple-300 mb-1">Dramatic Mode</h4>
            <p className="text-sm text-gray-300">
              Amplifies energy fluctuations with higher costs, random events, and variable recovery.
              Updates are more costly, creating a boom-bust cycle. Useful for visualizing how energy
              constraints affect update decisions under stress.
            </p>
          </div>
          
          <div className="bg-green-900/30 p-3 rounded">
            <h4 className="font-medium text-green-300 mb-1">Educational Mode</h4>
            <p className="text-sm text-gray-300">
              Follows a clear three-phase cycle to demonstrate energy dynamics:
              <br/>• <strong>Stable:</strong> High energy with minor fluctuations
              <br/>• <strong>Depleting:</strong> Energy steadily decreases
              <br/>• <strong>Recovering:</strong> Energy gradually rebuilds
              <br/>Best for learning the concepts of energy-constrained updating.
            </p>
          </div>
        </div>
      </div>
      
      {/* State Change Legend */}
      <div className="mt-8 bg-black/30 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">State Change Visualization</h3>
        <p className="text-gray-300 text-sm mb-4">
          When the Observer System updates, watch for these visual cues:
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-sm">Normal OS State</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm">Updated OS State</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-yellow-400 mr-2"></div>
            <span className="text-sm">Prediction Error</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 animate-pulse mr-2 bg-red-500"></div>
            <span className="text-sm">Energy Drain</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2 bg-orange-500"></div>
            <span className="text-sm">Depleting Phase</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2 bg-blue-400"></div>
            <span className="text-sm">Recovering Phase</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleUSPVisualization;
