const STORAGE_KEY = "athron_meal_logs";

function loadMealLogs() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("Failed to load meal logs from localStorage", error);
    return [];
  }
}

function saveMealLogs(logs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.warn("Failed to save meal logs to localStorage", error);
  }
}

export async function createMealLog(entry) {
  const logs = loadMealLogs();
  const nextEntry = {
    id: entry.id || `meal-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...entry,
    logged_at: entry.logged_at || new Date().toISOString(),
  };
  const nextLogs = [nextEntry, ...logs].slice(0, 200);
  saveMealLogs(nextLogs);
  return nextEntry;
}

export async function fetchTodayMealLogs() {
  const logs = loadMealLogs();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return logs.filter((item) => {
    const loggedAt = new Date(item.logged_at || item.loggedAt || item.created_at);
    return !Number.isNaN(loggedAt.getTime()) && loggedAt >= todayStart;
  });
}
