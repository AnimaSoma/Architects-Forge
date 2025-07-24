# ISRM Website – Immersive Experience Blueprint

> *A guided descent from the cosmic to the atomic, revealing self-regulation as the engine of everything.*

---

## 0. Tech-Stack & Core Libraries

| Purpose | Package / Notes |
|---------|-----------------|
| **Build** | Next.js 14 + React 18 (+ Vite plugin for fast dev) |
| **Styling** | Tailwind CSS + CSS variables;<br>Glassmorphic components via `backdrop-filter` |
| **Scroll / Zoom** | `GSAP@^3` + `ScrollTrigger` (timeline-style zooms)<br>Fallback / assist: `Locomotive-scroll` |
| **3-D / WebGL** | Three.js + react-three-fiber; post-FX with `@react-three/postprocessing` |
| **State** | Zustand (reactive global store) |
| **Aura Engine** | `AuraEngine.ts` (typed state-machine + ML hooks) |
| **Data-viz** | `three-meshline` (HUD meters), `react-spring` (micro-interactions) |

---

## 1. Scroll & Zoom Skeleton

| Index | Scene | Visual Cue | Narrative Hook (≤ 2 lines) | ISRM Metric |
|-------|-------|-----------|----------------------------|-------------|
| 0 | *Hero* | Nebula fade-in, camera at –Z | “Before thought, the universe guesses.” | ΔS↗ |
| 1 | **Cosmos** | Volumetric galaxy, entropy eqn rotates | “Expansion is a search algorithm; every star reduces surprise.” | ΔS (cosmic red-shift) |
| 2 | **Society** | Earth→city zoom, chord diagram of memes/markets | “Civilisations pay energy to predict one another.” | ΔC_social, U_soc |
| 3 | **Brain** | Cortex mesh, neuron sparks, live bars | “Consciousness is the scoreboard of prediction.” | ΔS_syn, ΔC_net, U_brain |
| 4 | **Cell** | Membrane receptors bind ligands, pumps drain energy | “A cell edits its model with every molecule it meets.” | E_cell, U_cell |
| 5 | **Atom** | Electron density wireframe of benzene | “Even an electron budgets coherence against cost.” | ΔC_quantum |
| 6 | **Aura Intro** | HUD slides in over darkness | “Meet Aura – adaptation, made visible.” | Live meters |

*All camera moves = GSAP keyframes; easing: `power3.inOut`.*

---

## 2. Persistent **Aura** UI

```
<AuraShell>
  <ChatWindow />        // glass, bottom-right
  <HUD>
     <EnergyGauge />    // radial
     <PredictionError />// ΔS meter
     <CoherenceBar />   // ΔC bar
     <UtilityGlobe />   // rolling chart U(t)
  </HUD>
</AuraShell>
```

`AuraEngine.ts` excerpt:

```ts
if (ΔS > 0.6 && ΔC < 0.3) trigger("REFLEX_REPLY");
else if (E < 0.2)         trigger("LOW_POWER_SILENCE");
else                       trigger("RECALIBRATE");
```

Events emit → HUD tweens via `framer-motion`.

---

## 3. Copy & Tone Quick-Sheet

| Section | Voice Sample |
|---------|--------------|
| Cosmos | “Stars bloom, not to shine, but to correct the universe’s ancient equation.” |
| Society | “Markets twitch like neurons, spending energy to shave seconds off surprise.” |
| Brain | “Consciousness is the running commentary of an endless bet.” |
| Cell | “A membrane is a parliament of molecules voting on survival.” |
| Atom | “Coherence is expensive; the electron pays in probability.” |

Tone vector: `mystery 0.3 • science 0.5 • empathy 0.2`.

---

## 4. Interaction Demos

1. **Agent-survival mini-sim**  
   Slider ↑ energy tax → watch U(t) dive → agent collapses.
2. **ΔC heat-map** on benzene density (hover to toggle).
3. **Time-warp** –– hold *Space* → fast-forward sim, Aura pauses to recalibrate.

---

## 5. Calls-to-Action

| Location | CTA | Link |
|----------|-----|------|
| End Atom section | “Re-calibrate yourself” → Aura sign-up modal |
| Footer | GitHub ↓ | https://github.com/isrm/aura |
| HUD menu | “Download Engine” | `npm i @isrm/aura` |

---

## 6. Next Tickets

- [ ] Scaffold Next.js + r3f canvas w/ ScrollTrigger timeline.
- [ ] Import benzene `panel_coloured_comparison.png` into Atom scene.
- [ ] Implement `AuraEngine` store + mock HUD.
- [ ] Finalise copy in `/content/copy.json`.
- [ ] Mobile-breakpoint tuning (reduce shader load).

---

> Drop this blueprint into `/docs/ISRM_site_blueprint.md` and iterate with design, shader, and copy teams.
