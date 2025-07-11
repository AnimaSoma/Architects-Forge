import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * NetworkConfirmationVisual Component
 * 
 * Visualizes multiple Observer Systems (OS) working together in a network to confirm
 * observations and create consensus, demonstrating how consciousness can emerge
 * from distributed confirmation.
 */
const NetworkConfirmationVisual = () => {
  // Simulation parameters
  const [params, setParams] = useState({
    nodeCount: 7,                // Number of OS nodes
    consensusThreshold: 0.6,     // Percentage of nodes needed for consensus (0-1)
    updateThreshold: 0.4,        // Threshold for individual node updates
    connectionStrength: 0.7,     // How strongly nodes influence each other (0-1)
    energyCost: 0.15,            // Energy cost per update
    noiseLevel: 0.2,             // Random noise in observations
    recoveryRate: 0.03,          // Energy recovery rate per tick
    physicalChangeRate: 0.01     // Rate of change in physical system
  });

  // Simulation state
  const [simState, setSimState] = useState({
    running: false,
    time: 0,
    physicalSystem: { 
      value: 0.5,                // Current state of physical system (0-1)
      target: 0.7,               // Target state that PS is moving toward
      direction: 1               // Direction of change
    },
    nodes: [],                   // Array of OS nodes
    connections: [],             // Array of connections between nodes
    consensusReached: false,     // Whether consensus has been reached
    consensusValue: null,        // The value that consensus was reached on
    lastUpdateTime: 0            // Time of last consensus update
  });

  // Animation frame reference
  const animationRef = useRef(null);
  
  // SVG container reference and dimensions
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  
  // Initialize nodes and connections
  const initializeSimulation = useCallback(() => {
    const { nodeCount } = params;
    
    // Create nodes in a circle
    const nodes = [];
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35;
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      nodes.push({
        id: i,
        x,
        y,
        observation: 0.5,        // Current observation (0-1)
        confidence: 1.0,         // Confidence in observation (0-1)
        energy: 1.0,             // Available energy (0-1)
        lastUpdateTime: 0,       // Time of last update
        needsUpdate: false,      // Whether node needs an update
        confirming: false,       // Whether node is confirming an observation
        confirmationLevel: 0     // Level of confirmation from other nodes (0-1)
      });
    }
    
    // Create connections between nodes
    const connections = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        // Create connections with varying strengths
        // Nodes that are closer in the circle have stronger connections
        const distance = Math.min(Math.abs(i - j), nodeCount - Math.abs(i - j));
        const strength = 1 - (distance / (nodeCount / 2));
        
        connections.push({
          source: i,
          target: j,
          strength: strength * params.connectionStrength,
          active: false,
          confirmationFlow: 0    // Direction and strength of confirmation flow
        });
      }
    }
    
    // Initialize simulation state
    setSimState(prev => ({
      ...prev,
      nodes,
      connections,
      physicalSystem: { 
        value: 0.5,
        target: Math.random(),
        direction: Math.random() > 0.5 ? 1 : -1
      },
      time: 0,
      consensusReached: false,
      consensusValue: null,
      lastUpdateTime: 0
    }));
  }, [params, dimensions]);
  
  // Update window dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const { width, height } = svgRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };
    
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Initialize simulation when parameters or dimensions change
  useEffect(() => {
    initializeSimulation();
  }, [initializeSimulation]);
  
  // Calculate next simulation state
  const calculateNextState = useCallback(() => {
    const { 
      updateThreshold, 
      consensusThreshold, 
      energyCost, 
      noiseLevel,
      recoveryRate,
      physicalChangeRate
    } = params;
    
    return prevState => {
      if (!prevState.running) return prevState;
      
      const time = prevState.time + 1;
      
      // Update physical system
      let { value, target, direction } = prevState.physicalSystem;
      
      // Occasionally change target
      if (Math.random() < 0.005) {
        target = Math.random();
        direction = target > value ? 1 : -1;
      }
      
      // Move value toward target
      value = value + direction * physicalChangeRate;
      
      // Constrain value to [0, 1]
      if (value > 1) {
        value = 1;
        direction = -1;
      } else if (value < 0) {
        value = 0;
        direction = 1;
      }
      
      // Update nodes
      const nodes = [...prevState.nodes];
      
      // Each node observes the physical system with some noise
      nodes.forEach((node, i) => {
        // Add noise to observation
        const noise = (Math.random() - 0.5) * noiseLevel;
        const observation = Math.max(0, Math.min(1, value + noise));
        
        // Calculate prediction error
        const error = Math.abs(observation - node.observation);
        
        // Recover energy
        let energy = Math.min(1, node.energy + recoveryRate);
        
        // Determine if node needs update
        const needsUpdate = error > updateThreshold && energy > energyCost;
        
        // Update node state
        nodes[i] = {
          ...node,
          observation: needsUpdate ? observation : node.observation,
          confidence: needsUpdate ? 1.0 : Math.max(0, node.confidence - (error * 0.1)),
          energy: needsUpdate ? energy - energyCost : energy,
          needsUpdate,
          lastUpdateTime: needsUpdate ? time : node.lastUpdateTime
        };
      });
      
      // Update connections and calculate confirmation levels
      const connections = [...prevState.connections];
      
      // Reset confirmation levels
      nodes.forEach((node, i) => {
        nodes[i] = { ...node, confirmationLevel: 0, confirming: false };
      });
      
      // Calculate confirmation levels based on similar observations
      connections.forEach((conn, i) => {
        const sourceNode = nodes[conn.source];
        const targetNode = nodes[conn.target];
        
        // Calculate agreement between nodes
        const agreement = 1 - Math.abs(sourceNode.observation - targetNode.observation);
        
        // Determine if connection is active based on agreement and confidence
        const active = agreement > 0.7 && 
                      sourceNode.confidence > 0.5 && 
                      targetNode.confidence > 0.5;
        
        // Calculate confirmation flow direction and strength
        let confirmationFlow = 0;
        if (active) {
          // Flow from higher confidence to lower confidence
          if (sourceNode.confidence > targetNode.confidence) {
            confirmationFlow = agreement * conn.strength * (sourceNode.confidence - targetNode.confidence);
          } else {
            confirmationFlow = -agreement * conn.strength * (targetNode.confidence - sourceNode.confidence);
          }
          
          // Update confirmation levels
          nodes[conn.source].confirmationLevel += agreement * conn.strength;
          nodes[conn.target].confirmationLevel += agreement * conn.strength;
        }
        
        // Update connection
        connections[i] = {
          ...conn,
          active,
          confirmationFlow
        };
      });
      
      // Normalize confirmation levels
      const maxPossibleConfirmation = (nodes.length - 1) * params.connectionStrength;
      nodes.forEach((node, i) => {
        const normalizedConfirmation = node.confirmationLevel / maxPossibleConfirmation;
        nodes[i] = { 
          ...node, 
          confirmationLevel: normalizedConfirmation,
          confirming: normalizedConfirmation > 0.3
        };
      });
      
      // Check for consensus
      const confirmingNodes = nodes.filter(node => node.confirming);
      const consensusReached = confirmingNodes.length / nodes.length >= consensusThreshold;
      
      // Calculate consensus value if reached
      let consensusValue = null;
      let lastUpdateTime = prevState.lastUpdateTime;
      
      if (consensusReached && !prevState.consensusReached) {
        // Calculate average observation of confirming nodes
        consensusValue = confirmingNodes.reduce((sum, node) => sum + node.observation, 0) / confirmingNodes.length;
        lastUpdateTime = time;
        
        // Update all nodes to consensus value
        nodes.forEach((node, i) => {
          nodes[i] = {
            ...node,
            observation: consensusValue,
            energy: node.energy - (energyCost * 0.5), // Partial energy cost for consensus update
            lastUpdateTime: time
          };
        });
      }
      
      return {
        ...prevState,
        time,
        physicalSystem: { value, target, direction },
        nodes,
        connections,
        consensusReached,
        consensusValue: consensusReached ? consensusValue : prevState.consensusValue,
        lastUpdateTime
      };
    };
  }, [params]);
  
  // Animation step
  const animationStep = useCallback(() => {
    setSimState(calculateNextState());
    
    animationRef.current = requestAnimationFrame(animationStep);
  }, [calculateNextState]);
  
  // Start/stop simulation
  useEffect(() => {
    if (simState.running) {
      animationRef.current = requestAnimationFrame(animationStep);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [simState.running, animationStep]);
  
  // Toggle simulation running state
  const toggleSimulation = useCallback(() => {
    setSimState(prev => ({ ...prev, running: !prev.running }));
  }, []);
  
  // Reset simulation
  const resetSimulation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    initializeSimulation();
  }, [initializeSimulation]);
  
  // Update parameter
  const updateParameter = useCallback((paramName, value) => {
    setParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  }, []);
  
  // Calculate node color based on confirmation level
  const getNodeColor = (node) => {
    if (node.confirming) {
      // Green when confirming
      return `rgb(52, 211, 153, ${0.5 + node.confirmationLevel * 0.5})`;
    } else if (node.needsUpdate) {
      // Yellow when needs update
      return 'rgb(251, 191, 36)';
    } else {
      // Blue in normal state
      return `rgb(59, 130, 246, ${0.5 + node.confidence * 0.5})`;
    }
  };
  
  // Calculate connection color and opacity
  const getConnectionStyle = (connection) => {
    if (!connection.active) {
      return { stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 };
    }
    
    const absFlow = Math.abs(connection.confirmationFlow);
    
    if (connection.confirmationFlow > 0) {
      // Flow from source to target (blue to green)
      return { 
        stroke: `rgba(52, 211, 153, ${0.3 + absFlow * 0.7})`,
        strokeWidth: 1 + absFlow * 3
      };
    } else {
      // Flow from target to source (green to blue)
      return { 
        stroke: `rgba(59, 130, 246, ${0.3 + absFlow * 0.7})`,
        strokeWidth: 1 + absFlow * 3
      };
    }
  };
  
  // Render node labels
  const renderNodeLabel = (node) => {
    return (
      <text
        x={node.x}
        y={node.y + 30}
        textAnchor="middle"
        fill="white"
        fontSize="10"
      >
        {node.observation.toFixed(2)}
      </text>
    );
  };
  
  // Render physical system
  const renderPhysicalSystem = () => {
    const { value } = simState.physicalSystem;
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const size = 60 + value * 40; // Size varies with value
    
    return (
      <g>
        <circle
          cx={centerX}
          cy={centerY}
          r={size}
          fill={`rgba(255, 255, 255, ${0.1 + value * 0.3})`}
          stroke="white"
          strokeWidth="2"
          strokeDasharray={simState.consensusReached ? "5,5" : "none"}
        />
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="16"
          fontWeight="bold"
        >
          PS: {value.toFixed(2)}
        </text>
        {simState.consensusReached && (
          <text
            x={centerX}
            y={centerY + 25}
            textAnchor="middle"
            fill="#34D399"
            fontSize="12"
          >
            Consensus: {simState.consensusValue.toFixed(2)}
          </text>
        )}
      </g>
    );
  };
  
  // Render connection with animation
  const renderConnection = (connection, sourceNode, targetNode) => {
    const { active, confirmationFlow } = connection;
    const style = getConnectionStyle(connection);
    
    // If not active, render simple line
    if (!active) {
      return (
        <line
          x1={sourceNode.x}
          y1={sourceNode.y}
          x2={targetNode.x}
          y2={targetNode.y}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
        />
      );
    }
    
    // For active connections, add animated dots
    const lineLength = Math.sqrt(
      Math.pow(targetNode.x - sourceNode.x, 2) + 
      Math.pow(targetNode.y - sourceNode.y, 2)
    );
    
    // Calculate dot positions
    const dotCount = Math.max(2, Math.floor(lineLength / 30));
    const dots = [];
    
    for (let i = 0; i < dotCount; i++) {
      // Position varies with time for animation
      const position = ((simState.time / 20) + (i / dotCount)) % 1;
      
      // Direction based on confirmation flow
      const actualPosition = confirmationFlow > 0 ? position : 1 - position;
      
      const x = sourceNode.x + (targetNode.x - sourceNode.x) * actualPosition;
      const y = sourceNode.y + (targetNode.y - sourceNode.y) * actualPosition;
      
      dots.push(
        <circle
          key={`dot-${connection.source}-${connection.target}-${i}`}
          cx={x}
          cy={y}
          r={2 + Math.abs(confirmationFlow) * 3}
          fill={style.stroke}
        />
      );
    }
    
    return (
      <g>
        <line
          x1={sourceNode.x}
          y1={sourceNode.y}
          x2={targetNode.x}
          y2={targetNode.y}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
        />
        {dots}
      </g>
    );
  };
  
  return (
    <div className="bg-gradient-to-r from-blue-900/80 to-purple-900/80 text-white p-6 rounded-lg shadow-xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Network Confirmation Model</h2>
        <p className="text-gray-300 max-w-3xl mx-auto">
          This visualization demonstrates how multiple observer systems work together to confirm
          observations and reach consensus, creating a distributed form of consciousness.
        </p>
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
                max="12" 
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
                max="1" 
                step="0.1" 
                value={params.consensusThreshold}
                onChange={(e) => updateParameter('consensusThreshold', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>Connection Strength: {params.connectionStrength.toFixed(1)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="How strongly nodes influence each other">?</span>
              </label>
              <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.1" 
                value={params.connectionStrength}
                onChange={(e) => updateParameter('connectionStrength', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">Node Parameters</h4>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>Update Threshold: {params.updateThreshold.toFixed(1)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Threshold for individual node updates">?</span>
              </label>
              <input 
                type="range" 
                min="0.1" 
                max="0.7" 
                step="0.1" 
                value={params.updateThreshold}
                onChange={(e) => updateParameter('updateThreshold', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>Energy Cost: {params.energyCost.toFixed(2)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Energy cost per update">?</span>
              </label>
              <input 
                type="range" 
                min="0.05" 
                max="0.3" 
                step="0.01" 
                value={params.energyCost}
                onChange={(e) => updateParameter('energyCost', parseFloat(e.target.value))}
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
                min="0" 
                max="0.5" 
                step="0.1" 
                value={params.noiseLevel}
                onChange={(e) => updateParameter('noiseLevel', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="flex justify-between mb-1">
                <span>Physical Change Rate: {params.physicalChangeRate.toFixed(2)}</span>
                <span className="text-xs bg-blue-800 px-2 py-1 rounded" title="Rate of change in physical system">?</span>
              </label>
              <input 
                type="range" 
                min="0.005" 
                max="0.03" 
                step="0.005" 
                value={params.physicalChangeRate}
                onChange={(e) => updateParameter('physicalChangeRate', parseFloat(e.target.value))}
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
      
      {/* Network Visualization */}
      <div className="bg-black/30 rounded-lg p-4 mb-8" style={{ height: '500px' }}>
        <svg ref={svgRef} width="100%" height="100%" className="overflow-visible">
          {/* Render connections */}
          {simState.connections.map((connection, i) => {
            const sourceNode = simState.nodes[connection.source];
            const targetNode = simState.nodes[connection.target];
            
            return (
              <React.Fragment key={`conn-${connection.source}-${connection.target}`}>
                {renderConnection(connection, sourceNode, targetNode)}
              </React.Fragment>
            );
          })}
          
          {/* Render physical system */}
          {renderPhysicalSystem()}
          
          {/* Render nodes */}
          {simState.nodes.map((node, i) => (
            <g key={`node-${node.id}`}>
              <circle
                cx={node.x}
                cy={node.y}
                r={15 + node.confirmationLevel * 10}
                fill={getNodeColor(node)}
                stroke={node.confirming ? "#34D399" : "white"}
                strokeWidth={node.confirming ? 2 : 1}
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="10"
                fontWeight="bold"
              >
                OS{node.id}
              </text>
              {renderNodeLabel(node)}
              
              {/* Energy indicator */}
              <rect
                x={node.x - 15}
                y={node.y + 35}
                width={30}
                height={4}
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
              <rect
                x={node.x - 15}
                y={node.y + 35}
                width={30 * node.energy}
                height={4}
                fill={node.energy < 0.3 ? "rgb(239, 68, 68)" : "rgb(52, 211, 153)"}
              />
            </g>
          ))}
        </svg>
      </div>
      
      {/* Simulation Statistics */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-8">
        <h3 className="text-xl font-semibold mb-4">Simulation Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-sm text-gray-300">Simulation Time</p>
            <p className="text-2xl">{simState.time}</p>
          </div>
          <div>
            <p className="text-sm text-gray-300">Physical System</p>
            <p className="text-2xl">{simState.physicalSystem.value.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-300">Consensus Status</p>
            <p className="text-2xl">
              {simState.consensusReached ? (
                <span className="text-green-400">Reached</span>
              ) : (
                <span className="text-gray-400">Pending</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-300">Last Update</p>
            <p className="text-2xl">{simState.lastUpdateTime}</p>
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
  );
};

export default NetworkConfirmationVisual;
