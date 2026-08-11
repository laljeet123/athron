const STORAGE_KEY = "athron_water_logs";

function loadWaterLogs() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("Failed to load water logs from localStorage", error);
    return [];
  }
}

function saveWaterLogs(logs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.warn("Failed to save water logs to localStorage", error);
  }
}

export async function createWaterLog(amountMl) {
  const logs = loadWaterLogs();
  const nextEntry = {
    id: `water-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    amount_ml: amountMl,
    logged_at: new Date().toISOString(),
  };
  const nextLogs = [nextEntry, ...logs].slice(0, 200);
  saveWaterLogs(nextLogs);
  return nextEntry;
}

export async function fetchTodayWaterLogs() {
  const logs = loadWaterLogs();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return logs.filter((item) => {
    const loggedAt = new Date(item.logged_at || item.loggedAt || item.created_at);
    return !Number.isNaN(loggedAt.getTime()) && loggedAt >= todayStart;
  });
}
