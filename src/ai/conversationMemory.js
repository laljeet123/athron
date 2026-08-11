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

function saveConversations(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn("Failed to save AI conversations to localStorage", error);
  }
}

export async function saveConversation({ userId, message, response, intent, type }) {
  if (!message || !response) return null;

  const conversations = loadConversations();
  const record = {
    id: `conversation-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId: userId || null,
    message,
    response,
    intent: intent || null,
    type: type || "voice",
    created_at: new Date().toISOString(),
  };
  saveConversations([record, ...conversations].slice(0, 200));
  return record;
}

export async function getRecentConversations(userId, limit = 10) {
  const conversations = loadConversations();
  if (!userId) return conversations.slice(0, limit);
  return conversations.filter((c) => !c.userId || c.userId === userId).slice(0, limit);
}

export async function getLatestFormResult(userId) {
  const conversations = loadConversations();
  if (!userId) {
    return conversations[0] || null;
  }
  return conversations.find((c) => c.userId === userId) || null;
}
