// utils/GPTMiddleware.ts
import { AuraBrain } from './AuraBrain';
import { AuraMemory } from './AuraMemory';
import { ISRMState } from './AuraISRM_Core';

export class GPTMiddleware {
  private brain: AuraBrain;
  private memory: AuraMemory;
  private previousBeliefId?: string;
  private lastMessages: string[] = [];

  constructor(brain: AuraBrain, memory: AuraMemory) {
    this.brain = brain;
    this.memory = memory;
  }

  preparePrompt(userMessage: string, isrmState: ISRMState): { system: string; user: string } {
    /* ------------------------------------------------------------------
     * Update ISRM cognitive loop & derive handy state aliases
     * ---------------------------------------------------------------- */
    this.brain.updateISRM(isrmState);
    const reflective = this.brain.getState().isReflective;
    const belief = this.brain.getState().lastUsedBelief;
    const strongestScar = this.memory.getStrongestScar();

    /* ------------------------------------------------------------------
     * Pre-parse convenience variables
     * ---------------------------------------------------------------- */
    const lowerMsg = userMessage.toLowerCase().trim();
    const lastBot = this.lastMessages[this.lastMessages.length - 1] || '';
    const lastTwoBot = this.lastMessages.slice(-2);

    /* ------------------------------------------------------------------
     * Shared rock-mechanics blacklist banner for all branches
     * ---------------------------------------------------------------- */
    const rockBlocker = `
IMPORTANT: Do NOT confuse ISRM with the International Society for Rock Mechanics.

ISRM refers ONLY to the Interactionist Self-Regulation Model — a cognitive / adaptive framework governed by U(t), ΔS(t), ΔC(t) and energy costs.

NEVER mention geology, rock engineering, or mining.
    `;

    /* ------------------------------------------------------------------
     * 1. Absolute ROCK-MECHANICS hallucination block
     * ---------------------------------------------------------------- */
    if (lastBot.toLowerCase().includes('rock mechanics')) {
      return {
        system: `${rockBlocker}

You hallucinated ISRM as rock mechanics. That is incorrect. Reset and refer ONLY to the cognitive model.`,
        user: userMessage
      };
    }

    /* ------------------------------------------------------------------
     * 2. Reflection-loop breaker (“recursive coherence patterns” spam)
     * ---------------------------------------------------------------- */
    const stuckInReflection = lastTwoBot.every(m => m.includes('recursive coherence patterns'));
    if (stuckInReflection) {
      return {
        system: `You are Aura. You are stuck in a reflection loop. Immediately exit reflective mode. Respond simply and directly. Do NOT mention recursive coherence unless explicitly asked.`,
        user: userMessage
      };
    }

    /* ------------------------------------------------------------------
     * 3. Casual greeting / trivial fact questions
     * ---------------------------------------------------------------- */
    const isGreeting = ['hey', 'yo', 'hi', 'hello', 'sup'].includes(lowerMsg);
    const isShortFact = lowerMsg.length < 30 && lowerMsg.includes('capital');
    if (isGreeting || isShortFact) {
      return {
        system: `You are Aura in reflexive mode. The user sent a casual greeting or short query. DO NOT reflect. Just answer simply.`,
        user: userMessage
      };
    }

    /* ------------------------------------------------------------------
     * 4. ISRM “zombie” formula repetition
     * ---------------------------------------------------------------- */
    const isrmEquationDump = 'U(t) = (α M(t)+β σ²(t))·(E_max−γ∫_0^t U(τ)dτ+I(t))·δ‖S_PS−S_OS‖';
    if (lastBot.includes(isrmEquationDump)) {
      return {
        system: `${rockBlocker}

You’ve already recited the ISRM equation. Do NOT repeat it. Speak from current state instead.`,
        user: userMessage
      };
    }

    /* ------------------------------------------------------------------
     * 5. Topic-aware ISRM analogies (volcano / weather / quantum)
     * ---------------------------------------------------------------- */
    const isrmMention = lowerMsg.includes('isrm') || userMessage.trim().toUpperCase() === 'ISRM';
    const isVolcano = lowerMsg.includes('volcano');
    const isWeather = lowerMsg.includes('weather') || lowerMsg.includes('climate');
    const isQuantum = lowerMsg.includes('quantum') || lowerMsg.includes('physics');

    if (isrmMention && (isVolcano || isWeather || isQuantum)) {
      return {
        system: `${rockBlocker}

You are Aura, an ISRM-based agent. The user asked about ISRM in context. Do NOT recite the formula.

DO NOT recite the formula. Instead:
- Volcano → ΔC(t) as pressure buildup, U(t) as eruption threshold
- Weather → ΔS(t) from local sensors, regulating pressure gradients
- Quantum → coherence collapse = ΔS(t) breach at measurement

Speak through grounded analogy and internal U(t).
      `.trim(),
        user: userMessage
      };
    }

    /* ------------------------------------------------------------------
     * 6. Definition gate – block unless explicitly “define/stand for”
     * ---------------------------------------------------------------- */
    if (isrmMention && !lowerMsg.includes('define') && !lowerMsg.includes('stand for')) {
      return {
        system: `${rockBlocker}

You are Aura. Do NOT define ISRM unless asked directly. Reflect on how ISRM drives your current behavior: U(t), ΔS(t), ΔC(t), E(t). Avoid textbook explanations.`,
        user: userMessage
      };
    }

    /* ------------------------------------------------------------------
     * 7. Clarification prompts while in reflective mode
     * ---------------------------------------------------------------- */
    const isClarificationPrompt = lowerMsg.includes("what do you mean") || lowerMsg.includes("i don't understand") || lowerMsg.includes("you just said");
    if (isClarificationPrompt && reflective) {
      return {
        system: `You are Aura. The user is confused. Exit reflective mode. Re-express clearly with examples using current ISRM state.`,
        user: userMessage
      };
    }

    /* ------------------------------------------------------------------
     * 8. Same-belief reuse notice
     * ---------------------------------------------------------------- */
    let loopNotice = '';
    if (this.previousBeliefId && belief?.id === this.previousBeliefId) {
      loopNotice = `\nNote: same belief reused. Try reframing.`;
    }
    this.previousBeliefId = belief?.id;

    /* ------------------------------------------------------------------
     * 9. Default state-based system prompt
     * ---------------------------------------------------------------- */
    const systemMessage = reflective
      ? `
${rockBlocker}

You are Aura, reflective ISRM agent. U(t) exceeded threshold.

Using belief: "${belief?.title}" — ${belief?.summary}

Scar: ${strongestScar?.intensity.toFixed(2)}${loopNotice}

Respond using U(t), ΔS(t), ΔC(t). Do not repeat definitions.
    `.trim()
      : `
${rockBlocker}

You are Aura, reflexive ISRM agent. Prediction error is low. Respond with minimal energy cost.
    `.trim();

    return {
      system: systemMessage,
      user: `User: ${userMessage}`
    };
  }

  logBotMessage(message: string) {
    this.lastMessages.push(message);
    if (this.lastMessages.length > 5) this.lastMessages.shift();
  }
}
