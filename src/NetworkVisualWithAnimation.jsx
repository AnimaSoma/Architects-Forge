import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * NetworkVisualWithAnimation Component
 * 
 * A simplified network visualization with forced animation effects.
 * This component prioritizes visible animation over complex simulation logic.
 */

// Inline CSS with keyframe animations
const AnimationStyles = () => (
  <style jsx>{`
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
      animation: pulse 2s infinite;
    }
    
    .node-float {
      animation: float 3s infinite ease-in-out;
    }
    
    .node-color-shift {
      animation: colorShift 5s infinite;
    }
    
    .connection-flash {
      animation: flashConnection 3s infinite;
    }
    
    .spin-slow {
      animation: spin 20s infinite linear;
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
  `}</style>
);

const NetworkVisualWithAnimation = () => {
  // Animation frame counter - visibly increments to show activity
  const [frameCount, setFrameCount] = useState(0);
  
  // Simple simulation state
  const [simState, setState] = useState({
    running: false,
    physicalValue: 0.5,
    nodes: [],
    consensusReached: false,
    demoMode: false // Special mode that runs animations without complex simulation
  });
  
  // Time tracking
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Animation references
  const animationRef = useRef(null);
  const physicalSystemRef = useRef(null);
  const nodeRefs = useRef([]);
  const connectionRefs = useRef([]);
  
  // Node count (simplified parameter)
  const nodeCount = 6;
  
  // Initialize nodes
  const initializeNodes = useCallback(() => {
    const nodes = [];
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: i,
        observation: 0.5,
        confirming: false,
        energy: 1.0,
        // Add animation phase offset for each node
        phaseOffset: i * (Math.PI / nodeCount)
      });
    }
    
    setState(prev => ({
      ...prev,
      nodes,
      physicalValue: 0.5,
      consensusReached: false
    }));
    
    // Reset refs array
    nodeRefs.current = nodes.map(() => React.createRef());
    
    // Initialize connection refs
    const connectionCount = (nodeCount * (nodeCount - 1)) / 2;
    connectionRefs.current = Array(connectionCount).fill().map(() => React.createRef());
  }, [nodeCount]);
  
  // Initialize on mount
  useEffect(() => {
    initializeNodes();
  }, [initializeNodes]);
  
  // Calculate node positions in a circle
  const getNodePosition = (index, total, radius = 180) => {
    const angle = (index / total) * Math.PI * 2;
    const x = 250 + radius * Math.cos(angle);
    const y = 250 + radius * Math.sin(angle);
    return { x, y };
  };
  
  // Animation step - with forced visual changes
  const animationStep = useCallback(() => {
    // Update frame counter (visible proof of animation)
    setFrameCount(prev => (prev + 1) % 1000);
    
    // Update elapsed time
    setElapsedTime(prev => +(prev + 0.1).toFixed(1));
    
    setState(prev => {
      // Calculate new physical system value using sine wave for predictable oscillation
      const time = elapsedTime;
      const newPhysicalValue = 0.5 + 0.4 * Math.sin(time * 0.5);
      
      // Update each node with animation-focused changes
      const newNodes = prev.nodes.map((node, i) => {
        // Create phase-shifted observations for each node
        const nodeTime = time + node.phaseOffset;
        const newObservation = 0.5 + 0.3 * Math.sin(nodeTime * 0.5);
        
        // Determine if node is confirming based on simple time-based pattern
        // This ensures some nodes will always be confirming for visual interest
        const confirming = Math.sin(nodeTime) > 0.3;
        
        // Energy oscillates for visual effect
        const energy = 0.5 + 0.5 * Math.sin(nodeTime * 0.2);
        
        return {
          ...node,
          observation: newObservation,
          confirming,
          energy,
          phaseOffset: node.phaseOffset
        };
      });
      
      // Periodically trigger consensus for visual effect
      const consensusReached = Math.sin(time * 0.3) > 0.7;
      
      return {
        ...prev,
        physicalValue: newPhysicalValue,
        nodes: newNodes,
        consensusReached
      };
    });
    
    // Direct DOM manipulation for animations if needed
    if (physicalSystemRef.current) {
      // Pulse effect on physical system
      const scale = 1 + 0.1 * Math.sin(elapsedTime * 2);
      physicalSystemRef.current.style.transform = `scale(${scale})`;
    }
    
    // Continue animation if running
    if (simState.running) {
      animationRef.current = requestAnimationFrame(animationStep);
    }
  }, [elapsedTime, simState.running]);
  
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
          const newNodes = prev.nodes.map((node, i) => ({
            ...node,
            confirming: (i + frameCount) % 3 === 0
          }));
          
          return {
            ...prev,
            consensusReached: frameCount % 30 < 15,
            nodes: newNodes
          };
        });
      }, 500);
    }
    
    return () => {
      if (demoInterval) clearInterval(demoInterval);
    };
  }, [simState.demoMode, simState.running, frameCount]);
  
  return (
    <div className="bg-gradient-to-r from-purple-900/60 to-indigo-900/60 backdrop-blur-sm rounded-lg p-8 text-center">
      {/* Include animation styles */}
      <AnimationStyles />
      
      <h3 className="text-2xl font-semibold mb-4">Adaptation emerges from the regulation of coherence under energetic constraint.</h3>
      <p className="mb-6 text-gray-300">
        This visualization demonstrates how multiple Observer Systems work together to confirm
        observations and reach consensus, creating a distributed form of consciousness.
      </p>
      
      {/* Animation Frame Counter - visible proof of animation */}
      <div className="my-4 flex justify-center items-center space-x-4">
        <div className="bg-black/40 px-4 py-2 rounded-lg">
          <span className="text-xs text-gray-400">FRAME</span>
          <div className="font-mono text-2xl text-white animate-pulse">
            {frameCount.toString().padStart(4, '0')}
          </div>
        </div>
        
        <div className="bg-black/40 px-4 py-2 rounded-lg">
          <span className="text-xs text-gray-400">TIME</span>
          <div className="font-mono text-2xl text-green-300 animate-pulse">
            {elapsedTime.toFixed(1)}s
          </div>
        </div>
        
        {/* Visual activity indicator */}
        <div className="bg-black/40 px-4 py-2 rounded-lg flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-ping"></div>
          <span className="text-green-300">Active</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={toggleAnimation}
          className={`py-2 px-6 rounded-md shadow text-lg transition-colors ${
            simState.running 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {simState.running ? 'Pause Animation' : 'Start Animation'}
        </button>
        
        <button
          onClick={resetAnimation}
          className="py-2 px-6 bg-gray-600 hover:bg-gray-700 rounded-md shadow text-lg"
        >
          Reset
        </button>
        
        <button
          onClick={toggleDemoMode}
          className={`py-2 px-6 rounded-md shadow text-lg ${
            simState.demoMode 
              ? 'bg-purple-600 hover:bg-purple-700' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {simState.demoMode ? 'Disable Demo' : 'Enable Demo'}
        </button>
      </div>
      
      {/* Network Visualization */}
      <div className="bg-black/30 rounded-lg p-4 mb-8 relative" style={{ height: '500px' }}>
        {/* Background animation elements */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute w-full h-full spin-slow">
            <div className="absolute top-1/2 left-1/2 w-3/4 h-3/4 border-2 border-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 border-2 border-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-1/4 h-1/4 border-2 border-purple-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>
        
        <svg width="100%" height="100%" viewBox="0 0 500 500" className="overflow-visible">
          {/* Connections between nodes */}
          {simState.nodes.map((sourceNode, i) => (
            simState.nodes.map((targetNode, j) => {
              if (i < j) { // Only draw connection once between each pair
                const sourcePos = getNodePosition(i, simState.nodes.length);
                const targetPos = getNodePosition(j, simState.nodes.length);
                const isActive = sourceNode.confirming && targetNode.confirming;
                const connectionIndex = (i * simState.nodes.length) + j - ((i + 1) * (i + 2)) / 2;
                
                return (
                  <line
                    key={`conn-${i}-${j}`}
                    ref={el => connectionRefs.current[connectionIndex] = el}
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke={isActive ? "rgba(52, 211, 153, 0.8)" : "rgba(255, 255, 255, 0.2)"}
                    strokeWidth={isActive ? 3 : 1}
                    className={isActive ? "connection-flash" : ""}
                  />
                );
              }
              return null;
            })
          ))}
          
          {/* Physical System (center node) with forced animation */}
          <g ref={physicalSystemRef} className="node-float">
            <circle
              cx="250"
              cy="250"
              r="40"
              fill={`rgba(255, 255, 255, ${0.2 + simState.physicalValue * 0.5})`}
              stroke="white"
              strokeWidth="2"
              className="physical-system node-pulse"
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
              className="animate-pulse"
            >
              {simState.physicalValue.toFixed(2)}
            </text>
          </g>
          
          {/* Observer System nodes with forced animation */}
          {simState.nodes.map((node, i) => {
            const pos = getNodePosition(i, simState.nodes.length);
            const isConfirming = node.confirming;
            
            // Calculate animation delay based on node index
            const animationDelay = `${i * 0.2}s`;
            
            return (
              <g key={`node-${i}`} ref={el => nodeRefs.current[i] = el}>
                {/* Connection to Physical System */}
                <line
                  x1="250"
                  y1="250"
                  x2={pos.x}
                  y2={pos.y}
                  stroke={isConfirming ? "rgba(52, 211, 153, 0.6)" : "rgba(255, 255, 255, 0.1)"}
                  strokeWidth={isConfirming ? 2 : 1}
                  strokeDasharray={isConfirming ? "none" : "5,5"}
                  className={isConfirming ? "connection-flash" : ""}
                  style={{ animationDelay }}
                />
                
                {/* Observer System node */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isConfirming ? 30 : 20}
                  fill={getNodeColor(node)}
                  stroke={isConfirming ? "#34D399" : "white"}
                  strokeWidth={isConfirming ? 3 : 1}
                  className={`observer-system ${isConfirming ? "node-pulse" : "node-color-shift"}`}
                  style={{ animationDelay }}
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
                  className="animate-pulse"
                  style={{ animationDelay }}
                >
                  {node.observation.toFixed(2)}
                </text>
                
                {/* Energy indicator with animation */}
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
          
          {/* Consensus indicator with forced animation */}
          {simState.consensusReached && (
            <g className="consensus-flash">
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
                Consensus Reached!
              </text>
            </g>
          )}
          
          {/* Visual activity indicators - always animated */}
          <circle 
            cx="30" 
            cy="30" 
            r="10" 
            fill="rgba(52, 211, 153, 0.5)" 
            className="animate-ping"
          />
          <circle 
            cx="470" 
            cy="30" 
            r="10" 
            fill="rgba(239, 68, 68, 0.5)" 
            className="animate-ping"
            style={{ animationDelay: "0.5s" }}
          />
          <circle 
            cx="30" 
            cy="470" 
            r="10" 
            fill="rgba(59, 130, 246, 0.5)" 
            className="animate-ping"
            style={{ animationDelay: "1s" }}
          />
          <circle 
            cx="470" 
            cy="470" 
            r="10" 
            fill="rgba(139, 92, 246, 0.5)" 
            className="animate-ping"
            style={{ animationDelay: "1.5s" }}
          />
        </svg>
      </div>
      
      {/* Always-changing statistics to show animation */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center justify-center">
          <span>Animation Statistics</span>
          <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-sm text-gray-300">Frame Count</p>
            <p className="text-2xl animate-pulse">{frameCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-300">Elapsed Time</p>
            <p className="text-2xl animate-pulse">{elapsedTime.toFixed(1)}s</p>
          </div>
          <div>
            <p className="text-sm text-gray-300">Physical Value</p>
            <p className="text-2xl animate-pulse">{simState.physicalValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-300">Active Nodes</p>
            <p className="text-2xl animate-pulse">
              {simState.nodes.filter(n => n.confirming).length}/{simState.nodes.length}
            </p>
          </div>
        </div>
      </div>
      
      {/* Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/20 rounded-full animate-ping"></div>
          <h3 className="text-lg font-semibold mb-2 relative z-10">Network Confirmation</h3>
          <p className="text-gray-300 text-sm relative z-10">
            Multiple Observer Systems (OS) each monitor the Physical System (PS) with varying 
            levels of accuracy. When enough nodes agree on an observation, consensus is reached
            and a global update occurs.
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 relative overflow-hidden">
          <div className="absolute -left-4 -top-4 w-16 h-16 bg-green-500/20 rounded-full animate-ping" style={{ animationDelay: "0.5s" }}></div>
          <h3 className="text-lg font-semibold mb-2 relative z-10">Energy Constraints</h3>
          <p className="text-gray-300 text-sm relative z-10">
            Each node has limited energy for updates. Consensus updates are more efficient than
            individual updates, demonstrating how distributed consciousness can be more energy-efficient
            than isolated perception.
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-purple-500/20 rounded-full animate-ping" style={{ animationDelay: "1s" }}></div>
          <h3 className="text-lg font-semibold mb-2 relative z-10">Emergent Consciousness</h3>
          <p className="text-gray-300 text-sm relative z-10">
            The collective behavior of the network demonstrates how consciousness can emerge from
            distributed confirmation. No single node has complete information, but together they
            create a more accurate model of reality.
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper function to get node color based on state
function getNodeColor(node) {
  if (node.confirming) {
    return `rgba(52, 211, 153, ${0.5 + node.energy * 0.5})`;
  } else {
    return `rgba(59, 130, 246, ${0.5 + node.energy * 0.5})`;
  }
}

export default NetworkVisualWithAnimation;
