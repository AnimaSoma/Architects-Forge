import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
// Dynamic-loading, React-friendly chart component
import UltraSimpleChart from './UltraSimpleChart';

/**
 * Error Boundary Component for catching rendering errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("USPSimulation Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Chart Error Boundary - specifically for chart rendering issues
 */
class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Chart Rendering Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-900/30 p-4 rounded-lg text-center h-full flex items-center justify-center">
          <div>
            <p className="font-medium">Chart rendering failed</p>
            <p className="text-sm text-gray-300 mt-1">{this.state.error?.message || "Unknown error"}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Simple bar chart using div elements instead of canvas
 */
const SimpleBarChart = ({ data, maxValue, label, color, height = 100 }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-medium">{data.toFixed(2)}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-4">
        <div 
          className={`h-4 rounded-full ${color}`} 
          style={{ width: `${Math.min(100, (data / maxValue) * 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

/**
 * Memoized Charts Section Component - prevents re-renders during simulation updates
 */
const ChartsSectionComponent = memo(({ 
  history, 
  params, 
  toggleSimulation, 
  chartsMounted, 
  onChartsMounted,
  onChartsError
}) => {
  // Track if charts have been successfully rendered
  const [chartsRendered, setChartsRendered] = useState(false);
  const [renderAttempts, setRenderAttempts] = useState(0);
  const renderTimerRef = useRef(null);

  useEffect(() => {
    console.log("[ChartsSectionComponent] Mounted with data points:", history.time.length);
    
    // Signal that charts are mounted
    if (onChartsMounted) {
      onChartsMounted(true);
    }
    
    // Set a timer to verify charts are still visible after a delay
    renderTimerRef.current = setTimeout(() => {
      console.log("[ChartsSectionComponent] Charts render verification");
      setChartsRendered(true);
    }, 500);
    
    return () => {
      console.log("[ChartsSectionComponent] Unmounting");
      clearTimeout(renderTimerRef.current);
      
      // Signal that charts are unmounted
      if (onChartsMounted) {
        onChartsMounted(false);
      }
    };
  }, [onChartsMounted]);

  // Track render attempts to detect failures
  useEffect(() => {
    if (renderAttempts > 0 && !chartsRendered) {
      console.warn("[ChartsSectionComponent] Charts failed to render after attempts:", renderAttempts);
      if (renderAttempts > 3 && onChartsError) {
        onChartsError("Charts failed to render after multiple attempts");
      }
    }
  }, [renderAttempts, chartsRendered, onChartsError]);

  // Check if we have any data to display
  const hasData = history.time.length > 0;
  
  // Log data sizes for debugging
  console.log('[ChartsSectionComponent] Data sizes →',
    'updateSignal:', history.updateSignal.length,
    'salience:', history.salience.length,
    'energyBudget:', history.energyBudget.length,
    'predictionError:', history.predictionError.length,
    'chartsMounted:', chartsMounted,
    'renderAttempts:', renderAttempts
  );

  // If no data yet, show a prompt to start the simulation
  if (!hasData) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold mb-6 text-center">Live Graphs</h3>
        <div className="flex justify-center items-center h-64">
          <p className="text-center text-gray-300">
            Run the simulation to generate data...
            <br />
            <button 
              onClick={toggleSimulation} 
              className="mt-4 px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Start Simulation
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Attempt to render charts and increment attempt counter
  useEffect(() => {
    if (hasData && !chartsRendered) {
      setRenderAttempts(prev => prev + 1);
    }
  }, [hasData, chartsRendered]);

  // We have data, render the charts
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
      <h3 className="text-xl font-semibold mb-6 text-center">
        Live Graphs 
        {renderAttempts > 1 && !chartsRendered && 
          <span className="text-xs text-yellow-300 ml-2">(Rendering...)</span>
        }
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartErrorBoundary>
          <div className="bg-black/40 rounded-lg p-3">
            <UltraSimpleChart
              title="Update Signal"
              data={history.updateSignal}
              labels={history.time}
              borderColor="rgb(54,162,235)"
              backgroundColor="rgba(54,162,235,0.2)"
              thresholdLine={[params.updateThreshold, 'rgb(255,99,132)']}
              yAxis={{ min: 0, max: params.updateThreshold * 1.5 }}
              height={180}
            />
          </div>
        </ChartErrorBoundary>
        
        <ChartErrorBoundary>
          <div className="bg-black/40 rounded-lg p-3">
            <UltraSimpleChart
              title="Salience"
              data={history.salience}
              labels={history.time}
              borderColor="rgb(255,159,64)"
              backgroundColor="rgba(255,159,64,0.2)"
              yAxis={{ min: 0, max: 5 }}
              height={180}
            />
          </div>
        </ChartErrorBoundary>
        
        <ChartErrorBoundary>
          <div className="bg-black/40 rounded-lg p-3">
            <UltraSimpleChart
              title="Energy Budget"
              data={history.energyBudget}
              labels={history.time}
              borderColor="rgb(75,192,192)"
              backgroundColor="rgba(75,192,192,0.2)"
              yAxis={{ min: 0, max: params.eMax }}
              height={180}
            />
          </div>
        </ChartErrorBoundary>
        
        <ChartErrorBoundary>
          <div className="bg-black/40 rounded-lg p-3">
            <UltraSimpleChart
              title="Prediction Error"
              data={history.predictionError}
              labels={history.time}
              borderColor="rgb(153,102,255)"
              backgroundColor="rgba(153,102,255,0.2)"
              yAxis={{ min: 0, max: 3 }}
              height={180}
            />
          </div>
        </ChartErrorBoundary>
      </div>
    </div>
  );
});

// Ensure display name is set for debugging
ChartsSectionComponent.displayName = 'ChartsSectionComponent';

/**
 * Update Signal Potential (USP) Simulation Component - Simplified Version
 * 
 * A React implementation of the Update Signal Potential equation:
 * U(t) = (αM(t) + βσ²(t)) · (Emax - γ∫₀ᵗ U(τ)dτ + I(t)) · δ|SPS(t) - SOS(t)|
 * 
 * This simplified version uses div elements instead of canvas for visualization
 * and has reduced complexity to improve stability.
 */
const USPSimulation = () => {
  console.log("USPSimulation: Component mounting");
  
  // Use a single state object for simulation to reduce state updates
  const [simState, setSimState] = useState({
    // Parameters
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
    // Current values
    time: 0,
    updateSignal: 0,
    salience: 0,
    energyBudget: 100.0,
    predictionError: 0,
    uIntegral: 0,
    physicalSystem: 0.5,
    observerSystem: 0.1,
    // Status
    running: false,
    updateCount: 0,
    lastUpdateTime: 0,
    error: null,
    loading: false,
    // ────────────────────────────────────────────────────────────
    // Rolling history for live-graphs (capped length)
    // ────────────────────────────────────────────────────────────
    history: {
      time: [],
      updateSignal: [],
      salience: [],
      energyBudget: [],
      predictionError: []
    }
  });

  // Use refs for UI state to prevent simulation updates from affecting them
  const showChartsRef = useRef(false);
  const chartsMountedRef = useRef(false);
  const [showCharts, setShowCharts] = useState(false);
  const [chartToggleDisabled, setChartToggleDisabled] = useState(false);
  const [chartsError, setChartsError] = useState(null);
  
  // Track if charts disappeared unexpectedly
  const [chartsDisappeared, setChartsDisappeared] = useState(false);

  // constant so it never re-creates
  const MAX_HISTORY_POINTS = 200;

  // Animation frame reference
  const animationRef = useRef(null);
  
  // Show update event notification
  const [showUpdateEvent, setShowUpdateEvent] = useState(false);

  // Simple calculation of the update signal based on current state
  const calculateNextState = useCallback(() => {
    try {
      const { params, physicalSystem, observerSystem, uIntegral, time } = simState;
      
      // Calculate prediction error (simplified)
      const error = Math.abs(physicalSystem - observerSystem);
      const predictionError = params.delta * error;
      
      // Calculate salience (simplified)
      const errorVariance = error * 0.1 * (1 + Math.random());
      const salience = params.alpha * error + params.beta * errorVariance;
      
      // Calculate energy budget (simplified)
      const dt = 0.1; // Fixed time step
      const energyInflux = params.energyInflux * dt;
      const energyBudget = Math.min(
        params.eMax, 
        params.eMax - params.gamma * uIntegral + energyInflux
      );
      
      // Calculate update signal
      const updateSignal = salience * energyBudget * predictionError;

      /*─────────────────────────────────────────────────────────────
       * Append to rolling history (cap to MAX_HISTORY_POINTS)
       *────────────────────────────────────────────────────────────*/
      const append = (arr, val) =>
        arr.length >= MAX_HISTORY_POINTS
          ? [...arr.slice(1), val]
          : [...arr, val];

      const newHistory = {
        time:            append(simState.history.time,            time + dt),
        updateSignal:    append(simState.history.updateSignal,    updateSignal),
        salience:        append(simState.history.salience,        salience),
        energyBudget:    append(simState.history.energyBudget,    energyBudget),
        predictionError: append(simState.history.predictionError, predictionError)
      };
      
      // New physical system state (simplified oscillation)
      const newPhysicalSystem = 0.5 * Math.sin(0.1 * (time + dt)) + 0.1 * (Math.random() - 0.5);
      
      // Determine if update should occur
      const shouldUpdate = updateSignal > params.updateThreshold;
      
      // Calculate new observer system
      let newObserverSystem = observerSystem;
      let updateCount = simState.updateCount;
      let lastUpdateTime = simState.lastUpdateTime;
      
      if (shouldUpdate) {
        console.log("USPSimulation: Update event triggered", { updateSignal, threshold: params.updateThreshold });
        newObserverSystem = observerSystem + params.updateRate * (newPhysicalSystem - observerSystem);
        updateCount += 1;
        lastUpdateTime = time;
        
        // Show update notification
        setShowUpdateEvent(true);
        setTimeout(() => setShowUpdateEvent(false), 2000);
      }
      
      return {
        ...simState,
        time: time + dt,
        updateSignal,
        salience,
        energyBudget,
        predictionError,
        uIntegral: uIntegral + updateSignal * dt,
        physicalSystem: newPhysicalSystem,
        observerSystem: newObserverSystem,
        updateCount,
        lastUpdateTime,
        history: newHistory
      };
    } catch (error) {
      console.error("USPSimulation: Calculation error", error);
      return {
        ...simState,
        error: error.message,
        running: false
      };
    }
  }, [simState]);
  
  // Animation step
  const animationStep = useCallback(() => {
    setSimState(calculateNextState());
    
    if (simState.running) {
      animationRef.current = requestAnimationFrame(animationStep);
    }
  }, [calculateNextState, simState.running]);
  
  // Start/stop simulation
  const toggleSimulation = useCallback(() => {
    console.log("USPSimulation: Toggling simulation", { currentlyRunning: simState.running });
    setSimState(prev => ({ ...prev, running: !prev.running }));
  }, []);

  // Handle charts mounted/unmounted events
  const handleChartsMounted = useCallback((mounted) => {
    console.log(`[USPSimulation] Charts ${mounted ? 'mounted' : 'unmounted'}`);
    chartsMountedRef.current = mounted;
    
    // If charts were previously mounted but now unmounted while they should be visible
    if (!mounted && showChartsRef.current && !chartsDisappeared) {
      console.warn("[USPSimulation] Charts disappeared unexpectedly!");
      setChartsDisappeared(true);
    }
  }, [chartsDisappeared]);

  // Handle chart errors
  const handleChartsError = useCallback((error) => {
    console.error("[USPSimulation] Charts error:", error);
    setChartsError(error);
  }, []);

  // Toggle charts / bars with debounce to prevent rapid toggling
  const toggleCharts = useCallback(() => {
    console.log("USPSimulation: Toggling charts visibility");
    
    // Disable toggle button temporarily to prevent rapid toggling
    setChartToggleDisabled(true);
    
    // Update both state and ref
    setShowCharts(prev => {
      const newValue = !prev;
      showChartsRef.current = newValue;
      
      // Reset charts disappeared state when toggling
      if (newValue) {
        setChartsDisappeared(false);
        setChartsError(null);
      }
      
      return newValue;
    });
    
    // Re-enable toggle button after a short delay
    setTimeout(() => {
      setChartToggleDisabled(false);
    }, 500);
  }, []);
  
  // Reset simulation
  const resetSimulation = useCallback(() => {
    console.log("USPSimulation: Resetting simulation");
    setSimState({
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
      lastUpdateTime: 0,
      error: null,
      loading: false,
      history: {
        time: [],
        updateSignal: [],
        salience: [],
        energyBudget: [],
        predictionError: []
      }
    });
    setShowUpdateEvent(false);
    setChartsDisappeared(false);
    setChartsError(null);
  }, []);
  
  // Update parameter
  const updateParameter = useCallback((paramName, value) => {
    console.log("USPSimulation: Updating parameter", { paramName, value });
    setSimState(prev => ({
      ...prev,
      params: {
        ...prev.params,
        [paramName]: value
      }
    }));
  }, []);
  
  // Handle animation frame effect
  useEffect(() => {
    console.log("USPSimulation: Animation effect triggered", { running: simState.running });
    
    if (simState.running) {
      animationRef.current = requestAnimationFrame(animationStep);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [simState.running, animationStep]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("USPSimulation: Component unmounting");
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Add a delay to chart initialization to ensure they have time to properly render
  useEffect(() => {
    if (showCharts) {
      console.log("[USPSimulation] Charts visibility enabled, initializing with delay");
      
      // Check if charts disappear after a delay
      const checkTimer = setTimeout(() => {
        if (showCharts && !chartsMountedRef.current && !chartsDisappeared) {
          console.warn("[USPSimulation] Charts failed to initialize after delay");
          setChartsDisappeared(true);
        }
      }, 2000);
      
      return () => clearTimeout(checkTimer);
    }
  }, [showCharts, chartsDisappeared]);

  // Fallback content in case of error
  const fallbackContent = (
    <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white p-6 md:p-10 rounded-lg shadow-xl">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Update Signal Potential</h2>
        <div className="mb-6 text-xl md:text-2xl font-mono bg-black/30 p-4 rounded-lg inline-block">
          <InlineMath math="U(t) = (αM(t) + βσ^2(t)) \cdot (E_{max} - γ\int_0^t U(τ)dτ + I(t)) \cdot δ|S_{PS}(t) - S_{OS}(t)|" />
        </div>
        <p className="text-gray-300 max-w-3xl mx-auto mb-8">
          The Update Signal Potential equation determines when a system should update its internal model
          based on prediction errors, available energy, and the salience of information.
        </p>
        <div className="bg-red-900/50 p-4 rounded-lg inline-block">
          <p>Visualization is currently unavailable.</p>
          <p className="text-sm">Please check back later or try refreshing the page.</p>
        </div>
      </div>
    </div>
  );

  // Main content
  const mainContent = (
    <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white p-6 md:p-10 rounded-lg shadow-xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Update Signal Potential</h2>
        <div className="mb-6 text-xl md:text-2xl font-mono bg-black/30 p-4 rounded-lg inline-block">
          
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
                <span>α (Alpha): {simState.params.alpha.toFixed(1)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Weight for magnitude component in salience">?</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1" 
                value={simState.params.alpha}
                onChange={(e) => updateParameter('alpha', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>β (Beta): {simState.params.beta.toFixed(1)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Weight for variance component in salience">?</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1" 
                value={simState.params.beta}
                onChange={(e) => updateParameter('beta', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>δ (Delta): {simState.params.delta.toFixed(1)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Sensitivity parameter for prediction error">?</span>
              </label>
              <input 
                type="range" 
                min="0.1" 
                max="3" 
                step="0.1" 
                value={simState.params.delta}
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
                <span>Emax: {simState.params.eMax.toFixed(1)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Maximum energy capacity">?</span>
              </label>
              <input 
                type="range" 
                min="50" 
                max="200" 
                step="10" 
                value={simState.params.eMax}
                onChange={(e) => updateParameter('eMax', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>γ (Gamma): {simState.params.gamma.toFixed(2)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Cost scaling factor for energy expenditure">?</span>
              </label>
              <input 
                type="range" 
                min="0.01" 
                max="0.5" 
                step="0.01" 
                value={simState.params.gamma}
                onChange={(e) => updateParameter('gamma', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>Energy Influx: {simState.params.energyInflux.toFixed(1)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Rate of energy recovery">?</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="0.5" 
                value={simState.params.energyInflux}
                onChange={(e) => updateParameter('energyInflux', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>Update Threshold: {simState.params.updateThreshold.toFixed(1)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Threshold above which an update occurs">?</span>
              </label>
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="1" 
                value={simState.params.updateThreshold}
                onChange={(e) => updateParameter('updateThreshold', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>Update Rate: {simState.params.updateRate.toFixed(1)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Rate at which the observer system updates when threshold is exceeded">?</span>
              </label>
              <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.1" 
                value={simState.params.updateRate}
                onChange={(e) => updateParameter('updateRate', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Simulation Controls */}
      <div className="flex justify-center space-x-4 mb-8">
        <motion.button
          onClick={toggleSimulation}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="py-2 px-6 bg-blue-600 hover:bg-blue-700 rounded-md shadow text-lg"
        >
          {simState.running ? 'Pause Simulation' : 'Start Simulation'}
        </motion.button>
        
        <motion.button
          onClick={resetSimulation}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="py-2 px-6 bg-gray-600 hover:bg-gray-700 rounded-md shadow text-lg"
        >
          Reset
        </motion.button>

        {/* toggle charts button - now with disabled state */}
        <motion.button
          onClick={toggleCharts}
          disabled={chartToggleDisabled}
          whileHover={!chartToggleDisabled ? { scale: 1.05 } : {}}
          whileTap={!chartToggleDisabled ? { scale: 0.95 } : {}}
          className={`py-2 px-6 rounded-md shadow text-lg ${
            chartToggleDisabled 
              ? 'bg-purple-800 opacity-70 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {showCharts ? 'Hide Charts' : 'Show Charts'}
        </motion.button>
      </div>
      
      {/* Update Event Notification */}
      {showUpdateEvent && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-600/30 border border-green-500 p-3 rounded-md mb-8 text-center"
        >
          <strong>Update Event Occurred!</strong> The Observer System has updated its internal model.
        </motion.div>
      )}
      
      {/* Simple Visualizations */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4">Current Values</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <SimpleBarChart 
              data={simState.updateSignal} 
              maxValue={simState.params.updateThreshold * 1.5} 
              label="Update Signal" 
              color="bg-blue-500" 
            />
            
            <SimpleBarChart 
              data={simState.salience} 
              maxValue={5} 
              label="Salience" 
              color="bg-orange-500" 
            />
            
            <SimpleBarChart 
              data={simState.energyBudget} 
              maxValue={simState.params.eMax} 
              label="Energy Budget" 
              color="bg-green-500" 
            />
            
            <SimpleBarChart 
              data={simState.predictionError} 
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
                  ></div>
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
                  ></div>
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
                  <p className="text-xl">{simState.params.updateThreshold.toFixed(1)}</p>
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
      
      {/* Live Charts Section - Now properly separated with memoization */}
      <ErrorBoundary fallback={
        <div className="bg-red-900/30 p-6 rounded-lg mb-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Charts Unavailable</h3>
          <p>There was an error loading the charts. Please try again later.</p>
        </div>
      }>
        {/* Display a message if charts disappeared unexpectedly */}
        {chartsDisappeared && (
          <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded-lg mb-4 text-center">
            <h3 className="text-lg font-semibold mb-1">Charts Disappeared</h3>
            <p className="text-sm">The charts were hidden unexpectedly. Try toggling them off and on again.</p>
            <button 
              onClick={() => {
                setChartsDisappeared(false);
                setShowCharts(false);
                setTimeout(() => setShowCharts(true), 500);
              }}
              className="mt-2 px-3 py-1 bg-yellow-700 hover:bg-yellow-600 rounded text-sm"
            >
              Restore Charts
            </button>
          </div>
        )}
        
        {/* Display chart error if any */}
        {chartsError && (
          <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg mb-4 text-center">
            <h3 className="text-lg font-semibold mb-1">Chart Error</h3>
            <p className="text-sm">{chartsError}</p>
          </div>
        )}
        
        {/* Only render charts when showCharts is true */}
        {showCharts && (
          <ChartsSectionComponent 
            history={simState.history}
            params={simState.params}
            toggleSimulation={toggleSimulation}
            chartsMounted={chartsMountedRef.current}
            onChartsMounted={handleChartsMounted}
            onChartsError={handleChartsError}
          />
        )}
      </ErrorBoundary>
      
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

  // Render with error boundary
  return (
    <ErrorBoundary fallback={fallbackContent}>
      {simState.error ? (
        <div className="bg-red-900/50 p-4 rounded-lg text-center">
          <p>An error occurred: {simState.error}</p>
          <button 
            onClick={resetSimulation}
            className="mt-4 py-2 px-4 bg-blue-600 rounded"
          >
            Reset Simulation
          </button>
        </div>
      ) : (
        mainContent
      )}
    </ErrorBoundary>
  );
};

export default USPSimulation;
