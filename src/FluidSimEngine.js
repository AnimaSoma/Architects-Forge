export function initMolecules(count) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 800,
    y: Math.random() * 600,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    energy: Math.random(),
    coherence: 1.0,
  }));
}

export function updateSimulation(molecules, mode, params) {
  for (const m of molecules) {
    const energyLoss = 0.001 + (1 - m.coherence) * 0.01;
    m.energy -= energyLoss;
    m.energy = Math.max(0, m.energy);

    m.x += m.vx;
    m.y += m.vy;

    if (m.x < 0 || m.x > 800) m.vx *= -1;
    if (m.y < 0 || m.y > 600) m.vy *= -1;
  }
}