import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * SimpleNetworkVisual Component
 * 
 * A lightweight visualization of multiple Observer Systems working together
 * to confirm observations and reach consensus about a Physical System.
 * 
 * This simplified implementation focuses on demonstrating the concept
 * with minimal computational overhead to prevent performance issues.
 */

// Simple error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Network visualization error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-900/30 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Visualization Error</h3>
          <p className="text-sm opacity-80">{this.state.error?.message || "Unknown error"}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-4 py-1 bg-red-700 hover:bg-red-600 rounded text-sm"
          >
            Reset
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const SimpleNetworkVisual = () => {
  // Simulation parameters with simplified defaults
  const [params, setParams] = useState({
    nodeCount: 5,                // Reduced number of nodes
    consensusThreshold: 0.6,     // Percentage needed for consensus
    updateInterval: 200,         // Ms between updates (FASTER - changed from 500ms)
    connectionStrength: 0.7,     // How strongly nodes influence each other
    noiseLevel: 0.3              // Random variation in observations (INCREASED from 0.2)
  });

  // Simplified simulation state
  const [simState, setSimState] = useState({
    running: false,
    time: 0,
    physicalValue: 0.5,          // Current state of physical system
    nodes: [],                   // Will be initialized in useEffect
    consensusReached: false,
    consensusValue: null,
    updateCount: 0,
    lastUpdate: Date.now()       // Track last update time for animation
  });

  /* ------------------------------------------------------------------ */
  /* Dedicated elapsed-time tracker (fixes “timer stuck at 0” issue)     */
  /* ------------------------------------------------------------------ */
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);

  // Animation/interval reference
  const intervalRef = useRef(null);
  
  // Mounted ref to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Initialize nodes
  const initializeNodes = useCallback(() => {
    try {
      console.log("Initializing nodes");
      const nodes = [];
      const { nodeCount } = params;
      
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          id: i,
          observation: 0.5,        // Initial observation matches PS
          confidence: 1.0,         // Initial confidence
          energy: 1.0,             // Full energy
          confirming: false        // Not confirming initially
        });
      }
      
      setSimState(prev => ({
        ...prev,
        nodes,
        physicalValue: 0.5,
        consensusReached: false,
        consensusValue: null,
        time: 0,
        updateCount: 0,
        lastUpdate: Date.now()
      }));
    } catch (error) {
      console.error("Error initializing nodes:", error);
    }
  }, [params]);

  // Initialize on mount and when node count changes
  useEffect(() => {
    initializeNodes();
  }, [params.nodeCount, initializeNodes]);

  // Update simulation state - simplified logic
  const updateSimulation = useCallback(() => {
    if (!isMountedRef.current) return;
    
    try {
      console.log("Updating simulation...");
      
      setSimState(prev => {
        // 1. Update physical system with simple random walk - MORE DRAMATIC CHANGES
        const changeAmount = (Math.random() - 0.5) * 0.2; // Doubled from 0.1
        let newPhysicalValue = prev.physicalValue + changeAmount;
        newPhysicalValue = Math.max(0, Math.min(1, newPhysicalValue)); // Keep in [0,1]
        
        console.log(`Physical system: ${prev.physicalValue.toFixed(2)} -> ${newPhysicalValue.toFixed(2)}`);
        
        // 2. Update each node's observation with noise
        const newNodes = prev.nodes.map(node => {
          // Add noise to observation
          const noise = (Math.random() - 0.5) * params.noiseLevel;
          let newObservation = newPhysicalValue + noise;
          newObservation = Math.max(0, Math.min(1, newObservation)); // Keep in [0,1]
          
          // Simple energy recovery
          const newEnergy = Math.min(1, node.energy + 0.02);
          
          return {
            ...node,
            observation: newObservation,
            energy: newEnergy,
            // Will set confirming status later
            confirming: false
          };
        });
        
        // 3. Determine which nodes are confirming based on similar observations
        // For each node, check how many other nodes have similar observations
        newNodes.forEach((node, i) => {
          let confirmationCount = 0;
          
          newNodes.forEach((otherNode, j) => {
            if (i !== j) {
              // If observations are close, count as confirmation
              const difference = Math.abs(node.observation - otherNode.observation);
              if (difference < 0.15) {
                confirmationCount++;
              }
            }
          });
          
          // If enough other nodes confirm this observation, mark as confirming
          const confirmationThreshold = Math.floor((newNodes.length - 1) * 0.4);
          newNodes[i].confirming = confirmationCount >= confirmationThreshold;
        });
        
        // 4. Check for consensus
        const confirmingNodes = newNodes.filter(node => node.confirming);
        const consensusReached = confirmingNodes.length / newNodes.length >= params.consensusThreshold;
        
        // Calculate consensus value if reached
        let consensusValue = prev.consensusValue;
        let updateCount = prev.updateCount;
        
        if (consensusReached && !prev.consensusReached) {
          // Average of confirming observations
          consensusValue = confirmingNodes.reduce((sum, node) => sum + node.observation, 0) / confirmingNodes.length;
          updateCount += 1;
          
          console.log(`Consensus reached! Value: ${consensusValue.toFixed(2)}`);
          
          // Apply energy cost to all nodes for the consensus
          newNodes.forEach((node, i) => {
            newNodes[i].energy = Math.max(0.1, node.energy - 0.3);
          });
        }
        
        return {
          ...prev,
          // advance simulation clock by interval (ms → seconds)
          time: prev.time + params.updateInterval / 1000,
          physicalValue: newPhysicalValue,
          nodes: newNodes,
          consensusReached,
          consensusValue: consensusReached ? consensusValue : prev.consensusValue,
          updateCount,
          lastUpdate: Date.now() // Update timestamp for animation
        };
      });
    } catch (error) {
      console.error("Error updating simulation:", error);
      stopSimulation();
    }
  }, [params]);

  // Start simulation
  const startSimulation = useCallback(() => {
    if (intervalRef.current) {
      console.log("Simulation already running, clearing existing interval");
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    console.log("Starting simulation...");
    setSimState(prev => ({ ...prev, running: true }));
    
    // Run an immediate update so UI reflects changes without waiting a full interval
    updateSimulation();

    // Use interval instead of requestAnimationFrame for more controlled updates
    intervalRef.current = setInterval(() => {
      console.log("Interval tick");
      if (isMountedRef.current) {
        updateSimulation();
      }
    }, params.updateInterval);
    
    console.log(`Interval set: ${intervalRef.current}, update every ${params.updateInterval}ms`);
  }, [updateSimulation, params.updateInterval]);

  // Stop simulation
  const stopSimulation = useCallback(() => {
    console.log("Stopping simulation...");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log("Interval cleared");
    }
    
    setSimState(prev => ({ ...prev, running: false }));
  }, []);

  // Toggle simulation
  const toggleSimulation = useCallback(() => {
    console.log(`Toggle simulation. Current state: ${simState.running}`);
    if (simState.running) {
      stopSimulation();
    } else {
      startSimulation();
    }
  }, [simState.running, startSimulation, stopSimulation]);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    console.log("Resetting simulation");
    stopSimulation();
    // reset elapsed timer
    setElapsedTime(0);
    initializeNodes();
  }, [stopSimulation, initializeNodes]);

  // Update parameter
  const updateParameter = useCallback((paramName, value) => {
    console.log(`Updating parameter: ${paramName} = ${value}`);
    setParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // clear timer
      if (timerRef.current) clearInterval(timerRef.current);
      console.log("Component unmounting, cleaning up");
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Calculate node positions in a circle
  const getNodePosition = (index, total, radius = 180) => {
    const angle = (index / total) * Math.PI * 2;
    const x = 250 + radius * Math.cos(angle);
    const y = 250 + radius * Math.sin(angle);
    return { x, y };
  };

  // Get node color based on state
  const getNodeColor = (node) => {
    if (node.confirming) {
      return `rgba(52, 211, 153, ${0.5 + node.confidence * 0.5})`;
    } else {
      return `rgba(59, 130, 246, ${0.5 + node.confidence * 0.5})`;
    }
  };

  // Get connection opacity based on node states
  const getConnectionOpacity = (node1, node2) => {
    const difference = Math.abs(node1.observation - node2.observation);
    // More similar observations = stronger connection
    return Math.max(0.05, 1 - difference * 5);
  };

  // Animation classes for nodes and connections
  const getAnimationClass = (isActive) => {
    return isActive ? "animate-pulse" : "";
  };

  /* ------------------------------------------------------------------ */
  /* Elapsed-time side-effect                                           */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    // When simulation running → start light weight timer
    if (simState.running) {
      console.log("Starting elapsed-time timer");
      timerRef.current = setInterval(() => {
        setElapsedTime((t) => +(t + 0.1).toFixed(2)); // step 0.1s
      }, 100);
    } else if (timerRef.current) {
      console.log("Stopping elapsed-time timer");
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [simState.running]);

  // Calculate time since last update for animation effects
  const getTimeSinceLastUpdate = () => {
    return Date.now() - simState.lastUpdate;
  };

  return (
    <ErrorBoundary>
      <div className="bg-gradient-to-r from-purple-900/60 to-indigo-900/60 backdrop-blur-sm rounded-lg p-8 text-center">
        <h3 className="text-2xl font-semibold mb-4">Network Confirmation Model</h3>
        <p className="mb-6 text-gray-300">
          This visualization demonstrates how multiple Observer Systems work together to confirm
          observations and reach consensus, creating a distributed form of consciousness.
        </p>

        {/* Prominent elapsed-time display */}
        <div className="my-6">
          <span
            className={`inline-block px-6 py-3 rounded-lg bg-black/40 font-mono text-4xl md:text-5xl ${
              simState.running ? 'text-green-300 animate-pulse' : 'text-white'
            }`}
          >
            {elapsedTime.toFixed(2)}s
          </span>
        </div>
        
        {/* Simulation Status Indicator */}
        <div className={`mb-4 text-center ${simState.running ? 'visible' : 'invisible'}`}>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-400">
            <span className="w-2 h-2 mr-2 rounded-full bg-green-400 animate-ping"></span>
            Simulation Running - Time: {simState.time}
          </span>
        </div>
        
        {/* Parameter Controls */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-8">
          <h3 className="text-xl font-semibold mb-4">Parameter Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Network Parameters</h4>
              
              <div>
                <label className="flex justify-between mb-1">
                  <span>Node Count: {params.nodeCount}</span>
                  <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Number of observer system nodes">?</span>
                </label>
                <input 
                  type="range" 
                  min="3" 
                  max="8" 
                  step="1" 
                  value={params.nodeCount}
                  onChange={(e) => updateParameter('nodeCount', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="flex justify-between mb-1">
                  <span>Consensus Threshold: {params.consensusThreshold.toFixed(1)}</span>
                  <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Percentage of nodes needed for consensus">?</span>
                </label>
                <input 
                  type="range" 
                  min="0.3" 
                  max="0.9" 
                  step="0.1" 
                  value={params.consensusThreshold}
                  onChange={(e) => updateParameter('consensusThreshold', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Simulation Parameters</h4>
              
              <div>
                <label className="flex justify-between mb-1">
                  <span>Update Speed: {(1000 / params.updateInterval).toFixed(1)}Hz</span>
                  <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Speed of simulation updates">?</span>
                </label>
                <input 
                  type="range" 
                  min="100" 
                  max="1000" 
                  step="100" 
                  value={params.updateInterval}
                  onChange={(e) => updateParameter('updateInterval', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="flex justify-between mb-1">
                  <span>Noise Level: {params.noiseLevel.toFixed(1)}</span>
                  <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Random noise in observations">?</span>
                </label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="0.5" 
                  step="0.1" 
                  value={params.noiseLevel}
                  onChange={(e) => updateParameter('noiseLevel', parseFloat(e.target.value))}
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
            className={`py-2 px-6 rounded-md shadow text-lg transition-colors ${
              simState.running 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
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
        
        {/* Network Visualization */}
        <div className="bg-black/30 rounded-lg p-4 mb-8" style={{ height: '500px' }}>
          <svg width="100%" height="100%" viewBox="0 0 500 500" className="overflow-visible">
            {/* Connections between nodes */}
            {simState.nodes.map((sourceNode, i) => (
              simState.nodes.map((targetNode, j) => {
                if (i < j) { // Only draw connection once between each pair
                  const sourcePos = getNodePosition(i, simState.nodes.length);
                  const targetPos = getNodePosition(j, simState.nodes.length);
                  const opacity = getConnectionOpacity(sourceNode, targetNode);
                  const isActive = sourceNode.confirming && targetNode.confirming;
                  
                  return (
                    <line
                      key={`conn-${i}-${j}`}
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke={isActive ? "rgba(52, 211, 153, 0.8)" : "rgba(255, 255, 255, 0.2)"}
                      strokeWidth={isActive ? 3 : 1}
                      strokeOpacity={opacity}
                      className={getAnimationClass(isActive && simState.running)}
                    />
                  );
                }
                return null;
              })
            ))}
            
            {/* Physical System (center node) */}
            <g>
              <circle
                cx="250"
                cy="250"
                r="40"
                fill={`rgba(255, 255, 255, ${0.2 + simState.physicalValue * 0.3})`}
                stroke="white"
                strokeWidth="2"
                className={simState.running ? "transition-all duration-200" : ""}
              />
              <text
                x="250"
                y="245"
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
              >
                Physical System
              </text>
              <text
                x="250"
                y="265"
                textAnchor="middle"
                fill="white"
                fontSize="12"
                className={simState.running ? "animate-pulse" : ""}
              >
                {simState.physicalValue.toFixed(2)}
              </text>
            </g>
            
            {/* Observer System nodes */}
            {simState.nodes.map((node, i) => {
              const pos = getNodePosition(i, simState.nodes.length);
              const isConfirming = node.confirming;
              
              return (
                <g key={`node-${i}`}>
                  {/* Connection to Physical System */}
                  <line
                    x1="250"
                    y1="250"
                    x2={pos.x}
                    y2={pos.y}
                    stroke={isConfirming ? "rgba(52, 211, 153, 0.6)" : "rgba(255, 255, 255, 0.1)"}
                    strokeWidth={isConfirming ? 2 : 1}
                    strokeDasharray={isConfirming ? "none" : "5,5"}
                    className={`transition-all duration-300 ${simState.running ? "animate-pulse" : ""}`}
                  />
                  
                  {/* Observer System node */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isConfirming ? 30 : 20} // Bigger difference for confirming nodes
                    fill={getNodeColor(node)}
                    stroke={isConfirming ? "#34D399" : "white"}
                    strokeWidth={isConfirming ? 3 : 1}
                    className={`transition-all duration-300 ${
                      isConfirming && simState.running ? "animate-pulse" : ""
                    }`}
                  />
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    OS{i+1}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 15}
                    textAnchor="middle"
                    fill="white"
                    fontSize="9"
                    className={simState.running ? "animate-pulse" : ""}
                  >
                    {node.observation.toFixed(2)}
                  </text>
                  
                  {/* Energy indicator */}
                  <rect
                    x={pos.x - 15}
                    y={pos.y + 25}
                    width="30"
                    height="4"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                  <rect
                    x={pos.x - 15}
                    y={pos.y + 25}
                    width={30 * node.energy}
                    height="4"
                    fill={node.energy < 0.3 ? "rgb(239, 68, 68)" : "rgb(52, 211, 153)"}
                    className="transition-all duration-300"
                  />
                </g>
              );
            })}
            
            {/* Consensus indicator */}
            {simState.consensusReached && (
              <g className="animate-pulse">
                <rect
                  x="150"
                  y="120"
                  width="200"
                  height="40"
                  rx="5"
                  fill="rgba(52, 211, 153, 0.3)"
                  stroke="#34D399"
                  strokeWidth="2"
                />
                <text
                  x="250"
                  y="145"
                  textAnchor="middle"
                  fill="#34D399"
                  fontSize="14"
                  fontWeight="bold"
                >
                  Consensus: {simState.consensusValue.toFixed(2)}
                </text>
              </g>
            )}
          </svg>
        </div>
        
        {/* Simulation Statistics */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-8">
          <h3 className="text-xl font-semibold mb-4">Simulation Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-sm text-gray-300">Simulation Time</p>
              <p className={`text-2xl ${simState.running ? "animate-pulse" : ""}`}>
                {elapsedTime.toFixed(2)}s
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Physical System</p>
              <p className={`text-2xl ${simState.running ? "animate-pulse" : ""}`}>
                {simState.physicalValue.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Consensus Status</p>
              <p className="text-2xl">
                {simState.consensusReached ? (
                  <span className="text-green-400 animate-pulse">Reached</span>
                ) : (
                  <span className="text-gray-400">Pending</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Update Count</p>
              <p className="text-2xl">{simState.updateCount}</p>
            </div>
          </div>
        </div>
        
        {/* Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Network Confirmation</h3>
            <p className="text-gray-300 text-sm">
              Multiple Observer Systems (OS) each monitor the Physical System (PS) with varying 
              levels of accuracy. When enough nodes agree on an observation, consensus is reached
              and a global update occurs.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Energy Constraints</h3>
            <p className="text-gray-300 text-sm">
              Each node has limited energy for updates. Consensus updates are more efficient than
              individual updates, demonstrating how distributed consciousness can be more energy-efficient
              than isolated perception.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Emergent Consciousness</h3>
            <p className="text-gray-300 text-sm">
              The collective behavior of the network demonstrates how consciousness can emerge from
              distributed confirmation. No single node has complete information, but together they
              create a more accurate model of reality.
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SimpleNetworkVisual;
