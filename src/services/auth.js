// Auth helpers disabled — return safe no-ops for compatibility
import { login, signup, logout as backendLogout } from "./backendAuth.js";

export async function signInWithEmail(email, password) {
  return login(email, password);
}

export async function signUpWithEmail(email, password) {
  return signup(email, password);
}

export async function signOut() {
  return backendLogout();
}

export async function resetPasswordForEmail(/* email */) {
  // Not supported in local-only mode
  throw new Error("Password reset is not available in local-only mode.");
}
