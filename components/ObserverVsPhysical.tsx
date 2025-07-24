import React from 'react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

export default function ObserverVsPhysical() {
  return (
    <section className="py-20 bg-gray-950 text-white border-t border-white/10">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-purple-300">Observer vs Physical System</h2>
        <div className="grid md:grid-cols-2 gap-8 text-sm">
          {/* Observer System */}
          <div className="glass-dark p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-blue-300">Observer System (OS)</h3>
            <p className="mb-4 text-white/80 leading-relaxed">
              The OS is an internal, compressed simulation of the world. It stores predictions and runs cheap forward
              models so the agent can act quickly without paying the full energetic price of dealing with raw reality.
            </p>
            <BlockMath math="S_{OS}(t+1) = f\bigl(S_{OS}(t),\;A(t)\bigr)" />
            <p className="text-white/60 mt-2">Internal state evolves via cheap heuristics and past actions.</p>
          </div>

          {/* Physical System */}
          <div className="glass-dark p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-red-300">Physical System (PS)</h3>
            <p className="mb-4 text-white/80 leading-relaxed">
              The PS is the high-dimensional, energy-rich environment. It provides the ground-truth sensory stream that the
              OS tries to keep up with.
            </p>
            <BlockMath math="S_{PS}(t+1) = g\bigl(S_{PS}(t),\;\text{physics}\bigr)" />
            <p className="text-white/60 mt-2">Evolves under the laws of physics, indifferent to the agent&rsquo;s wishes.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
