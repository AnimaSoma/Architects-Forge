import React, { useEffect, useRef, useState, useCallback } from 'react';

const GRID_SIZE = 20;
const STEP_DELAY = 100; // ms
const MAX_ENERGY = 30;

function createInitialGrid() {
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

  const placeRandom = (val, count) => {
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      grid[x][y] = val;
    }
  };

  placeRandom(1, 10); // food
  placeRandom(2, 25); // distraction
  return grid;
}

export default function ForgeArenaSim() {
  const [grid, setGrid] = useState(createInitialGrid);
  const [pos, setPos] = useState([0, 0]);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const memoryRef = useRef(new Set());
  const prevObsRef = useRef(null);
  const intervalRef = useRef(null);
  const utThreshold = 50;

  const getObservation = useCallback(
    (x, y, g) => {
      const obs = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            obs.push(g[nx][ny]);
          } else {
            obs.push(0);
          }
        }
      }
      return obs;
    },
    []
  );

  const predictionError = (prev, curr) => {
    if (!prev) return 0;
    return prev.reduce((sum, val, i) => sum + Math.abs(val - curr[i]), 0) / curr.length;
  };

  const step = useCallback(() => {
    setGrid(prevGrid => {
      const [x, y] = pos;
      const obs = getObservation(x, y, prevGrid);
      const error = predictionError(prevObsRef.current, obs);
      const ut = error * 1.0; // flat cost per surprise unit
      prevObsRef.current = obs;

      let best = [x, y];
      let bestScore = -Infinity;

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const key = `${nx},${ny}`;
            const novelty = memoryRef.current.has(key) ? -0.5 : 1;
            const content = prevGrid[nx][ny];
            const bonus = content === 1 ? 2 : content === 2 ? -1 : 0;
            const score = novelty + bonus;
            if (score > bestScore) {
              bestScore = score;
              best = [nx, ny];
            }
          }
        }
      }

      const [nx, ny] = ut > utThreshold ? best : [x, y];
      const cell = prevGrid[nx][ny];
      const newGrid = prevGrid.map(row => [...row]);
      if (cell === 1 || cell === 2) newGrid[nx][ny] = 0; // consume

      memoryRef.current.add(`${nx},${ny}`);

      setPos([nx, ny]);
      setEnergy(e => e - 1 + (cell === 1 ? 5 : 0));
      return newGrid;
    });
  }, [pos, getObservation]);

  // Main loop
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setEnergy(e => {
        if (e <= 0) return 0;
        return e; // keep as is; step will deduct
      });
      if (energy > 0) step();
    }, STEP_DELAY);
    return () => clearInterval(intervalRef.current);
  }, [energy, step]);

  return (
    <div className="p-4 bg-black/80 rounded-lg shadow-lg max-w-max mx-auto">
      <h2 className="text-xl font-bold mb-3 text-center">
        ISRM Coherence-Gated Agent Simulation
      </h2>
      <div
        className="grid gap-px bg-gray-700"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1rem)` }}
      >
        {grid.map((row, x) =>
          row.map((cell, y) => {
            const isAgent = pos[0] === x && pos[1] === y;
            const bg = isAgent
              ? 'bg-blue-500'
              : cell === 1
              ? 'bg-green-400'
              : cell === 2
              ? 'bg-yellow-300'
              : 'bg-gray-200';
            return (
              <div key={`${x},${y}`} className={`${bg} w-4 h-4`} />
            );
          })
        )}
      </div>
      <p className="mt-2 text-sm text-gray-300">Energy: {energy}</p>
      <p className="text-xs text-gray-500">U(t) gating threshold: {utThreshold}</p>
    </div>
  );
}
