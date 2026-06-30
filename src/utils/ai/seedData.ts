import type { MemoryRecord } from "./types";

export const SEED_MEMORIES_RAW = [
  {
    title: "Explanation Preference",
    description: "Preferred explanation style.",
    category: "User Preference",
    memory: "Always explain equations step-by-step with complete mathematical derivations.",
    importance: 9
  },
  {
    title: "Citation Style",
    description: "Preferred citation format.",
    category: "User Preference",
    memory: "Always use APS citation style whenever available.",
    importance: 8
  },
  {
    title: "Graphene Research",
    description: "Current research project.",
    category: "Research Project",
    memory: "Currently researching graphene superconductivity.",
    importance: 10
  },
  {
    title: "Dark Matter Notes",
    description: "Temporary research notes.",
    category: "Research Notes",
    memory: "Interested in WIMP detection experiments.",
    importance: 7
  }
];

/**
 * Maps raw seed memories into full MemoryRecord structures with dummy empty embeddings.
 */
export function getInitialSeedMemories(): MemoryRecord[] {
  return SEED_MEMORIES_RAW.map((raw, index) => ({
    id: `mem_seed_${index + 1}`,
    title: raw.title,
    description: raw.description,
    category: raw.category,
    memory: raw.memory,
    importance: raw.importance,
    createdAt: Date.now() - (index * 3600000), // Slightly offset timestamps
    embedding: [] // Start as empty, will auto-embed when live key is present
  }));
}
