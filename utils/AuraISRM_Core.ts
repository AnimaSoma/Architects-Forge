// utils/AuraISRM_Core.ts
// -----------------------------------------------------------------------------
//  Core Interactionist Self-Regulation Model (ISRM) utilities for Aura
// -----------------------------------------------------------------------------

// ---------------------------
// Core ISRM Equation Types
// ---------------------------
export type ISRMState = {
  energy: number;          // E(t)
  coherenceLoss: number;   // ΔC(t)
  salience: number;        // S(t)
  inertia: number;         // I(t)
  predictionError: number; // ΔS(t)
};

export type ISRMParams = {
  alpha: number;              // salience weight for M(t)
  beta: number;               // salience weight for σ²(t)
  gamma: number;              // energy decay weight
  delta: number;              // prediction-error gain
  utilityThreshold: number;   // U_th – private trigger
};

// ---------------------------
// Utility Function U(t)
// ---------------------------
// A deliberately simple form that captures the three-way product described in
// the formulation section. Tunable weights let Aura experiment during runtime.
export function computeUtility(state: ISRMState, params: ISRMParams): number {
  const { energy, coherenceLoss, salience, inertia, predictionError } = state;
  const { alpha, beta, gamma, delta } = params;

  // One possible instantiation of the generic U(t) template.
  const U = salience * (energy - gamma) * (delta * predictionError);
  return U - (alpha * energy + beta * coherenceLoss + inertia);
}

export function shouldRecalibrate(U: number, U_th: number): boolean {
  return U > U_th;
}

// ---------------------------
// Recursive Loop – align OS to PS when forced
// ---------------------------
export function updateObserverSystem(
  psState: number[],
  osState: number[],
  forceUpdate: boolean
): number[] {
  if (!forceUpdate) return osState;
  return [...psState]; // Align OS to PS snapshot
}

// ---------------------------
// ISRM Belief Graph
// ---------------------------
export type BeliefNode = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  utilityWeight: number; // importance for retrieval / scoring
  links: string[];       // outbound concept edges
};

export const coreISRMBeliefs: BeliefNode[] = [
  {
    id: 'U_equation',
    title: 'ISRM Utility Equation',
    summary:
      'U(t) = -αE(t) - βΔC(t) + γS(t) - δI(t) captures adaptive pressure.',
    tags: ['utility', 'adaptation', 'energy'],
    utilityWeight: 0.9,
    links: ['coherence_loss', 'salience', 'prediction_error']
  },
  {
    id: 'coherence_loss',
    title: 'Coherence Loss',
    summary:
      'ΔC(t) is the loss of internal consistency between OS and PS expectations.',
    tags: ['coherence', 'stress', 'misalignment'],
    utilityWeight: 0.8,
    links: ['prediction_error']
  },
  {
    id: 'prediction_error',
    title: 'Prediction Error',
    summary:
      'ΔS(t) = ||S_PS - S_OS|| is the scaled sensory mismatch driving scar formation.',
    tags: ['scar', 'surprise', 'learning'],
    utilityWeight: 1.0,
    links: ['update_loop']
  },
  {
    id: 'update_loop',
    title: 'Recursive Update Loop',
    summary: 'When U(t) > U_th, OS recalibrates to PS state.',
    tags: ['update', 'loop', 'observer'],
    utilityWeight: 0.85,
    links: ['prediction_error', 'coherence_loss']
  }
];
