import React from 'react';

const LegendOverlay = () => (
  <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-80 text-white p-2 rounded text-xs">
    <div><span className="text-blue-300">Blue:</span> High energy</div>
    <div><span className="text-white">White:</span> Low energy</div>
  </div>
);

export default LegendOverlay;