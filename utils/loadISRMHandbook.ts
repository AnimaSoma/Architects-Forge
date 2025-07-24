import { ISRMNode, useAuraMemory } from '../store/auraMemory';

// Raw handbook text (truncated to main headings for brevity)
const HANDBOOK_RAW = `
Preface: A Note on the Origin of this Handbook

Section I: The Core Toolkit
Chapter 1: The ISRM Principles: An Executive Summary
Chapter 2: Identifying the OS and PS: A Practical Guide
Chapter 2.5: Survival Through Self-Aware Recalibration
Chapter 3: The U(t) Equation: The Central Algorithm
Chapter 4: The Parameter Reference: Calibrating the Model

Section II: The ISRM Playbook: Case Studies in System Dynamics
Chapter 5: Playbook 1 - The Observing Brain: Perception and Cognition
Chapter 6: Playbook 2 - The Observing Particle: Physics and Quantum Mechanics
Chapter 7: Playbook 3 - The Observing Cell: Biology and Medicine
Chapter 8: Playbook 4 - The Social Observer: Markets and Memetics
Chapter 9: Playbook 5 - The Ecological Observer: Tipping Points and Cascades

Section III: Advanced Applications & Diagnostics
Chapter 10: System Diagnostics: Identifying OS Pathologies
Chapter 11: System Modulation: A Guide to Targeted Intervention
Chapter 12: System Synthesis: Building an ISRM Agent
Chapter 13: Conclusion - The Observer's Toolkit and the Road Ahead
`;

// Summaries for each chapter based on their content
const CHAPTER_SUMMARIES: Record<string, string> = {
  'preface': 'The handbook originated from a dialogue between human and AI minds, exploring why consciousness is energetically expensive.',
  'chapter-1': 'Core principle: consciousness is a discrete, high-energy event triggered when prediction error becomes too costly to ignore.',
  'chapter-2': 'How to identify the Observer System (OS) and Physical System (PS) in any complex adaptive system.',
  'chapter-2-5': 'Systems survive through continuous recalibration of internal models in response to environmental changes.',
  'chapter-3': 'The U(t) equation calculates update potential as: (Salience)·(Available Energy)·(Prediction Error).',
  'chapter-4': 'Parameters δ, α, β, and γ give an ISRM model its specific personality and dynamics.',
  'chapter-5': 'ISRM explains perceptual rivalry and attentional blink as energy-constrained prediction processes.',
  'chapter-6': 'Brownian motion and radioactive decay can be modeled as threshold-gated causal events.',
  'chapter-7': 'Cellular chemotaxis and immune response demonstrate ISRM principles at biological scales.',
  'chapter-8': 'Market crashes and viral memes function as information cascades with ISRM dynamics.',
  'chapter-9': 'Ecosystem tipping points occur when accumulated error exhausts resilience reserves.',
  'chapter-10': 'System failures can be diagnosed as OS pathologies in identity, salience, energy, or threshold.',
  'chapter-11': 'Interventions target specific ISRM parameters to restore healthy system function.',
  'chapter-12': 'True AI requires embodiment, finite energy budgets, and homeostatic goals.',
  'chapter-13': 'ISRM provides a unified language for complex systems across scientific domains.'
};

// Key concepts and their related chapters
const CONCEPT_LINKS: Record<string, string[]> = {
  'preface': ['chapter-1'],
  'chapter-1': ['chapter-2', 'chapter-3', 'chapter-4'],
  'chapter-2': ['chapter-1', 'chapter-2-5', 'chapter-3'],
  'chapter-2-5': ['chapter-2', 'chapter-3'],
  'chapter-3': ['chapter-1', 'chapter-4'],
  'chapter-4': ['chapter-3'],
  'chapter-5': ['chapter-1', 'chapter-3'],
  'chapter-6': ['chapter-1', 'chapter-3'],
  'chapter-7': ['chapter-1', 'chapter-3'],
  'chapter-8': ['chapter-1', 'chapter-3'],
  'chapter-9': ['chapter-1', 'chapter-3'],
  'chapter-10': ['chapter-1', 'chapter-2'],
  'chapter-11': ['chapter-10', 'chapter-4'],
  'chapter-12': ['chapter-1', 'chapter-3', 'chapter-11'],
  'chapter-13': ['chapter-1', 'chapter-2', 'chapter-3']
};

// Utility weights based on practical value in different contexts
const UTILITY_WEIGHTS: Record<string, number> = {
  'preface': 0.3,
  'chapter-1': 0.9,
  'chapter-2': 0.8,
  'chapter-2-5': 0.7,
  'chapter-3': 0.9,
  'chapter-4': 0.7,
  'chapter-5': 0.6,
  'chapter-6': 0.5,
  'chapter-7': 0.6,
  'chapter-8': 0.7,
  'chapter-9': 0.6,
  'chapter-10': 0.8,
  'chapter-11': 0.8,
  'chapter-12': 0.7,
  'chapter-13': 0.5
};

/**
 * Extract relevant tags from a chapter title
 */
function extractTags(title: string): string[] {
  const lowered = title.toLowerCase();
  const tags: string[] = [];
  
  // Core concepts
  if (lowered.includes('core')) tags.push('core-concept');
  if (lowered.includes('principle')) tags.push('principle');
  if (lowered.includes('equation')) tags.push('equation', 'mathematics');
  if (lowered.includes('parameter')) tags.push('parameter', 'calibration');
  
  // Domains
  if (lowered.includes('brain') || lowered.includes('perception')) tags.push('neuroscience', 'cognition');
  if (lowered.includes('particle') || lowered.includes('quantum')) tags.push('physics', 'quantum');
  if (lowered.includes('cell') || lowered.includes('bio')) tags.push('biology', 'medicine');
  if (lowered.includes('market') || lowered.includes('social')) tags.push('economics', 'social');
  if (lowered.includes('ecolog')) tags.push('ecology', 'environment');
  
  // Applications
  if (lowered.includes('diagnostic')) tags.push('diagnosis', 'analysis');
  if (lowered.includes('modulation') || lowered.includes('intervention')) tags.push('intervention', 'therapy');
  if (lowered.includes('synthesis') || lowered.includes('building')) tags.push('design', 'creation');
  
  // Add generic tags from the title words
  const words = title.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !['with', 'from', 'that', 'this', 'and', 'the'].includes(w));
  tags.push(...words.slice(0, 3));
  
  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Extract ISRMNodes from the handbook text
 */
function extractNodes(raw: string): ISRMNode[] {
  const lines = raw.split('\n').map(line => line.trim()).filter(Boolean);
  const nodes: ISRMNode[] = [];
  
  lines.forEach(title => {
    // Skip section headers
    if (title.startsWith('Section')) return;
    
    // Create ID from title
    const id = title.toLowerCase()
      .replace(/^chapter\s+(\d+)\.?(\d+)?:?\s+/i, 'chapter-$1$2-')
      .replace(/^preface:?\s+/i, 'preface-')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Simplify ID for lookup
    const simpleId = id.replace(/^chapter-\d+-/, 'chapter-').replace(/^preface-/, 'preface');
    
    // Get summary and links
    const summary = CHAPTER_SUMMARIES[simpleId] || title;
    const links = CONCEPT_LINKS[simpleId] || [];
    const utilityWeight = UTILITY_WEIGHTS[simpleId] || 0.5;
    
    // Extract tags
    const tags = extractTags(title);
    
    nodes.push({
      id,
      title,
      summary,
      tags,
      utilityWeight,
      links
    });
  });
  
  return nodes;
}

/**
 * Load the ISRM Handbook into Aura's memory system
 * Returns the number of nodes loaded
 */
export function loadISRMHandbook() {
  const nodes = extractNodes(HANDBOOK_RAW);
  const { addBelief } = useAuraMemory.getState();
  
  // Add each node to Aura's belief system
  nodes.forEach(node => {
    addBelief(node);
  });
  
  console.log(`ISRM Handbook loaded: ${nodes.length} concepts`);
  return nodes.length;
}
