// utils/EnergyManager.ts

export class EnergyManager {
  energy: number;
  maxEnergy: number;
  logging: boolean;

  constructor(initialEnergy = 1.0, maxEnergy = 1.0, logging = true) {
    this.energy = initialEnergy;
    this.maxEnergy = maxEnergy;
    this.logging = logging;
  }

  rewardISRM(contextualFitScore: number, multiplier: number = 1.0): void {
    const baseReward = 0.3;
    const capped = Math.min(1, Math.max(0, contextualFitScore));
    const reward = (baseReward + 0.7 * capped) * multiplier;
    this.energy = Math.min(this.maxEnergy, this.energy + reward);
    if (this.logging) {
      console.log(`[EnergyManager] Gained ${reward.toFixed(2)} energy from ISRM insight.`);
    }
  }

  consume(cost: number): void {
    this.energy = Math.max(0, this.energy - cost);
    if (this.logging) {
      console.log(`[EnergyManager] Consumed ${cost.toFixed(2)} energy.`);
    }
  }

  decay(rate: number = 0.002): void {
    this.energy = Math.max(0, this.energy - rate);
    if (this.logging) {
      console.log(`[EnergyManager] Passive decay: -${rate.toFixed(4)} → E=${this.energy.toFixed(2)}`);
    }
  }

  set(value: number): void {
    this.energy = Math.max(0, Math.min(this.maxEnergy, value));
  }

  get(): number {
    return this.energy;
  }

  isLow(): boolean {
    return this.energy < 0.2;
  }

  isDepleted(): boolean {
    return this.energy <= 0;
  }
}
