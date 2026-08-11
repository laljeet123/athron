const STORAGE_KEY = "athron_user_preferences";

export async function fetchUserPreferences() {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn("Failed to load user preferences from localStorage", error);
    return null;
  }
}

export async function upsertUserPreferences(preferences) {
  if (typeof window === "undefined") return null;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences || {}));
    return preferences;
  } catch (error) {
    console.warn("Failed to save user preferences to localStorage", error);
    throw error;
  }
}
