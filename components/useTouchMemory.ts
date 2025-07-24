import { useRef } from 'react';
import * as THREE from 'three';

export interface TouchMemory {
  position: THREE.Vector3;
  intensity: number; // grows each touch
  decayTimer: number; // seconds remaining
}

/**
 * useTouchMemory – manage a list of memory points with decay.
 * addTouch(worldPos) pushes / boosts a memory. Call update(dt) each frame.
 */
export function useTouchMemory(decayRate = 0.05, boost = 0.3) {
  const memories = useRef<TouchMemory[]>([]);

  /**
   * Register a touch event.
   *
   * @param pos   World‐space position that was touched.
   * @param power Optional intensity boost (defaults to 0.6).  The scar size
   *              in the shader now scales with this value:
   *              `scarSize = baseScarSize * normalize(ΔS(t))`
   */
  function addTouch(pos: THREE.Vector3, power = 0.6) {
    const mem = memories.current.find(m => m.position.distanceTo(pos) < 0.2);
    if (mem) {
      mem.intensity = Math.min(2, mem.intensity + power);
      mem.decayTimer = 1; // reset timer
    } else {
      memories.current.push({
        position: pos.clone(),
        intensity: power,
        decayTimer: 1
      });
    }
  }

  function update(dt: number) {
    memories.current.forEach(m => {
      m.decayTimer -= dt * decayRate;
      m.intensity = Math.max(0, m.intensity - dt * decayRate);
    });
    memories.current = memories.current.filter(m => m.intensity > 0.01);
  }

  return { memories, addTouch, update };
}
