// utils/ModelMemory.ts

export interface MemoryEntry {
  topic: string;
  input: string;
  response: string;
  deltaS: number;
  deltaC: number;
  utility: number;
  timestamp: number;
  score?: number; // used during recallRelevant
}

export class ModelMemory {
  private memory: MemoryEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
  }

  addEntry(entry: MemoryEntry): void {
    if (this.memory.length >= this.maxEntries) {
      this.memory.shift(); // Remove oldest memory entry
    }
    this.memory.push(entry);
    console.log(`[ModelMemory] Logged memory for topic: ${entry.topic}`);
  }

  recall(topic: string): MemoryEntry[] {
    return this.memory.filter(e => e.topic.toLowerCase() === topic.toLowerCase());
  }

  recallRelevant(input: string, maxResults = 5): MemoryEntry[] {
    const keywords = input.toLowerCase().split(/\W+/);
    const scored = this.memory.map(entry => {
      const score = keywords.reduce((acc, word) => {
        return acc + (
          entry.input.toLowerCase().includes(word) ||
          entry.response.toLowerCase().includes(word) ||
          entry.topic.toLowerCase().includes(word)
            ? 1
            : 0
        );
      }, 0);
      return { ...entry, score };
    });

    return scored
      .filter(e => e.score && e.score > 0)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, maxResults);
  }

  getLastEntry(): MemoryEntry | null {
    return this.memory.length > 0 ? this.memory[this.memory.length - 1] : null;
  }

  getCoherenceScore(topic: string): number {
    const entries = this.recall(topic);
    if (entries.length === 0) return 0;
    const avgU = entries.reduce((sum, e) => sum + e.utility, 0) / entries.length;
    return avgU;
  }

  exportMemory(): MemoryEntry[] {
    return [...this.memory];
  }

  // Optional: Conditional memory recall based on coherence thresholds
  conditionalRecall(input: string, deltaC: number, deltaS: number, thresholdC = 0.15, thresholdS = 0.25): MemoryEntry[] {
    const useMemory = deltaC > thresholdC || deltaS > thresholdS;
    return useMemory ? this.recallRelevant(input, 5) : [];
  }
}
