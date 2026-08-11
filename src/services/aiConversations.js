const STORAGE_KEY = "athron_ai_conversations";

function loadConversations() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("Failed to load AI conversations from localStorage", error);
    return [];
  }
}

function saveConversations(conversations) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.warn("Failed to save AI conversations to localStorage", error);
  }
}

export async function saveConversation(entry) {
  if (!entry || !entry.message || !entry.response) {
    return null;
  }

  const conversations = loadConversations();
  const record = {
    id: `conversation-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId: entry.userId || null,
    message: entry.message,
    response: entry.response,
    intent: entry.intent || null,
    type: entry.type || "voice",
    created_at: new Date().toISOString(),
  };

  saveConversations([record, ...conversations].slice(0, 200));
  return record;
}
