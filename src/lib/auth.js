const USER_STORAGE_KEY = "athron_profile";

function getStoredUser() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(USER_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

function setStoredUser(user) {
  if (typeof window === "undefined") return;
  if (!user) return;
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function clearStoredUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

export function clearAuthentication() {
  clearStoredUser();
}

export async function getAuthenticatedUser() {
  if (typeof window === "undefined") {
    return null;
  }
  return getStoredUser();
}

export async function getAuthenticatedUserId() {
  const user = await getAuthenticatedUser();
  return user?.id ?? null;
}

export function getStoredUserProfile() {
  return getStoredUser();
}

export function setStoredUserProfile(user) {
  setStoredUser(user);
}
