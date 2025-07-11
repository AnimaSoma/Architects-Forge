import React, { useState } from 'react';
import FluidSimCanvas from './FluidSimCanvas.js';
import UIControls from './UIControls.jsx';
import LegendOverlay from './LegendOverlay.jsx';
import './styles.css';

const FluidSim = () => {
  const [mode, setMode] = useState('ISRM');
  const [params, setParams] = useState({
    temperature: 0.5,
    showCoherence: true,
    showEnergyOverlay: false,
  });

  return (
    <div className="fluid-sim-container relative bg-black p-4 rounded-xl">
      <UIControls params={params} setParams={setParams} setMode={setMode} />
      <FluidSimCanvas mode={mode} params={params} />
      <LegendOverlay />
    </div>
  );
};

export default FluidSim;
