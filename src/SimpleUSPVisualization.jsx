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
  // Single state object to minimize re-renders
  const [state, setState] = useState({
    // Parameters
    params: {
      alpha: 1.0,         // α - Weight for magnitude
      beta: 0.5,          // β - Weight for variance
      delta: 1.0,         // δ - Prediction error sensitivity
      gamma: 0.5,         // γ - Energy cost factor (increased from 0.3)
      eMax: 100.0,        // Maximum energy capacity
      energyInflux: 0.1,  // Energy recovery rate (reduced from 0.3 to 0.1)
      updateThreshold: 20.0, // Threshold for update events
      updateRate: 0.7     // Rate of observer system updates
    },
    // Simulation state
    time: 0,
    updateSignal: 0,
    salience: 0,
    energyBudget: 100.0,
    lastEnergyBudget: 100.0, // Track previous energy value to detect stagnation
    predictionError: 0,
    uIntegral: 0,
    physicalSystem: 0.5,
    observerSystem: 0.1,
    running: false,
    updateCount: 0,
    lastUpdateTime: 0,
    energyDrainEffect: false, // Visual effect for energy drain
    stuckCounter: 0,          // Counter for detecting stuck energy
    lastForcedDrop: 0,        // Time of last forced energy drop
    energyStable: false,      // Flag for stable energy (not fluctuating)
    forcedEnergyActive: false // Flag for when forced energy system is active
  });

  // Animation frame reference
  const animationRef = useRef(null);
  // Hold latest running flag to avoid stale closure
  const runningRef = useRef(state.running);
  // Reference for the forced energy timer
  const forcedEnergyTimerRef = useRef(null);
  // Cycle phase for energy pattern
  const energyCycleRef = useRef({
    phase: 'full', // 'full', 'draining', 'recovering'
    startTime: Date.now(),
    targetEnergy: 100
  });
  
  // Show update event notification
  const [showUpdateEvent, setShowUpdateEvent] = useState(false);
  // Show forced energy manipulation notification
  const [showForcedEnergyNotice, setShowForcedEnergyNotice] = useState(false);
  
  // State change indicator
  const [stateChangeIndicator, setStateChangeIndicator] = useState({
    active: false,
    phase: 0 // 0: inactive, 1: expanding, 2: color change, 3: contracting
  });

  // Calculate next state based on current state
  // ---------- Pure transition function ----------
  // Accept previous state and return next state.  By passing this
  // function to setState(prev => fn(prev)) we avoid stale–closure bugs
  // that were freezing the simulation when `state` stopped updating.
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
        stuckCounter,
        lastForcedDrop
      } = prev;
      
      // Fixed time step - slowed down by 50%
      const dt = 0.05; // Reduced from 0.1 for slower simulation
      
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
      let energyDrainEffect = false;
      let newStuckCounter = stuckCounter;
      let forcedDrop = false;
      
      // Check if energy is stuck by comparing with previous value
      // If the energy hasn't changed much over several frames, increment the stuck counter
      const energyDelta = Math.abs(energyBudget - lastEnergyBudget);
      if (energyDelta < 0.01) {
        newStuckCounter += 1;
      } else {
        newStuckCounter = 0;
      }
      
      // Force an energy drop if stuck for too long (20 frames)
      if (newStuckCounter > 20) {
        forcedDrop = true;
        newStuckCounter = 0;
      }
      
      // Periodic forced energy drop (every 10-15 seconds)
      const timeSinceLastForcedDrop = time - lastForcedDrop;
      let newLastForcedDrop = lastForcedDrop;
      
      if (timeSinceLastForcedDrop > 10 + Math.random() * 5) {
        forcedDrop = true;
        newLastForcedDrop = time;
      }
      
      // Calculate energy changes with oscillation and randomness
      
      // Base energy recovery with sine wave modulation
      // This makes energy recovery oscillate over time
      const oscillationFactor = 0.5 + 0.5 * Math.sin(time * 0.1);
      const baseEnergyInflux = params.energyInflux * dt * oscillationFactor;
      
      // Add random spikes to energy influx (occasional boosts)
      const randomBoost = Math.random() < 0.02 ? Math.random() * 2 : 0;
      const energyInflux = baseEnergyInflux + randomBoost;
      
      // Background energy drain proportional to current energy
      // Higher energy = faster passive drain
      const backgroundDrainRate = 0.05 + (energyBudget / params.eMax) * 0.1;
      const backgroundDrain = backgroundDrainRate * energyBudget * dt;
      
      // Additional drain based on update signal
      const signalDrain = 0.2 * updateSignal * dt;
      
      // Cumulative cost based on uIntegral (with higher gamma)
      const cumulativeCost = params.gamma * uIntegral * dt;
      
      // Random energy interruptions (occasional unexpected costs)
      const randomDrain = Math.random() < 0.05 ? Math.random() * 5 : 0;
      
      // Calculate total energy cost
      let energyCost = backgroundDrain + signalDrain + cumulativeCost + randomDrain;
      
      // New uIntegral calculation with decay
      // This ensures uIntegral doesn't grow indefinitely
      const uIntegralDecay = 0.01 * uIntegral * dt;
      let newUIntegral = uIntegral + (updateSignal * dt) - uIntegralDecay;
      
      // Handle updates and forced drops
      if (shouldUpdate || forcedDrop) {
        // More extreme energy cost for updates (50-70% of current energy)
        // Higher error = higher cost percentage
        const costPercentage = 0.5 + (error * 0.2); // 50-70% based on error magnitude
        const updateCost = energyBudget * costPercentage;
        
        // Apply exponential scaling to make costs grow with error
        const errorExponent = Math.pow(error, 1.5); // Exponential scaling
        const additionalCost = 10 * errorExponent;
        
        energyCost += updateCost + additionalCost;
        
        // Reset uIntegral after significant expenditure
        newUIntegral = 0;
        
        // Update observer system if this was a real update (not just forced drop)
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
        
        // Activate energy drain visual effect
        energyDrainEffect = true;
      }
      
      // Calculate new energy budget with depletion
      const newEnergyBudget = Math.max(
        0, 
        Math.min(
          params.eMax,
          energyBudget - energyCost + energyInflux
        )
      );
      
      // Detect if energy has stabilized (not fluctuating much)
      const energyStable = Math.abs(newEnergyBudget - energyBudget) < 0.1 && 
                          Math.abs(newEnergyBudget - lastEnergyBudget) < 0.1;
      
      return {
        ...prev,
        time: time + dt,
        updateSignal,
        salience,
        lastEnergyBudget: energyBudget,
        energyBudget: newEnergyBudget,
        predictionError,
        uIntegral: newUIntegral,
        physicalSystem: newPhysicalSystem,
        observerSystem: newObserverSystem,
        updateCount,
        lastUpdateTime,
        energyDrainEffect,
        stuckCounter: newStuckCounter,
        lastForcedDrop: newLastForcedDrop,
        energyStable
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
      running: !prev.running,
      // ensure forced-energy visuals stop while paused
      forcedEnergyActive: prev.running ? false : prev.forcedEnergyActive
    }));
  }, []);
  
  // Reset simulation
  const resetSimulation = useCallback(() => {
    setState({
      params: {
        alpha: 1.0,
        beta: 0.5,
        delta: 1.0,
        gamma: 0.5,         // Increased from 0.3
        eMax: 100.0,
        energyInflux: 0.1,  // Reduced from 0.3 to 0.1
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
      stuckCounter: 0,
      lastForcedDrop: 0,
      energyStable: false,
      forcedEnergyActive: false
    });
    setShowUpdateEvent(false);
    setShowForcedEnergyNotice(false);
    setStateChangeIndicator({ active: false, phase: 0 });
    
    // Reset energy cycle
    energyCycleRef.current = {
      phase: 'full',
      startTime: Date.now(),
      targetEnergy: 100
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
      
      if (forcedEnergyTimerRef.current) {
        clearInterval(forcedEnergyTimerRef.current);
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

  // Force an energy drop if energy has been stable for too long
  useEffect(() => {
    if (state.running && state.energyStable) {
      const timer = setTimeout(() => {
        setState(prev => {
          // Force a significant energy drop (20-40% of current energy)
          const dropAmount = prev.energyBudget * (0.2 + Math.random() * 0.2);
          return {
            ...prev,
            energyBudget: Math.max(0, prev.energyBudget - dropAmount),
            energyDrainEffect: true
          };
        });
      }, 5000); // 5 seconds of stability triggers a forced drop
      
      return () => clearTimeout(timer);
    }
  }, [state.running, state.energyStable]);

  // DIRECT ENERGY MANIPULATION SYSTEM
  // Runs only while the simulation is active
  useEffect(() => {
    // if not running make sure timer is cleared
    if (!state.running) {
      if (forcedEnergyTimerRef.current) {
        clearInterval(forcedEnergyTimerRef.current);
        forcedEnergyTimerRef.current = null;
      }
      return;
    }

    // Function to directly force energy to a specific value
    const forceEnergyValue = () => {
      const now = Date.now();
      const cycle = energyCycleRef.current;
      const elapsedTime = (now - cycle.startTime) / 1000; // in seconds
      let newEnergy = state.energyBudget;
      let newPhase = cycle.phase;
      let newTargetEnergy = cycle.targetEnergy;
      let phaseChanged = false;
      
      // Calculate energy based on current phase
      if (cycle.phase === 'full' && elapsedTime > 3) {
        // Start draining after 3 seconds at full
        newPhase = 'draining';
        newTargetEnergy = 30;
        phaseChanged = true;
        console.log("ENERGY CYCLE: Starting drain phase, target: 30%");
      } else if (cycle.phase === 'draining') {
        // Drain to 30% over 10 seconds
        const drainProgress = Math.min(1, elapsedTime / 10);
        newEnergy = 100 - (70 * drainProgress);
        
        // If we've reached the target, switch to recovery
        if (newEnergy <= 31 || elapsedTime > 10) {
          newPhase = 'recovering';
          newTargetEnergy = 80;
          phaseChanged = true;
          console.log("ENERGY CYCLE: Starting recovery phase, target: 80%");
        }
      } else if (cycle.phase === 'recovering') {
        // Recover to 80% over 15 seconds
        const recoveryProgress = Math.min(1, elapsedTime / 15);
        newEnergy = 30 + (50 * recoveryProgress);
        
        // If we've reached the target, switch back to full
        if (newEnergy >= 79 || elapsedTime > 15) {
          newPhase = 'full';
          newTargetEnergy = 100;
          phaseChanged = true;
          console.log("ENERGY CYCLE: Returning to full phase, target: 100%");
        }
      }
      
      // Update state with the new energy value
      setState(prev => ({
        ...prev,
        energyBudget: newEnergy,
        lastEnergyBudget: prev.energyBudget,
        forcedEnergyActive: true,
        energyDrainEffect: phaseChanged // Visual effect on phase change
      }));
      
      // Show notification when phase changes
      if (phaseChanged) {
        setShowForcedEnergyNotice(true);
        setTimeout(() => setShowForcedEnergyNotice(false), 3000);
        
        // Reset the timer for the new phase
        energyCycleRef.current = {
          phase: newPhase,
          startTime: now,
          targetEnergy: newTargetEnergy
        };
      }
      
      // Log energy changes for debugging
      console.log(`ENERGY SYSTEM: ${newPhase} phase, current: ${newEnergy.toFixed(2)}%, target: ${newTargetEnergy}%`);
    };
    
    // Start the forced energy timer
    forcedEnergyTimerRef.current = setInterval(forceEnergyValue, 1000);
    
    // Clean up the timer when component unmounts
    return () => {
      if (forcedEnergyTimerRef.current) {
        clearInterval(forcedEnergyTimerRef.current);
        forcedEnergyTimerRef.current = null;
      }
    };
  }, [state.running]); // depend on running state so it pauses correctly

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
      
      // Add stuck indicator
      if (state.stuckCounter > 10) {
        pulseEffect = 'animate-pulse';
      }
      
      // Add forced energy indicator
      if (state.forcedEnergyActive) {
        if (energyCycleRef.current.phase === 'draining') {
          barColor = 'bg-purple-600';
        } else if (energyCycleRef.current.phase === 'recovering') {
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
        {isEnergy && state.stuckCounter > 15 && (
          <div className="text-xs text-yellow-400 mt-1 animate-pulse">
            Energy stuck - forcing fluctuation...
          </div>
        )}
        {isEnergy && state.forcedEnergyActive && (
          <div className="text-xs text-purple-300 mt-1">
            Forced Energy Cycle: <strong>{energyCycleRef.current.phase}</strong> → Target: {energyCycleRef.current.targetEnergy}%
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
      <div className="absolute inset-0 bg-red-500/20 animate-pulse rounded-lg z-5 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 font-bold text-2xl">
          ENERGY DRAIN
        </div>
      </div>
    );
  };

  // Forced energy drop component
  const ForcedEnergyDropIndicator = () => {
    if (!state.energyStable) return null;
    
    return (
      <div className="absolute top-2 right-2 bg-yellow-600/70 px-2 py-1 rounded text-xs animate-pulse">
        Energy Stabilized - Forcing Fluctuation
      </div>
    );
  };

  // Forced energy cycle notification
  const ForcedEnergyCycleIndicator = () => {
    if (!state.forcedEnergyActive) return null;
    
    let bgColor = "bg-purple-800/70";
    let message = "ENERGY CYCLE ACTIVE";
    
    if (energyCycleRef.current.phase === 'draining') {
      bgColor = "bg-red-800/70";
      message = "FORCED ENERGY DRAIN";
    } else if (energyCycleRef.current.phase === 'recovering') {
      bgColor = "bg-blue-800/70";
      message = "FORCED ENERGY RECOVERY";
    }
    
    return (
      <div className={`absolute top-2 left-2 ${bgColor} px-2 py-1 rounded text-xs animate-pulse`}>
        {message}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white p-6 rounded-lg shadow-xl">
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
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>Energy Influx: {state.params.energyInflux.toFixed(2)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Rate of energy recovery (extremely slow)">?</span>
              </label>
              <input 
                type="range" 
                min="0.01" 
                max="0.5" 
                step="0.01" 
                value={state.params.energyInflux}
                onChange={(e) => updateParameter('energyInflux', parseFloat(e.target.value))}
                className="w-full"
              />
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
      
      {/* Forced Energy Cycle Notification */}
      {showForcedEnergyNotice && (
        <div className="bg-purple-600/30 border border-purple-500 p-3 rounded-md mb-8 text-center animate-pulse">
          <strong>Energy Cycle Phase Change!</strong> Entering <span className="font-bold">{energyCycleRef.current.phase}</span> phase.
          <div className="text-blue-300 text-sm mt-1">
            Target energy level: {energyCycleRef.current.targetEnergy}%
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
        
        {/* Forced Energy Drop Indicator */}
        <ForcedEnergyDropIndicator />
        
        {/* Forced Energy Cycle Indicator */}
        <ForcedEnergyCycleIndicator />
        
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
              
              {/* Energy fluctuation message */}
              {Math.abs(state.energyBudget - state.lastEnergyBudget) > 5 && (
                <div className="mt-4 p-2 bg-blue-900/50 rounded text-center">
                  <p className="text-blue-300 text-sm">Energy fluctuating: {Math.abs(state.energyBudget - state.lastEnergyBudget).toFixed(1)} units</p>
                </div>
              )}
              
              {/* Forced energy cycle message */}
              {state.forcedEnergyActive && (
                <div className="mt-4 p-2 bg-purple-900/50 rounded text-center">
                  <p className="text-purple-300 text-sm">
                    <strong>FORCED ENERGY CYCLE:</strong> {energyCycleRef.current.phase} phase
                  </p>
                </div>
              )}
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
            Updates consume energy that must be replenished over time. Energy recovery is extremely slow, while updates are very costly.
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
            <div className="w-4 h-4 animate-pulse mr-2 bg-yellow-500"></div>
            <span className="text-sm">Forced Energy Drop</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 animate-pulse mr-2 bg-purple-600"></div>
            <span className="text-sm">Forced Energy Cycle</span>
          </div>
        </div>
      </div>
      
      {/* Debugging Information */}
      <div className="mt-8 bg-black/50 p-4 rounded-lg border border-purple-500">
        <h3 className="text-lg font-semibold mb-2 text-purple-300">Energy Cycle Debug Info</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Current Phase:</p>
            <p className="text-white font-mono">{energyCycleRef.current.phase}</p>
          </div>
          <div>
            <p className="text-gray-400">Target Energy:</p>
            <p className="text-white font-mono">{energyCycleRef.current.targetEnergy}%</p>
          </div>
          <div>
            <p className="text-gray-400">Phase Duration:</p>
            <p className="text-white font-mono">{((Date.now() - energyCycleRef.current.startTime) / 1000).toFixed(1)}s</p>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          <p>Energy cycles between 100% → 30% → 80% → repeat, regardless of simulation parameters.</p>
          <p>This forced cycle ensures energy fluctuates visibly for demonstration purposes.</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleUSPVisualization;
