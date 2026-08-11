// Auth backend disabled — app runs local-only. Functions are no-ops for compatibility.
export async function signup(/* email, password */) {
  return { user: null };
}

export async function login(/* email, password */) {
  return { user: null };
}

export async function logout() {
  // noop
}

export function getStoredUser() {
  return null;
}

export function setStoredUser() {
  // noop
}

export function clearStoredUser() {
  // noop
}
