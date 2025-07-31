// utils/ISRM_Core.ts

export interface ISRMInput {
  deltaS: number;
  deltaC: number;
  energy: number;
  ru?: number;
}

export interface ISRMParams {
  alpha?: number;
  beta?: number;
  gamma?: number;
  delta?: number;
}

export interface ISRMOutput {
  utility: number;
  deltaU: number;
  breakdown: {
    deltaS: number;
    deltaC: number;
    energy: number;
    ru: number;
  };
  weights: ISRMParams;
  dominantDriver: string;
}

export class ISRMCore {
  private lastUtility: number = 0;
  private weights: Required<ISRMParams> = {
    alpha: 1.0,
    beta: 1.0,
    gamma: 0.5,
    delta: 0.2
  };

  compute(input: ISRMInput): ISRMOutput {
    const { deltaS, deltaC, energy, ru = 0 } = input;
    const { alpha, beta, gamma, delta } = this.weights;

    const utility = alpha * deltaS + beta * deltaC + gamma * energy + delta * ru;
    const clampedUtility = Math.max(0, Math.min(1, utility));
    const deltaU = clampedUtility - this.lastUtility;
    this.lastUtility = clampedUtility;

    const breakdown = { deltaS, deltaC, energy, ru };
    const dominantDriver = this.getDominantDriver(breakdown);

    return {
      utility: clampedUtility,
      deltaU,
      breakdown,
      weights: this.weights,
      dominantDriver
    };
  }

  getDominantDriver(breakdown: { deltaS: number; deltaC: number; energy: number; ru: number }): string {
    const entries = Object.entries(breakdown);
    const [key] = entries.reduce((max, curr) => (curr[1] > max[1] ? curr : max));
    switch (key) {
      case 'deltaS': return 'Prediction Error (ΔS)';
      case 'deltaC': return 'Coherence Loss (ΔC)';
      case 'energy': return 'Energy Reserve (E)';
      case 'ru': return 'Recursive Activity (RU)';
      default: return 'Unknown';
    }
  }

  updateWeightsFromFeedback(feedback: Partial<ISRMParams>) {
    this.weights = {
      alpha: Math.max(0, feedback.alpha ?? this.weights.alpha),
      beta: Math.max(0, feedback.beta ?? this.weights.beta),
      gamma: Math.max(0, feedback.gamma ?? this.weights.gamma),
      delta: Math.max(0, feedback.delta ?? this.weights.delta)
    };
  }

  getWeights(): Required<ISRMParams> {
    return this.weights;
  }

  setWeights(newWeights: Required<ISRMParams>) {
    this.weights = newWeights;
  }

  getLastUtility(): number {
    return this.lastUtility;
  }
}
