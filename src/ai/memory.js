const MEMORY_KEY = "athron_ai_memory_store";

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export function loadMemory() {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = window.localStorage.getItem(MEMORY_KEY);
  return stored ? safeParse(stored) : [];
}

export function saveMemory(memories) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
}

export function addMemory(note, metadata = {}) {
  const memories = loadMemory();
  const next = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      note,
      type: metadata.type || "note",
      createdAt: new Date().toISOString(),
      ...metadata,
    },
    ...memories,
  ].slice(0, 50);
  saveMemory(next);
  return next;
}

export function getMemoryByType(type) {
  return loadMemory().filter((item) => item.type === type);
}

export function clearMemory() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(MEMORY_KEY);
}
