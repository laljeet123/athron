const MEASUREMENTS_KEY = "athron_progress_measurements";
const PROGRESS_LOGS_KEY = "athron_progress_logs";
const GOALS_KEY = "athron_progress_goals";
const ACHIEVEMENTS_KEY = "athron_progress_achievements";
const TRANSFORMATIONS_KEY = "athron_progress_transformations";

function loadLocalItems(key) {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage`, error);
    return [];
  }
}

function saveLocalItems(key, items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage`, error);
  }
}

export async function fetchUserMeasurements() {
  return loadLocalItems(MEASUREMENTS_KEY);
}

export async function saveUserMeasurement(measurement) {
  const measurements = loadLocalItems(MEASUREMENTS_KEY);
  const nextMeasurement = {
    id: measurement.id || `measurement-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    weight: measurement.weight ?? null,
    height: measurement.height ?? null,
    body_fat: measurement.body_fat ?? null,
    chest: measurement.chest ?? null,
    waist: measurement.waist ?? null,
    arms: measurement.arms ?? null,
    thighs: measurement.thighs ?? null,
    recorded_at: measurement.recorded_at || new Date().toISOString(),
  };
  saveLocalItems(MEASUREMENTS_KEY, [nextMeasurement, ...measurements].slice(0, 100));
  return nextMeasurement;
}

export async function fetchProgressLogs() {
  return loadLocalItems(PROGRESS_LOGS_KEY);
}

export async function saveProgressLog(entry) {
  const logs = loadLocalItems(PROGRESS_LOGS_KEY);
  const nextLog = {
    id: entry.id || `progress-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...entry,
    created_at: entry.created_at || new Date().toISOString(),
  };
  saveLocalItems(PROGRESS_LOGS_KEY, [nextLog, ...logs].slice(0, 200));
  return nextLog;
}

export async function fetchUserGoals() {
  return loadLocalItems(GOALS_KEY);
}

export async function upsertUserGoal(goal) {
  const goals = loadLocalItems(GOALS_KEY);
  const existingIndex = goals.findIndex((item) => item.id && goal.id && item.id === goal.id);
  const nextGoal = {
    id: goal.id || `goal-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...goal,
    updated_at: new Date().toISOString(),
  };
  if (existingIndex >= 0) {
    goals[existingIndex] = nextGoal;
  } else {
    goals.unshift(nextGoal);
  }
  saveLocalItems(GOALS_KEY, goals.slice(0, 50));
  return nextGoal;
}

export async function fetchAchievements() {
  return loadLocalItems(ACHIEVEMENTS_KEY);
}

export async function unlockAchievement(name, description) {
  const achievements = loadLocalItems(ACHIEVEMENTS_KEY);
  const nextAchievement = {
    id: `achievement-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    description,
    unlocked_at: new Date().toISOString(),
  };
  saveLocalItems(ACHIEVEMENTS_KEY, [nextAchievement, ...achievements].slice(0, 100));
  return nextAchievement;
}

export async function fetchTransformations() {
  return loadLocalItems(TRANSFORMATIONS_KEY);
}

async function fileToDataUrl(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadTransformationPhoto({ file, viewType, note, loggedAt }) {
  if (!file || !file.name) throw new Error("Please select a transformation photo file.");
  const photos = loadLocalItems(TRANSFORMATIONS_KEY);
  const photoDataUrl = await fileToDataUrl(file);
  const nextPhoto = {
    id: `transformation-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    viewType: viewType || "unknown",
    note: note || "",
    loggedAt: loggedAt || new Date().toISOString(),
    photo: photoDataUrl,
  };
  saveLocalItems(TRANSFORMATIONS_KEY, [nextPhoto, ...photos].slice(0, 50));
  return nextPhoto;
}
