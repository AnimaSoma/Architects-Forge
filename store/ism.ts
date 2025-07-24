import { create } from 'zustand';

export interface ISRMState {
  predictionError: number; // ΔS (0–1)
  coherenceTension: number; // ΔC (0–1)
  utility: number;          // U(t) 0–1
  energy: number;          // 0–1
  update(partial: Partial<ISRMState>): void;
  addEnergy(amount: number): void;
}

export const useISRM = create<ISRMState>((set) => ({
  predictionError: 0.2,
  coherenceTension: 0.4,
  utility: 0.6,
  energy: 1.0,
  update: (partial) => set(partial),
  addEnergy: (amount) =>
    set((s) => ({ energy: Math.min(1, s.energy + amount) }))
}));
