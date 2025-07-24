import React, { useEffect, useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// Small hover helper for math terms
const HoverMathTerm = ({ term, definition }: { term: string; definition: string }) => (
  <span className="group relative cursor-help text-blue-400 border-b border-dotted border-blue-400">
    {term}
    <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute bottom-full left-1/2 -translate-x-1/2 w-56 bg-gray-800 text-xs text-white p-2 rounded z-10">
      {definition}
    </span>
  </span>
);

// Responsive equation block
const ResponsiveEquation = () => {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 sm:p-6 max-w-4xl mx-auto">
      {mobile ? (
        /* stacked, compact representation for very small screens */
        <BlockMath math={"U(t)= (S)\\\\(E)\\\\(PE)"} />
      ) : (
        <BlockMath math={"U(t)=\\Bigl(\\alpha\\,M(t)+\\beta\\,\\sigma^{2}(t)\\Bigr)\\;\\times\\;\\Bigl(E_{\\max}-\\gamma\\int_{0}^{t} U(\\tau)\\,d\\tau + I(t)\\Bigr)\\;\\times\\;\\delta\\,\\lVert S_{PS}(t)-S_{OS}(t)\\rVert"} />
      )}
    </div>
  );
};

export default function ISRMFormulation() {
  return (
    <section className="py-16 bg-gray-950 text-white border-t border-white/10">
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-blue-300">The ISRM Update Equation</h2>
        <p className="max-w-3xl mx-auto text-center text-white/70 mb-6">
          The <InlineMath math="U(t)" /> signal quantifies a system&rsquo;s <em>pressure to update</em>. It rises only when three
          conditions align: the error is significant (<HoverMathTerm term="Prediction&nbsp;Error" definition="Mismatch between Physical System & Observer System" />),
          the stimulus is worth noticing (<HoverMathTerm term="Salience" definition="Combination of Magnitude & Novelty of the input" />), and the system can pay the metabolic bill (<HoverMathTerm term="Energy&nbsp;Budget" definition="Available resources minus previous update costs" />).
        </p>
        <ResponsiveEquation />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 max-w-4xl mx-auto text-sm">
          <div className="bg-gray-800/60 p-5 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-purple-300">Salience</h3>
            <BlockMath math={"S(t)=\\alpha\\,M(t)+\\beta\\,\\sigma^{2}(t)"} />
            <p className="mt-2 text-white/80">Weights raw signal magnitude (<InlineMath math="M" />) and novelty (<InlineMath math="\\sigma^2" />).</p>
          </div>
          <div className="bg-gray-800/60 p-5 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-blue-300">Energy Budget</h3>
            <BlockMath math={"E(t)=E_{\\max}-\\gamma\\int_{0}^{t} U(\\tau)\\,d\\tau + I(t)"} />
            <p className="mt-2 text-white/80">Current reserves minus prior expenditure, plus any influx.</p>
          </div>
          <div className="bg-gray-800/60 p-5 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-red-300">Prediction Error</h3>
            <BlockMath math={"PE(t)=\\delta\\,\\lVert S_{PS}-S_{OS}\\rVert"} />
            <p className="mt-2 text-white/80">Scaled mismatch between expectation and reality.</p>
          </div>
        </div>
        <div className="mt-10 bg-gray-800/50 p-5 rounded-lg max-w-4xl mx-auto text-white/80 text-sm">
          <p className="mb-2"><strong className="text-green-300">Recursive Loop&nbsp;Unit:</strong> At every tick the system recomputes <InlineMath math="U(t)" />. If it rises above the private threshold&nbsp;<InlineMath math="U_{th}" />, the&nbsp;observer<br/>
            (OS) recalibrates its state to <em>approximate</em> the current Physical System (PS):</p>
          <BlockMath
            math={
              String.raw`\text{At each timestep } t:
\begin{cases}
  \text{Compute } U(t) \\
  U(t) \le U_{th}\; \Rightarrow\; S_{OS}(t+1)=f\bigl(S_{OS}(t),A(t)\bigr) \\
  U(t) > U_{th}\; \Rightarrow\; S_{OS}(t+1) \approx S_{PS}(t)
\end{cases}`
            }
          />
          <p className="mt-2">
            In plain language: <em>each tick the observer computes utility</em>{' '}
            <InlineMath math="U(t)" />. If it stays below the private threshold{' '}
            <InlineMath math="U_{th}" />, the model updates <InlineMath math="f(S_{OS},A)" />{' '}
            in the usual predictive manner. When <InlineMath math="U(t)" /> shoots above the
            threshold, the observer overrides its model and realigns to approximate the current
            physical state—OS and PS come closer but remain fundamentally distinct.
          </p>
        </div>
      </div>
    </section>
  );
}
