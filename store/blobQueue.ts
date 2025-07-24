import { create } from 'zustand';
import * as THREE from 'three';

function randomPointOnSphere(r = 1): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
}

interface QueueState {
  queue: THREE.Vector3[];
  addScar: (pos?: THREE.Vector3) => void;
  popScar: () => THREE.Vector3 | undefined;
}

export const useBlobQueue = create<QueueState>((set, get) => ({
  queue: [],
  addScar: (pos) => {
    const p = pos ?? randomPointOnSphere(1);
    set((state) => ({ queue: [...state.queue, p] }));
  },
  popScar: () => {
    const { queue } = get();
    if (queue.length === 0) return undefined;
    const [first, ...rest] = queue;
    set({ queue: rest });
    return first;
  }
}));
