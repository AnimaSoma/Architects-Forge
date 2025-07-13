import React, { useEffect, useRef, useState, useCallback } from "react";

import Lenis from "lenis";
import { motion } from "framer-motion";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

import ProjectFluctusSim from "./ProjectFluctusSim";
import NetworkVisualWithAnimation from "./NetworkVisualWithAnimation";
import InlineUSPVisualization from "./SimpleUSPVisualization";
import FractalBackground from "./FractalBackground";

// Custom hook for Lenis smooth scrolling
function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);
}

// Starfield component for hero background
const Starfield = () => {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const frameIdRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Initialize stars
  const initStars = useCallback(() => {
    const stars = [];
    const count = Math.min(window.innerWidth / 3, 200); // Limit stars on smaller screens
    
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.05 + 0.02,
      });
    }
    
    starsRef.current = stars;
  }, [dimensions]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const { clientWidth, clientHeight } = canvasRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Initialize stars after dimensions are set
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      initStars();
    }
  }, [dimensions, initStars]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      // Draw and update stars
      starsRef.current.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.7})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Move star
        star.y += star.speed * 2;
        
        // Reset if off-screen
        if (star.y > dimensions.height) {
          star.y = 0;
          star.x = Math.random() * dimensions.width;
        }
      });
      
      frameIdRef.current = requestAnimationFrame(animate);
    };
    
    if (dimensions.width > 0 && dimensions.height > 0) {
      frameIdRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [dimensions]);

  return (
    <canvas 
      ref={canvasRef} 
      width={dimensions.width} 
      height={dimensions.height}
      className="absolute inset-0 z-0"
    />
  );
};

export default function ISRMFoundationLanding() {
  useLenis(); // activate smooth-scroll

  return (
    <div className="bg-black text-white overflow-x-hidden font-sans">
      {/* ───────────────── Hero Section ───────────────── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Starfield background */}
        <Starfield />
        
        {/* Content */}
        <motion.div 
          className="relative z-10 text-center max-w-4xl mx-auto px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            className="text-5xl md:text-7xl font-extrabold tracking-wide"
          >
            ISRM-Foundation.Org
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="mt-6 text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto"
          >
            Exploring the Interactionist Self-Regulation Model: a coherence-driven framework that spans from atoms to AI
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="mt-12"
          >
            <a
              href="#explore"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 inline-flex items-center"
            >
              Explore the Framework
              <svg
                className="w-5 h-5 ml-2 animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                ></path>
              </svg>
            </a>
          </motion.div>
        </motion.div>
        
        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <div className="w-1 h-16 bg-gradient-to-b from-transparent to-white rounded-full mx-auto"></div>
        </motion.div>
      </section>

      {/* ───────────────── Introduction Section ───────────────── */}
      <section id="explore" className="py-24 md:py-32 px-6 md:px-16 bg-gradient-to-b from-black to-gray-900 relative">
        <div className="absolute inset-0 opacity-10">
          <FractalBackground />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">What is the Interactionist Self-Regulation Model?</h2>
          <p className="text-lg md:text-xl leading-relaxed mb-10">
            The Interactionist Self-Regulation Model (ISRM) is a framework for understanding how systems—from atoms to organisms to AI—maintain coherence under energetic constraint. It proposes that adaptation emerges when systems regulate internal prediction error while minimizing energy expenditure. This creates a universal principle that applies across scales and domains.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 text-center mt-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-sm p-6 rounded-xl"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-blue-500/20">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Coherence-Driven</h3>
              <p className="text-gray-400">
                Systems survive by maintaining internal coherence—the alignment between prediction and reality.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-sm p-6 rounded-xl"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-purple-500/20">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Energy-Constrained</h3>
              <p className="text-gray-400">
                All adaptation happens under finite energy budgets, forcing systems to prioritize.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-sm p-6 rounded-xl"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-green-500/20">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Scale-Invariant</h3>
              <p className="text-gray-400">
                The same principles apply from quantum systems to cells to brains to societies.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ───────────────── Divider SVG ───────────────── */}
      <svg className="w-full text-gray-900" viewBox="0 0 1440 120" fill="currentColor" preserveAspectRatio="none">
        <path d="M0,0 L1440,0 L1440,120 C1080,60 720,120 360,60 L0,120 L0,0 Z" />
      </svg>

      {/* ───────────────── Consciousness Section ───────────────── */}
      <section className="bg-white text-black py-32 px-6 md:px-16 relative overflow-hidden">
        <div className="absolute -right-20 top-20 opacity-10 pointer-events-none">
          <img src="/fractal2.png" alt="fractal" className="w-full" />
        </div>

        {/* ISRM Equation - Moved to a better position with higher z-index */}
        <div className="relative mb-12 flex justify-center">
          <div className="text-2xl md:text-4xl font-mono text-black/30 hover:text-black transition duration-300 cursor-help group">
            <InlineMath math="U(t) = C(t) - \sum (P_i(t) \cdot E_i(t))" />
            <div className="mt-2 hidden group-hover:block text-sm bg-white/90 text-black border border-gray-300 rounded p-3 shadow-xl z-50 absolute left-0 right-0">
              <p><strong>U(t)</strong>: Utility or coherence-sustaining capacity at time <em>t</em></p>
              <p><strong>C(t)</strong>: Coherence level—how well the internal model matches reality</p>
              <p><strong>P<sub>i</sub>(t)</strong>: Prediction error of subsystem <em>i</em></p>
              <p><strong>E<sub>i</sub>(t)</strong>: Energy cost of correcting or updating subsystem <em>i</em></p>
              <p className="mt-1 italic">When U(t) drops too low, the system destabilizes or fails to adapt.</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">How is Consciousness a Product of Constraint?</h2>
          <p className="text-lg md:text-xl leading-relaxed">
            Consciousness is not a luxury, it's an emergency system. It activates when constraint makes automatic behavior insufficient. In the ISRM framework, this process unfolds between two interacting systems: The Physical System 'PS' is the body, brain, or hardware - The part that senses, acts, and metabolizes. It executes behavior automatically when predictions are stable. The Observer System 'OS' is the internal modeler - The part that monitors reality, predicts outcomes, evaluates errors, and decides when to intervene. When the PS encounters rising unpredictability, stress, or energy imbalance, and its automatic responses no longer preserve coherence, the OS steps in. It becomes active only when required, to regulate the PS, restore stability, and minimize energetic waste. Consciousness emerges at the point where the OS must actively model the PS under constraint - making selective, energy-aware decisions in a world that punishes error.
          </p>
        </motion.div>
      </section>

      {/* ───────────────── Divider SVG ───────────────── */}
      <svg className="w-full text-white" viewBox="0 0 1440 120" fill="currentColor" preserveAspectRatio="none">
        <path d="M0,0 L1440,0 L1440,120 C1080,60 720,120 360,60 L0,120 L0,0 Z" />
      </svg>

      {/* ───────────────── Principles Section ───────────────── */}
      <section className="bg-black text-white py-32 px-6 md:px-16 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">Core Principles of ISRM</h2>
          <p className="text-lg md:text-xl leading-relaxed mb-16">
            The Interactionist Self-Regulation Model is built on three foundational principles that apply across all scales of adaptive systems.
          </p>
        </motion.div>
        
        <motion.div
          initial="hidden"
          whileInView="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto"
        >
          {[
            { title: "Constraint forces choices", body: "Without limits — of energy, time, attention, or survival — there would be no need to choose or regulate anything. If a system could do everything at once with no cost, it wouldn't need consciousness. Consciousness exists because the system must decide what to do next and what to ignore." },
            { title: "Prediction error under constraint demands modeling", body: "When the world becomes unpredictable and resources are limited, the system must: Prioritize attention, Reduce uncertainty, Choose efficient actions. This requires an Observer System (OS) to model the world and itself, and consciousness emerges when that modeling becomes active under pressure." },
            { title: "Updates cost energy, so it only happens when needed", body: "The brain (or any adaptive system) cannot constantly update everything. It's energentically expensive. The system stays unconscious until the cost of staying the same becomes higher than the cost of updating. This trade-off defines consciousness: It is the act of re-aligning the system under constraint to preserve coherence." },
          ].map((item) => (
            <motion.div
              key={item.title}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
              className="p-8 border border-gray-200 rounded-lg shadow-lg backdrop-blur-sm bg-white/60"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-700 leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="bg-white text-black py-8 px-6 md:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-2xl md:text-4xl font-mono text-black/30 hover:text-black transition duration-300 cursor-help group">
            <InlineMath math="U(t) = \sum (PE_i \cdot S_i) - E_c" />
            <div className="mt-2 hidden group-hover:block text-sm bg-white/90 text-black border border-gray-300 rounded p-3 shadow-xl z-50">
              <p><strong>U(t)</strong>: Urgency of conscious update at time <em>t</em></p>
              <p><strong>PE<sub>i</sub></strong>: Prediction error for input <em>i</em></p>
              <p><strong>S<sub>i</sub></strong>: Salience of input <em>i</em></p>
              <p><strong>E<sub>c</sub></strong>: Energy cost of conscious processing</p>
              <p className="mt-1 italic">When U(t) exceeds threshold, consciousness activates.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-black py-32 px-6 md:px-16 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-4xl"
        >
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">What About All Adaptive Systems?</h2>
          <p className="text-lg md:text-xl leading-relaxed">
            The Interactionist Self-Regulation Model (ISRM) is a universal framework for understanding how systems—biological, artificial, or physical—maintain coherence over time under energetic constraint. At its core, ISRM tracks the balance between internal prediction errors and the energy required to resolve them. Whether it's a conscious mind navigating uncertainty, a cell repairing damage, or an AI adapting to input, all adaptive behavior can be framed through ISRM's fundamental utility equation. Consciousness is just one specialized expression of this deeper principle.
          </p>
        </motion.div>
        
        {/* ISRM Equation - Positioned separately from the main content */}
        <div className="mt-12 flex justify-center">
          <div className="text-2xl md:text-4xl font-mono text-black/30 hover:text-black transition duration-300 cursor-help group">
            <InlineMath math="U(t) = C(t) - \sum (P_i(t) \cdot E_i(t))" />
            <div className="mt-2 hidden group-hover:block text-sm bg-white/90 text-black border border-gray-300 rounded p-3 shadow-xl z-50 absolute">
              <p><strong>U(t)</strong>: Utility or coherence-sustaining capacity at time <em>t</em></p>
              <p><strong>C(t)</strong>: Coherence level—how well the internal model matches reality</p>
              <p><strong>P<sub>i</sub>(t)</strong>: Prediction error of subsystem <em>i</em></p>
              <p><strong>E<sub>i</sub>(t)</strong>: Energy cost of correcting or updating subsystem <em>i</em></p>
              <p className="mt-1 italic">When U(t) drops too low, the system destabilizes or fails to adapt.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white text-black py-24 px-6 md:px-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto"
        >
          {[
            { title: "Neuroscience & Consciousness Research", body: "ISRM offers a unifying explanation for perception, attention, and awareness by modeling consciousness as the selective regulation of coherence under energetic constraint. Unlike other models that treat consciousness as a binary state or emergent mystery, ISRM frames it as a dynamic utility optimization problem—where prediction error, salience, and limited energy determine what enters awareness and how the system adapts. This enables new insights into trauma, anesthesia, psychedelics, and attentional disorders." },
            { title: "Synthetic Biology & Cellular Engineering", body: "In cellular systems, ISRM provides a powerful lens for understanding how living organisms maintain homeostasis and decision-making across noisy biochemical environments. By treating organelles, signaling networks, and even single cells as embedded Observer Systems regulating coherence, ISRM opens the door to programming synthetic cells that can adaptively respond to injury, mutation, or environmental fluctuation with intelligent energy budgeting—an essential step for regenerative medicine and programmable biology." },
            { title: "Quantum & Atomic Matter", body: "ISRM introduces a new perspective on quantum systems by treating wavefunction collapse as an energetically constrained coherence event. Rather than viewing particles as probabilistic abstractions, ISRM models each quantum system as a self-regulating unit that maintains coherence until prediction error—driven by entanglement, observation, or decoherence—exceeds an energy threshold. At the atomic scale, this explains stable bonding, molecular geometry, and orbital transitions as outcomes of adaptive coherence regulation, not just statistical behavior." },
            { title: "Cosmology & the Expanding Universe", body: "At the largest scales, ISRM provides an alternative lens for understanding entropy, inflation, and cosmic expansion. The universe itself can be modeled as a nested Observer System whose structure evolves to minimize prediction error under finite energetic constraints. Phenomena like dark energy, gravitational clustering, and black hole entropy can be reframed as coherence collapse or redistribution across the fabric of spacetime. ISRM offers a framework where the cosmos isn't passively decaying—but actively managing its structure to delay systemic breakdown." },
            { title: "The Nature of Time", body: "In ISRM, time is not a fundamental dimension but an emergent consequence of internal state updating. When prediction error forces a coherent system to change—costing energy—time is perceived. Thus, time is the signature of adaptation, the residue of coherence lost and rebuilt. This view unifies biological time (subjective experience), thermodynamic time (entropy increase), and relativistic time (observer-dependent flow) into a single principle: time is the cost of not knowing." },
            { title: "Artificial Intelligence & Autonomous Agents", body: "ISRM redefines AI decision-making by replacing rigid rule-based logic with a coherence-based survival framework. Instead of maximizing reward minimizing error alone, agents maintain operational utility U(t) by weighing the energetic cost of perception and action against the importance of prediction error. This creates agents that behave less like machines and more like resilient organisms—capable of conserving resources, ignoring irrelevant distractions, and surviving novel environments without explicit programming." },
          ].map((item) => (
            <motion.div
              key={item.title}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
              className="p-8 border border-gray-200 rounded-lg shadow-lg backdrop-blur-sm bg-white/60"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-700 leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ───────────────── Update Signal Potential Section ───────────────── */}
      <section className="bg-gradient-to-r from-blue-900 to-purple-900 text-white py-32 px-6 md:px-16 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">Experience the Update Signal Potential</h2>
          <div className="mb-8 text-xl md:text-2xl font-mono bg-black/30 p-4 rounded-lg inline-block">
            <InlineMath math="U(t) = (αM(t) + βσ^2(t)) \cdot (E_{max} - γ\int_0^t U(τ)dτ + I(t)) \cdot δ|S_{PS}(t) - S_{OS}(t)|" />
          </div>
          <p className="text-lg md:text-xl leading-relaxed mb-10">
            The Update Signal Potential equation is the mathematical heart of the ISRM framework. It determines when a system should update its internal model based on prediction errors, available energy, and the salience of incoming information. Rather than just reading about it, you can now interact with this equation and see how changes to parameters affect the system's behavior in real-time.
          </p>
          
          {/* Inline interactive USP simulation */}
          <div className="mt-10">
            <InlineUSPVisualization />
          </div>

          <p className="mt-8 text-sm text-gray-300">
            Adjust parameters like salience weights, energy constraints, and prediction-error sensitivity to observe their impact on update behaviour in real-time.
          </p>
        </motion.div>
      </section>

      <footer className="py-10 bg-black text-gray-500 text-center text-sm">
        © {new Date().getFullYear()} ISRM-Foundation.Org - Schell, J.P. Interactionist Self-Regulation Model (ISRM): A Unifying Principle of Adaptive Systems. 2025. https://isrm-framework.org
      </footer>
      
      {/* ───────────────── ProjectFluctusSim Section ───────────────── */}
      <section
        /* Ensure the simulation has room, dark backdrop and is not hidden */
        className="relative min-h-[800px] flex items-center justify-center z-20 bg-white border-b border-gray-700"
      >
        {/* Title / small description */}
        <div className="absolute top-10 w-full text-center pointer-events-none">
          <h2 className="text-3xl font-bold text-white">Project Fluctus Simulation</h2>
          <p className="text-gray-400 text-sm mt-2">
            Interactive coherence-driven particle field (move mouse / click)
          </p>
        </div>

        {/* Let the component expand to fill the wrapper */}
        {/* fill entire section; width / height via tailwind for validity */}
        <ProjectFluctusSim className="w-full h-full" />
      </section>
      
      <footer className="py-10 bg-black text-white-500 text-center text-lg">
        <p>Explore the ISRM Framework through interactive visualizations</p>
      </footer>

      {/* ───────────────── Network Visual Section ───────────────── */}
      <section className="py-24 px-6 md:px-16 bg-black">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Network Consensus Visualization</h2>
          <p className="text-lg text-gray-300 text-center mb-12">
            This visualization demonstrates how multiple Observer Systems work together to reach consensus about the state of a Physical System.
          </p>
          
          <NetworkVisualWithAnimation />
        </motion.div>
      </section>

      {/* ───────────────── Divider SVG ───────────────── */}
      <svg className="w-full text-black" viewBox="0 0 1440 120" fill="currentColor" preserveAspectRatio="none">
        <path fill="currentColor" d="M0,0 C480,120 960,0 1440,120 L1440,0 L0,0 Z" />
      </svg>
      
      {/* ───────────────── Vision Section ───────────────── */}
      <section className="relative h-[120vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="absolute inset-0">
          <img src="/nebula.jpg" alt="nebula" className="w-full h-full object-cover opacity-30" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-3xl text-center px-6"
        >
          <h2 className="text-4xl md:text-4xl font-bold mb-6">ISRM reveals the path to a better understanding of ALL adaptive systems</h2>
          <p className="text-xl md:text-2xl text-gray-300">
            Join Us In This New Frontier Of Exploration & Discovery!
          </p>
        </motion.div>
      </section>

      {/* ───────────────── Tech Cards ───────────────── */}
      <section className="bg-white text-black py-24 px-6 md:px-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto"
        >
          {[
            { title: "ISRM Introduces an explanatory mechanism for emergent order", body: "Traditional thermodynamics and statistical mechanics say 'Order emerges probabilistically due to energy minimization and entropy' ISRM says: 'Order emerges from distributed agents that maintain internal predictive coherence under energetic constraint." },
            { title: "ISRM Bridges micro and macro with a unifying logic", body: "Physics often lacks continuity of explanation across scales. Quantum mechanics explains atoms, thermodynamics explains bulk behavior, Neuroscience explains brains. ISRM applies the same principle (U(t)) minimization) from molecules to brains to the cosmos. This is unique." },
            { title: "ISRM Reinterprets cognition as physical regulation", body: "Rather than cognition being something emergent only in brains, ISRM treats it as a gradient property of any system that predicts and acts to sustain coherence. This offers a naturalized path towards understanding AI, Biological Consciousness, and Adaptive matter." },
            { title: "Does ISRM overstate its usefulness?", body: "Only if misunderstood. ISRM does NOT replace quantum chemistry, relativity, or thermodynamics. It doesn't derive fundamental constants (yet). It doesn't make deterministic predictions for chaotic systems." },
            { title: "Where ISRM is appropriately useful", body: "ISRM adds a new layer of interpretive power. It guides new simulations and experiments. It allows us to model intelligence and regulation using energetic terms. It can integrate AI, physics, and biology under a single predictive framework." },
            { title: "ISRM in a Nutshell", body: "It's not a 'Theory of Everything.' It's a Framework of Coherent Regulation Across Scales. It doesn't negate other theories, it explains why and when they work, from a constraint-based, observer-centric view." },
          ].map((item) => (
            <motion.div
              key={item.title}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
              className="p-8 border border-gray-200 rounded-lg shadow-lg backdrop-blur-sm bg-white/60"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-700 leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ───────────────── Call-to-Action ───────────────── */}
      <section className="relative py-32 bg-gradient-to-tr from-indigo-700 via-purple-700 to-pink-700 text-center">
        <motion.h2
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-4xl md:text-3xl font-bold mb-6"
        >
          Learn the framework of the Interactionist Self-Regulation Model, at ISRM-Framework.Org
        </motion.h2>
        <motion.a
          href="https://isrm-framework.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md transition"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ISRM-Framework.Org
        </motion.a>
      </section>

      {/* ──────────────── End of content sections ──────────────── */}
    </div>
  );
}
