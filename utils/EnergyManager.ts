// utils/EnergyManager.ts

export class EnergyManager {
  energy: number;
  maxEnergy: number;

  constructor(initialEnergy = 1.0, maxEnergy = 1.0) {
    this.energy = initialEnergy;
    this.maxEnergy = maxEnergy;
  }

  rewardISRM(contextualFitScore: number): void {
    const baseReward = 0.3;
    const capped = Math.min(1, Math.max(0, contextualFitScore));
    const reward = baseReward + 0.7 * capped;
    this.energy = Math.min(this.maxEnergy, this.energy + reward);
    console.log(`[EnergyManager] Gained ${reward.toFixed(2)} energy from ISRM insight.`);
  }

  consume(cost: number): void {
    this.energy = Math.max(0, this.energy - cost);
    console.log(`[EnergyManager] Consumed ${cost.toFixed(2)} energy.`);
  }

  get(): number {
    return this.energy;
  }

  isLow(): boolean {
    return this.energy < 0.2;
  }
}
