import { create } from 'zustand';

export type ISRMNode = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  utilityWeight: number;
  links: string[]; // IDs
};

interface AuraMemoryState {
  isrmGraph: Record<string, ISRMNode>;
  addBelief: (node: ISRMNode) => void;
  retrieveBelief: (tags: string[]) => ISRMNode | undefined;
  weakenBelief: (id: string, amount?: number) => void;
  strengthenBelief: (id: string, amount?: number) => void;
}

export const useAuraMemory = create<AuraMemoryState>((set, get) => ({
  isrmGraph: {},

  addBelief: (node) =>
    set((s) => ({ isrmGraph: { ...s.isrmGraph, [node.id]: node } })),

  retrieveBelief: (tags) => {
    const graph = get().isrmGraph;
    const matches = Object.values(graph).filter((n) =>
      tags.some((t) => n.tags.includes(t))
    );
    if (!matches.length) return undefined;
    // Weight by utilityWeight
    matches.sort((a, b) => b.utilityWeight - a.utilityWeight);
    return matches[0];
  },

  weakenBelief: (id, amount = 0.05) =>
    set((s) => {
      const n = s.isrmGraph[id];
      if (!n) return s;
      return {
        isrmGraph: {
          ...s.isrmGraph,
          [id]: { ...n, utilityWeight: Math.max(0, n.utilityWeight - amount) },
        },
      };
    }),

  strengthenBelief: (id, amount = 0.05) =>
    set((s) => {
      const n = s.isrmGraph[id];
      if (!n) return s;
      return {
        isrmGraph: {
          ...s.isrmGraph,
          [id]: { ...n, utilityWeight: Math.min(1, n.utilityWeight + amount) },
        },
      };
    }),
}));
