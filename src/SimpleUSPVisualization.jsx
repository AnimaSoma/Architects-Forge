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
      gamma: 0.1,         // γ - Energy cost factor
      eMax: 100.0,        // Maximum energy capacity
      energyInflux: 5.0,  // Energy recovery rate
      updateThreshold: 20.0, // Threshold for update events
      updateRate: 0.7     // Rate of observer system updates
    },
    // Simulation state
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
    lastUpdateTime: 0
  });

  // Animation frame reference
  const animationRef = useRef(null);
  
  // Show update event notification
  const [showUpdateEvent, setShowUpdateEvent] = useState(false);

  // Calculate next state based on current state
  const calculateNextState = useCallback(() => {
    try {
      const { params, physicalSystem, observerSystem, uIntegral, time } = state;
      
      // Fixed time step
      const dt = 0.1;
      
      // Calculate prediction error
      const error = Math.abs(physicalSystem - observerSystem);
      const predictionError = params.delta * error;
      
      // Calculate salience
      const errorVariance = error * 0.1 * (1 + Math.random());
      const salience = params.alpha * error + params.beta * errorVariance;
      
      // Calculate energy budget
      const energyInflux = params.energyInflux * dt;
      const energyBudget = Math.min(
        params.eMax, 
        params.eMax - params.gamma * uIntegral + energyInflux
      );
      
      // Calculate update signal
      const updateSignal = salience * energyBudget * predictionError;
      
      // New physical system state (simplified oscillation)
      const newPhysicalSystem = 0.5 * Math.sin(0.1 * (time + dt)) + 0.1 * (Math.random() - 0.5);
      
      // Determine if update should occur
      const shouldUpdate = updateSignal > params.updateThreshold;
      
      // Calculate new observer system
      let newObserverSystem = observerSystem;
      let updateCount = state.updateCount;
      let lastUpdateTime = state.lastUpdateTime;
      
      if (shouldUpdate) {
        newObserverSystem = observerSystem + params.updateRate * (newPhysicalSystem - observerSystem);
        updateCount += 1;
        lastUpdateTime = time;
        
        // Show update notification
        setShowUpdateEvent(true);
        setTimeout(() => setShowUpdateEvent(false), 2000);
      }
      
      return {
        ...state,
        time: time + dt,
        updateSignal,
        salience,
        energyBudget,
        predictionError,
        uIntegral: uIntegral + updateSignal * dt,
        physicalSystem: newPhysicalSystem,
        observerSystem: newObserverSystem,
        updateCount,
        lastUpdateTime
      };
    } catch (error) {
      console.error("Calculation error:", error);
      return {
        ...state,
        running: false
      };
    }
  }, [state]);
  
  // Animation step
  const animationStep = useCallback(() => {
    setState(calculateNextState());
    
    if (state.running) {
      animationRef.current = requestAnimationFrame(animationStep);
    }
  }, [calculateNextState, state.running]);
  
  // Toggle simulation running state
  const toggleSimulation = useCallback(() => {
    setState(prev => ({ ...prev, running: !prev.running }));
  }, []);
  
  // Reset simulation
  const resetSimulation = useCallback(() => {
    setState({
      params: {
        alpha: 1.0,
        beta: 0.5,
        delta: 1.0,
        gamma: 0.1,
        eMax: 100.0,
        energyInflux: 5.0,
        updateThreshold: 20.0,
        updateRate: 0.7
      },
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
      lastUpdateTime: 0
    });
    setShowUpdateEvent(false);
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
                max="0.5" 
                step="0.01" 
                value={state.params.gamma}
                onChange={(e) => updateParameter('gamma', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>Energy Influx: {state.params.energyInflux.toFixed(1)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Rate of energy recovery">?</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="0.5" 
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
          className="py-2 px-6 bg-blue-600 hover:bg-blue-700 rounded-md shadow text-lg"
        >
          {state.running ? 'Pause Simulation' : 'Start Simulation'}
        </button>
        
        <button
          onClick={resetSimulation}
          className="py-2 px-6 bg-gray-600 hover:bg-gray-700 rounded-md shadow text-lg"
        >
          Reset
        </button>
      </div>
      
      {/* Update Event Notification */}
      {showUpdateEvent && (
        <div className="bg-green-600/30 border border-green-500 p-3 rounded-md mb-8 text-center">
          <strong>Update Event Occurred!</strong> The Observer System has updated its internal model.
        </div>
      )}
      
      {/* Visualizations */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4">Current Values</h3>
        
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
              
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span>Physical System:</span>
                  <span>{state.physicalSystem.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-700 h-6 rounded-lg overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
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
                    className="h-full bg-red-500" 
                    style={{ width: `${(state.observerSystem + 1) * 50}%` }}
                  />
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
  );
};

export default SimpleUSPVisualization;
