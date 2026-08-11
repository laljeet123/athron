import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "athron_profile";

function loadStoredProfile() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function storeProfile(profile) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile || null));
  } catch (e) {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadStoredProfile());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(loadStoredProfile());
  }, []);

  const refreshUserProfile = () => {
    const p = loadStoredProfile();
    setUser(p);
    return p;
  };

  const updateUserProfile = (profile) => {
    const next = { ...(user || {}), ...(profile || {}) };
    setUser(next);
    storeProfile(next);
    return next;
  };

  const uploadAvatarLocal = async (file) => {
    // Compress large images before storing in localStorage to avoid quota issues.
    const MAX_DIM = 800; // max width/height
    const MIME = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";

    const toDataUrl = (blob, quality = 0.8) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

    try {
      // If small enough, store as-is
      if (file.size <= 100 * 1024) {
        const dataUrl = await toDataUrl(file);
        const next = updateUserProfile({ avatarUrl: dataUrl });
        return next.avatarUrl;
      }

      // Create an image bitmap and draw to canvas for resizing
      const imgBitmap = await createImageBitmap(file);
      const ratio = Math.min(1, MAX_DIM / Math.max(imgBitmap.width, imgBitmap.height));
      const width = Math.round(imgBitmap.width * ratio);
      const height = Math.round(imgBitmap.height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imgBitmap, 0, 0, width, height);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, MIME === "image/png" ? "image/png" : "image/jpeg", 0.8));
      if (!blob) throw new Error("Image processing failed");
      const dataUrl = await toDataUrl(blob);
      const next = updateUserProfile({ avatarUrl: dataUrl });
      return next.avatarUrl;
    } catch (err) {
      // Fallback to raw data URL
      try {
        const reader = new FileReader();
        return await new Promise((resolve, reject) => {
          reader.onload = () => {
            const dataUrl = reader.result;
            const next = updateUserProfile({ avatarUrl: dataUrl });
            resolve(next.avatarUrl);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } catch (e) {
        throw err;
      }
    }
  };

  const value = useMemo(
    () => ({ user, loading, refreshUserProfile, updateUserProfile, uploadAvatarLocal }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

