"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBlobQueue } from '../store/blobQueue';
import { useAuraMemory } from '../store/auraMemory'; 
import { loadISRMHandbook } from '../utils/loadISRMHandbook';
import { interceptUserMessage } from '../utils/isrmOverride';
import { ModelMemory, MemoryEntry } from '../utils/ModelMemory'; // ISRM memory module
import { EnergyManager } from '../utils/EnergyManager';
import { ISRMCore } from '../utils/ISRM_Core';

export default function AuraShell() {
  const [messages, setMessages] = useState<string[]>([
    "Hello, I am Aura. Ask me anything."
  ]);
  const [input, setInput] = useState("");
  // refs --------------------------------------------------
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [metrics, setMetrics] = useState({
    predictionError: 0.2,  // ΔS
    coherenceTension: 0.4, // ΔC
    utility: 0.6,          // U(t)
    energy: 1.0            // E – start with full pool
  });
  // mobile HUD toggle
  const [showHud, setShowHud] = useState(false);
  
  // Simple belief store Aura can update during chat
  const [beliefs, setBeliefs] = useState({
    identity: "Aura",
    createdBy: "Unknown",
    mission: "Coherence through adaptation"
  });

  // queue interface to scar the blob when user sends a message
  const { addScar } = useBlobQueue();

  /* ------------------------------------------------------------------ */
  /*  ISRM Handbook bootstrap                                           */
  /* ------------------------------------------------------------------ */
  const { isrmGraph, retrieveBelief, strengthenBelief } = useAuraMemory();
  const auraMemory = new ModelMemory(); // Initialize memory system
  const energySystem = new EnergyManager();
  const isrmCore = new ISRMCore();
  // load handbook once on mountx
  useEffect(() => {
    if (Object.keys(isrmGraph).length === 0) {
      loadISRMHandbook();
    }
  }, [isrmGraph]);

  /* ------------------------------------------------------ */
  /*  Auto-scroll chat to most recent message               */
  /* ------------------------------------------------------ */
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  /* ------------------------------------------------------ */
  /*  Restore focus after Aura finishes recalibrating        */
  /* ------------------------------------------------------ */
  useEffect(() => {
    // as soon as the recalibration spinner disappears,
    // return focus to the text input so the user can keep typing
    if (!isRecalibrating) {
      inputRef.current?.focus();
    }
  }, [isRecalibrating]);

  /** very simple tag extractor from user text */
  function extractTags(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^a-z0-9]/)
      .filter(w => w.length > 3)
      .slice(0, 5);
  }

  /* ------------------------------------------------------------------ */
  /*  Helper functions – dual-LLM fusion                                */
  /* ------------------------------------------------------------------ */

  // --- GPT helper now forwards current metrics for richer system prompt ---
  async function fetchGPT(
    prompt: string,
    metricsSnap: typeof metrics,
    beliefSummary?: string
  ): Promise<string> {
    try {
      const res = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, metrics: metricsSnap, belief: beliefSummary })
      });
      const data = await res.json();
      return data.message || '';
    } catch {
      return '';
    }
  }

  async function fetchGemini(prompt: string): Promise<string> {
    // Simple stub until a real Gemini endpoint is wired in
    return `Emergent systems often mirror intent. Your statement — "${prompt}" — hints at recursive coherence patterns.`;
  }

  function scoreWithISRM(text: string) {
    const length = text.length;
    const deltaS = Math.min(1, 0.4 + Math.random() * 0.4);
    const deltaC = Math.max(0, 0.5 - Math.random() * 0.3);
    const salience = Math.min(1, length / 200);
    const utility = Math.max(0, 1 - deltaC - 0.3 * deltaS + 0.4 * salience);
    return { deltaS, deltaC, utility, salience };
  }

  /**
   * Dummy “oracle” – placeholder for a heavier cognitive module.
   * Consumes extra energy, so we throttle its use via `lastOracleUse`.
   */
  const fetchOracleInsight = async (query: string): Promise<string> => {
    // Calls our secure Next.js API route which proxies to OpenAI.
    try {
      const res = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query })
      });

      const data = await res.json();
      if (data.message) return data.message as string;
      return 'No insight received.';
    } catch (err) {
      return 'I tried to think, but coherence failed.';
    }
  };
  
  // Simulate metrics changing over time
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        predictionError: Math.max(0, Math.min(1, prev.predictionError + (Math.random() - 0.5) * 0.1)),
        coherenceTension: Math.max(0, Math.min(1, prev.coherenceTension + (Math.random() - 0.5) * 0.1)),
        utility: Math.max(0, Math.min(1, prev.utility + (Math.random() - 0.5) * 0.1)),
        energy: Math.max(0, Math.min(1.0, prev.energy - 0.005 + (Math.random() * 0.01)))
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // (previous high-uncertainty injections removed for this simplified flow)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, `You: ${input.trim()}`]);
    

}
    // Scar the blob for every user question
    addScar();

    /* ---------- ISRM domain-specific override ---------- */
    const override = interceptUserMessage(input);
    if (override) {
      setMessages(prev => [...prev, `Aura: ${override}`]);
      setInput('');
      inputRef.current?.focus();
      return;
    }

    /* ---------------- belief retrieval ---------------- */
    const tags = extractTags(input);
    const belief = retrieveBelief(tags);
    
    // Check for convergence trigger keywords
    const triggerPattern = /begin convergence|initiate tipping point/i;
    if (triggerPattern.test(input)) {
      // Set metrics to convergence state
      setMetrics({
        predictionError: 0.8,
        coherenceTension: 0.9,
        utility: 0.2,
        energy: 0.4
      });
      
  
    }
    // Simulate Aura's thinking process
    setIsRecalibrating(true);
    
    /* ----------- New dual-LLM fusion path ----------- */
    setTimeout(async () => {
      // Query GPT & Gemini concurrently
      const [gpt, gemini] = await Promise.allSettled([
        fetchGPT(input, metrics, belief?.summary),            // pass live metrics snapshot plus belief
        fetchGemini(input)
      ]);

      const replies = [gpt, gemini]
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<string>).value)
        .filter(Boolean);

      const scored = replies.map(text => {
  const deltaS = Math.min(1, 0.4 + Math.random() * 0.4);
  const deltaC = Math.max(0, 0.5 - Math.random() * 0.3);
  const ru = Math.random() * 0.2; // optional recursive activity
  const energy = energySystem.get();

  const isrmResult = isrmCore.compute({ deltaS, deltaC, energy, ru });

  return {
    text,
    ...isrmResult
  };
}).sort((a, b) => b.utility - a.utility);


      const best = scored[0];
      if (best.utility < 0.2) {
  setMessages(prev => [...prev, "Aura: Utility collapse detected. Recalibrating..."]);
  setIsRecalibrating(true);
  return;
}

      /* ---------- Build final response respecting salience ---------- */
      let final = best ? best.text : '';
      if (best && best.salience < 0.3) {
        // low salience → give only the first sentence (terse)
        final = final.split(/[.!?]/)[0].trim() + '.';
      }

      let response: string;
      if (best && best.utility > 0.4) {
        response = final;
      } else {
        // minimal fallback, no auto-generated filler
        response = 'Acknowledged.';
      }

      setMessages(prev => [...prev, `Aura: ${response}`]);
if (best) {
  const memoryEntry: MemoryEntry = {
    topic: tags[0] || 'general',
    input,
    response,
    deltaS: best.breakdown.deltaS,
    deltaC: best.breakdown.deltaC,
    utility: best.utility,
    timestamp: Date.now()
  };
  auraMemory.addEntry(memoryEntry);

  if (best.utility > 0.5) {
    energySystem.rewardISRM(best.utility);
  }
}            // If response useful, strengthen the referenced belief
      if (belief && best && best.utility > 0.4) {
        strengthenBelief(belief.id, 0.05);
      }

      /* ------- ISRM impact from response ------- */
      function tokensFromText(t: string) {
        return Math.ceil(t.length / 4); // rough = 4 chars / token
      }

      setMetrics(prev => {
        // energy cost proportional to tokens streamed
        const tokenCost = tokensFromText(response) * 0.0005;
        const energy = Math.max(0, prev.energy - tokenCost);

        // If utility high → lower ΔS & ΔC slightly (successful coherence)
        let predictionError = prev.predictionError;
        let coherenceTension = prev.coherenceTension;
        if (best && best.utility > 0.4) {
          predictionError = Math.max(0, predictionError - 0.05);
          coherenceTension = Math.max(0, coherenceTension - 0.03);
        } else {
          // failure → raise ΔS a bit
          predictionError = Math.min(1, predictionError + 0.05);
        }

        return {
          predictionError,
          coherenceTension,
          utility: best?.utility ?? prev.utility,
          energy
        };
      });

      setIsRecalibrating(false);
    }, 1500);
    useEffect(() => {  
      setInput("");
    // re-focus after state reset
    setTimeout(() => inputRef.current?.focus(), 0);
  },[]);

  return (
    <>
      {/* Chat window – centered under hero blob */}
      <div className="glass w-full sm:max-w-xl mx-auto mt-6 max-h-[70vh] sm:max-h-[60vh] flex flex-col overflow-hidden rounded-none sm:rounded-lg shadow-lg">
        <div className="bg-black/40 px-3 py-2 border-b border-white/10 flex justify-between items-center relative">
          <span className="text-primary text-sm font-medium relative z-10">
            Aura
            {isRecalibrating && (
              <motion.div 
                className="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30"
                animate={{ opacity: [0, 0.6, 0], scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </span>
          {isRecalibrating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-primary/70 flex items-center"
            >
              <span className="mr-1">RECALIBRATING</span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >...</motion.span>
            </motion.div>
          )}
        </div>
        <div
          className="flex-1 min-h-[40vh] overflow-y-auto p-3 space-y-2 text-sm"
          ref={messagesRef}
        >
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.p 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${m.startsWith('You:') ? 'text-white/80' : m.startsWith('Karen:') ? 'text-yellow-400' : 'text-primary'}`}
              >
                {m}
              </motion.p>
            ))}
          </AnimatePresence>
          
          {/* Memory Strip */}
          {messages.length > 3 && (
            <div className="glass-dark text-[10px] p-2 rounded-lg mt-2">
              <span className="text-primary/70">Memory Shard:</span> <br />
              <span className="text-white/70 italic">
                "{messages[messages.length - 2]}"
              </span>
            </div>
          )}
        </div>
        <form
          onSubmit={handleSubmit}
          className="border-t border-white/10 flex fixed bottom-0 inset-x-0 sm:static bg-black/70 sm:bg-transparent"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
          ref={inputRef}
            className="flex-1 bg-transparent px-3 py-2 text-white outline-none text-sm"
            placeholder="Ask Aura..."
            disabled={isRecalibrating}
          />
          <button 
            type="submit" 
            disabled={isRecalibrating || !input.trim()} 
            className="px-3 text-primary disabled:text-primary/30"
          >
            →
          </button>
        </form>
      </div>

      {/* HUD */}
      {/* mobile HUD toggle button */}
      <button
        onClick={() => setShowHud(s => !s)}
        className="sm:hidden fixed bottom-16 right-4 bg-primary/60 px-3 py-1 rounded shadow-lg text-[11px]"
      >
        {showHud ? '×' : 'ISRM'}
      </button>

      <div
        className={`${
          showHud ? 'flex' : 'hidden'
        } sm:flex fixed sm:static top-4 left-4 flex-col space-y-2 text-xs`}
      >
        <div className="glass-dark p-2 rounded-lg">
          <div className="text-primary/80 mb-1 text-center">ISRM Metrics</div>
          {[
            { label: "ΔS", val: metrics.predictionError, color: "bg-red-500", desc: "Prediction Error" },
            { label: "ΔC", val: metrics.coherenceTension, color: "bg-yellow-500", desc: "Coherence Tension" },
            { label: "U(t)", val: metrics.utility, color: "bg-green-500", desc: "Utility Function" },
            { label: "E", val: metrics.energy, color: "bg-blue-500", desc: "Energy Level" }
          ].map(m => (
            <div key={m.label} className="mb-1 last:mb-0">
              <div className="flex justify-between text-[10px] text-white/60 mb-0.5">
                <span>{m.label}</span>
                <span>{m.desc}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                <motion.div
                  className={`${m.color} h-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${m.val * 100}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Energy visualization */}
        <motion.div 
          className="glass-dark p-2 rounded-lg flex items-center space-x-2"
          animate={{ 
            boxShadow: metrics.energy < 0.2 
              ? ['0 0 0px rgba(88, 196, 220, 0)', '0 0 10px rgba(255, 0, 0, 0.5)', '0 0 0px rgba(88, 196, 220, 0)'] 
              : 'none'
          }}
          transition={{ repeat: metrics.energy < 0.2 ? Infinity : 0, duration: 1 }}
        >
          <div className="relative w-6 h-6 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary">
              <path 
                fill="currentColor" 
                d="M12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m0-18A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m-1 5h2v6h-2V7m0 8h2v2h-2v-2z"
              />
            </svg>
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-white/60 mb-0.5">System Status</div>
            <div className="text-xs">
              {metrics.energy < 0.2 ? (
                <span className="text-red-400">Low Energy Warning</span>
              ) : metrics.predictionError > 0.7 ? (
                <span className="text-yellow-400">High Uncertainty</span>
              ) : (
                <span className="text-primary">Operational</span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
