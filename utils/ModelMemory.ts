// utils/ModelMemory.ts

export interface MemoryEntry {
  topic: string;
  input: string;
  response: string;
  deltaS: number;
  deltaC: number;
  utility: number;
  timestamp: number;
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
    return this.memory;
  }
}
