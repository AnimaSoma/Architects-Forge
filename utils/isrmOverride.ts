// utils/isrmOverride.ts
// Lightweight middleware for domain-specific overrides before any LLM call.
// If the user input references a known key term keyed in `knownTerms`, return a
// canned summary string; else return null.

export type KnownTerm = {
  title: string;
  description: string;
  summary: string;
};

const knownTerms: Record<string, KnownTerm> = {
  isrm: {
    title: 'Interactionist Self-Regulation Model',
    description:
      'A unifying framework for adaptation and consciousness grounded in energy-constrained prediction error and coherence dynamics.',
    summary:
      'The Interactionist Self-Regulation Model (ISRM) explains behaviour, time, and consciousness using energy-limited prediction error and coherence collapse. Its update urgency is formalised in U(t) = (α M(t)+β σ²(t))·(E_max−γ∫_0^t U(τ)dτ+I(t))·δ‖S_PS−S_OS‖, spanning systems from atoms to minds.'
  }
};

/**
 * Normalise and check the user input for any override triggers.
 * If a term is found, return the canned answer to short-circuit the LLM.
 */
export function interceptUserMessage(userInput: string): string | null {
  const normalized = userInput.toLowerCase();

  // Override ONLY when the user is clearly talking about the Rock-Mechanics
  // society or explicitly asks what the acronym means. Otherwise let the LLM
  // respond normally.
  const isRockMechContext =
    normalized.includes('international society for rock mechanics') ||
    normalized.includes('rock mechanics');

  const isAcronymQuery = /(what does|stand for).+isrm/.test(normalized);

  if ((isRockMechContext || isAcronymQuery) && normalized.includes('isrm')) {
    return knownTerms['isrm'].summary;
  }

  return null;
}
