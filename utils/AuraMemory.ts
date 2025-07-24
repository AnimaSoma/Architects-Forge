// utils/AuraMemory.ts
import * as THREE from 'three';

export type ScarMemory = {
  id: string;
  position: THREE.Vector3;
  intensity: number; // fades over time unless reinforced
  age: number;
};

/**
 * AuraMemory keeps a rolling window of spatial scars that drive blob deformations
 * and feed into cognitive salience. Intensity decays exponentially unless
 * reinforced by user interaction or internal reflection.
 */
export class AuraMemory {
  public current: ScarMemory[] = [];
  private decayRate: number;
  private maxMemories: number;
  private idCounter = 0;

  constructor(decayRate: number = 0.1, maxMemories: number = 10) {
    this.decayRate = decayRate;
    this.maxMemories = maxMemories;
  }

  addScar(position: THREE.Vector3, strength: number = 1.0) {
    const id = `scar_${this.idCounter++}`;
    // Merge with a nearby scar if within ~10 cm (unit sphere basis)
    const existing = this.current.find(m => m.position.distanceTo(position) < 0.1);
    if (existing) {
      existing.intensity = Math.min(1, existing.intensity + strength * 0.5);
      existing.age = 0;
      return;
    }

    // Capacity management
    if (this.current.length >= this.maxMemories) {
      // Drop the weakest scar
      this.current.sort((a, b) => a.intensity - b.intensity);
      this.current.shift();
    }

    this.current.push({ id, position, intensity: strength, age: 0 });
  }

  update(delta: number) {
    for (const mem of this.current) {
      mem.intensity -= this.decayRate * delta;
      mem.age += delta;
    }
    this.current = this.current.filter(mem => mem.intensity > 0.01);
  }

  reinforceScar(id: string, amount: number = 0.2) {
    const scar = this.current.find(m => m.id === id);
    if (scar) scar.intensity = Math.min(1, scar.intensity + amount);
  }

  getStrongestScar(): ScarMemory | null {
    if (this.current.length === 0) return null;
    return this.current.reduce((prev, curr) => (curr.intensity > prev.intensity ? curr : prev));
  }
}
