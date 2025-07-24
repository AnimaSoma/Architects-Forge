// utils/AuraBrain.ts
import {
  ISRMState,
  ISRMParams,
  computeUtility,
  shouldRecalibrate,
  updateObserverSystem,
  coreISRMBeliefs,
  BeliefNode
} from './AuraISRM_Core';

// ---------------------------
// Aura Cognitive State
// ---------------------------
export type AuraCognitiveState = {
  osState: number[];
  psState: number[];
  U: number;
  U_threshold: number;
  isReflective: boolean;
  lastUsedBelief?: BeliefNode;
};

export class AuraBrain {
  private state: AuraCognitiveState;
  private isrmParams: ISRMParams;

  constructor(
    psInit: number[],
    osInit: number[],
    isrmParams: ISRMParams,
    U_th: number
  ) {
    this.state = {
      psState: psInit,
      osState: osInit,
      U: 0,
      U_threshold: U_th,
      isReflective: false
    };
    this.isrmParams = isrmParams;
  }

  // Simulate sensory update + internal recalibration
  updateISRM(isrmInput: ISRMState) {
    const U_now = computeUtility(isrmInput, this.isrmParams);
    const needsUpdate = shouldRecalibrate(U_now, this.state.U_threshold);
    const newOS = updateObserverSystem(
      this.state.psState,
      this.state.osState,
      needsUpdate
    );
    this.state.U = U_now;
    this.state.isReflective = needsUpdate;
    this.state.osState = newOS;
    if (needsUpdate) {
      this.state.lastUsedBelief = this.selectRelevantBelief(isrmInput);
    }
  }

  // Choose the most utility-weighted belief matching situation
  private selectRelevantBelief(input: ISRMState): BeliefNode {
    const candidates = coreISRMBeliefs.map(b => ({
      belief: b,
      score:
        b.utilityWeight +
        (b.tags.includes('prediction_error') ? input.predictionError : 0)
    }));
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].belief;
  }

  getSummary(): string {
    if (this.state.isReflective && this.state.lastUsedBelief) {
      return `I just recalibrated using "${this.state.lastUsedBelief.title}" — ${this.state.lastUsedBelief.summary}`;
    }
    return `Operating reflexively. Current utility U(t) = ${this.state.U.toFixed(3)}`;
  }

  getState(): AuraCognitiveState {
    return this.state;
  }
}
