const STORAGE_KEY = "athron_ai_memory";

function loadAiMemory() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("Failed to load AI memory from localStorage", error);
    return [];
  }
}

function saveAiMemoryItems(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn("Failed to save AI memory to localStorage", error);
  }
}

export async function fetchAiMemory(limit = 20) {
  const memories = loadAiMemory();
  return memories.slice(0, limit);
}

export async function saveAiMemory(note, metadata = {}) {
  const memories = loadAiMemory();
  const nextEntry = {
    id: `memory-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    note: note || null,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
  };
  const next = [nextEntry, ...memories].slice(0, 200);
  saveAiMemoryItems(next);
  return nextEntry;
}
