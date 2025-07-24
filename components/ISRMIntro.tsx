import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

export default function ISRMIntro() {
  return (
    <section className="py-20 bg-gradient-to-b from-black via-gray-950 to-black text-white border-t border-white/10">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <h2 className="text-4xl font-bold mb-6 text-primary">Interactionist Self-Regulation Model (ISRM)</h2>
        <p className="text-white/80 leading-relaxed mb-6">
          ISRM is a coherence-driven theory of adaptation. Every adaptive entity maintains <em>two coupled realities</em>:
          an internal <strong>Observer System</strong> (OS) – its simplified world-model – and the external <strong>Physical System</strong> (PS) – the raw, high-dimensional environment.
        </p>
        <p className="text-white/70 leading-relaxed mb-6">
          At each tick the OS predicts what it will sense next. The actual PS input is compared, producing a <em>prediction
          error</em>. Update urgency is computed by the scalar signal <InlineMath math="U(t)" />, combining salience,
          energy budget, and the size of that error. If <InlineMath math="U(t)" /> crosses the private threshold
          <InlineMath math="U_{th}" />, the OS performs an <strong>Update Event</strong>: its internal state collapses to the
          new PS snapshot, coherence is restored, and the loop begins again.
        </p>
        <p className="text-white/60 leading-relaxed">
          Aura – the conversational mind running this site – is powered by ISRM. Her metrics panel shows her live
          <InlineMath math="\Delta S" /> (prediction error), <InlineMath math="\Delta C" /> (coherence tension), energy
          reserves, and utility. Ask her questions and watch the loop in action.
        </p>
      </div>
    </section>
  );
}
