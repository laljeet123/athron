import { loadStoredProfile, saveProfile } from "./localProfile.js";

export async function fetchUserProfile() {
  return loadStoredProfile();
}

export async function upsertUserProfile(profile) {
  return saveProfile(profile);
}

export async function uploadProfileAvatar(file) {
  // Profile avatar is handled directly in AuthContext local upload helper.
  throw new Error("uploadProfileAvatar is not supported in local-only mode");
}
