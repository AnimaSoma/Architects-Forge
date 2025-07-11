import React, { useEffect, useState, useCallback } from 'react';

const GRID = 30;
const STEP_MS = 200;
const MAX_ENERGY = 300;
const UT_THRESHOLD = 0.5; // gating threshold for ISRM
const FOOD_REWARD = 5;
const DISTRACTION_PENALTY = -3;

const CELL = { EMPTY: 0, FOOD: 1, DISTRACTION: 2 };

const freshGrid = () => {
  const g = Array.from({ length: GRID }, () => Array(GRID).fill(CELL.EMPTY));
  const rand = (val, n) => {
    for (let i = 0; i < n; i++) {
      g[Math.floor(Math.random() * GRID)][Math.floor(Math.random() * GRID)] = val;
    }
  };
  rand(CELL.FOOD, 60);
  rand(CELL.DISTRACTION, 40);
  return g;
};

const inBounds = (x, y) => x >= 0 && x < GRID && y >= 0 && y < GRID;
const neighbours = ([x, y]) =>
  [-1, 0, 1]
    .flatMap(dx => [-1, 0, 1].map(dy => [x + dx, y + dy]))
    // exclude the current cell and keep only in-bounds positions
    .filter(([a, b]) => !(a === x && b === y) && inBounds(a, b));

export default function AgentComparisonSim() {
  const [grid, setGrid] = useState(freshGrid);
  const [agents, setAgents] = useState([
    { name: 'ISRM', color: 'bg-blue-500',   pos: [0, 0],         energy: MAX_ENERGY, memory: new Set(), ut: 0 },
    { name: 'MuZero', color: 'bg-red-500',  pos: [GRID - 1, 0],  energy: MAX_ENERGY, valueTable: {},     ut: 0 },
    { name: 'Rainbow', color: 'bg-purple-500', pos: [0, GRID - 1], energy: MAX_ENERGY, qTable: {}, epsilon: 0.1, ut: 0 },
  ]);

  const step = useCallback(() => {
    setAgents(prev =>
      prev.map(agent => {
        if (agent.energy <= 0) return agent;
        const moves = neighbours(agent.pos);
        let bestMove = agent.pos;

        if (agent.name === 'ISRM') {
          let best = -Infinity;
          moves.forEach(([mx, my]) => {
            const novelty = agent.memory.has(`${mx},${my}`) ? -0.5 : 1;
            const cell = grid[mx][my];
            const bonus = cell === CELL.FOOD ? 2 : cell === CELL.DISTRACTION ? -1 : 0;
            const score = novelty + bonus;
            if (score > best) {
              best = score;
              bestMove = [mx, my];
            }
          });
        } else if (agent.name === 'MuZero') {
          let best = -Infinity;
          moves.forEach(([mx, my]) => {
            const cell = grid[mx][my];
            const r = cell === CELL.FOOD ? FOOD_REWARD : cell === CELL.DISTRACTION ? DISTRACTION_PENALTY : -0.1;
            const v = agent.valueTable[`${mx},${my}`] ?? 0;
            const total = r + 0.8 * v;
            if (total > best) {
              best = total;
              bestMove = [mx, my];
            }
          });
        } else {
          if (Math.random() < agent.epsilon) {
            bestMove = moves[Math.floor(Math.random() * moves.length)];
          } else {
            let best = -Infinity;
            moves.forEach(([mx, my]) => {
              const q = agent.qTable[`${mx},${my}`] ?? 0;
              if (q > best) {
                best = q;
                bestMove = [mx, my];
              }
            });
          }
        }

        // ---------- U(t) & gating -------------------------------------------------
        let cellType = grid[bestMove[0]][bestMove[1]];
        let predictionError;
        if (cellType === CELL.FOOD) predictionError = 1.0;
        else if (cellType === CELL.DISTRACTION) predictionError = 0.7;
        else predictionError = Math.random() * 0.2;
        let ut = predictionError * 1.0; // baseCost == 1

        // If ISRM deems salience low, hold position
        if (agent.name === 'ISRM' && ut < UT_THRESHOLD) {
          bestMove = agent.pos;           // stay put
        }

        // ensure cellType reflects FINAL move choice
        cellType = grid[bestMove[0]][bestMove[1]];

        // ---------- Energy delta --------------------------------------------------
        let delta = -1; // base drain
        if (cellType === CELL.FOOD) delta += FOOD_REWARD;
        if (cellType === CELL.DISTRACTION) delta += DISTRACTION_PENALTY;
        if (cellType === CELL.EMPTY) delta += 0.1; // small rest recovery

        if (agent.name === 'ISRM') agent.memory.add(`${bestMove[0]},${bestMove[1]}`);
        if (agent.name === 'MuZero') {
          const key = `${bestMove[0]},${bestMove[1]}`;
          const prevV = agent.valueTable[key] ?? 0;
          agent.valueTable[key] =
            prevV + 0.1 * ((cellType === CELL.FOOD ? 1 : 0) - prevV);
        }
        if (agent.name === 'Rainbow') {
          const key = `${bestMove[0]},${bestMove[1]}`;
          const oldQ = agent.qTable[key] ?? 0;
          const r =
            cellType === CELL.FOOD ? 1 : cellType === CELL.DISTRACTION ? -1 : 0;
          agent.qTable[key] = oldQ + 0.1 * (r - oldQ);
        }

        return { ...agent, pos: bestMove, energy: agent.energy + delta, ut };
      })
    );

    /* Clear consumed items using the new agent positions */
    setGrid(prevGrid => {
      const next = prevGrid.map(r => [...r]);
      agents.forEach(a => {
        const [x, y] = a.pos;
        next[x][y] = CELL.EMPTY;
      });
      return next;
    });
  }, [grid, agents]);

  useEffect(() => {
    const id = setInterval(step, STEP_MS);
    return () => clearInterval(id);
  }, [step]);

  const cellClass = (x, y) => {
    const a = agents.find(p => p.pos[0] === x && p.pos[1] === y);
    if (a) return a.color;
    const c = grid[x][y];
    return c === CELL.FOOD ? 'bg-green-400' : c === CELL.DISTRACTION ? 'bg-yellow-300' : 'bg-gray-200';
  };

  return (
    <div className="p-4 bg-black/75 rounded-lg shadow-lg text-white max-w-max mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">ISRM vs MuZero vs Rainbow – Mini Arena</h2>
      <div
        className="grid gap-px bg-gray-700"
        style={{ gridTemplateColumns: `repeat(${GRID},0.7rem)` }}
      >
        {Array.from({ length: GRID }).map((_, x) =>
          Array.from({ length: GRID }).map((_, y) => (
            <div
              key={`${x},${y}`}
              className={cellClass(x, y)}
              style={{ width: '0.7rem', height: '0.7rem' }}
            />
          ))
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
        {agents.map(a => (
          <div key={a.name} className="text-center">
            <p className="font-semibold">{a.name}</p>
            <p className="mt-1">Energy {a.energy}</p>
            <p>U(t) {a.ut.toFixed(1)}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-gray-400 text-center text-[10px]">Blue ISRM · Red MuZero · Purple Rainbow · Green food · Yellow distractions</p>
    </div>
  );
}
