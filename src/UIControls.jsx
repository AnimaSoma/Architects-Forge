import React from 'react';

const UIControls = ({ params, setParams, setMode }) => {
  return (
    <div className="text-white space-y-2 mb-4">
      <div>
        <label>Temperature: {params.temperature.toFixed(2)}</label>
        <input type="range" min="0" max="1" step="0.01"
          value={params.temperature}
          onChange={e => setParams(p => ({ ...p, temperature: parseFloat(e.target.value) }))} />
      </div>
      <div>
        <label>
          <input type="checkbox" checked={params.showCoherence}
            onChange={e => setParams(p => ({ ...p, showCoherence: e.target.checked }))} />
          Show Coherence
        </label>
      </div>
      <div>
        <label>
          <input type="checkbox" checked={params.showEnergyOverlay}
            onChange={e => setParams(p => ({ ...p, showEnergyOverlay: e.target.checked }))} />
          Show Energy Overlay
        </label>
      </div>
      <div>
        <label>
          Mode:
          <select value={params.mode} onChange={e => setMode(e.target.value)}>
            <option value="ISRM">ISRM</option>
            <option value="CLASSICAL">Classical</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default UIControls;