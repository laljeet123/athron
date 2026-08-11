import { fetchTodayWorkoutSessions } from "../services/workouts.js";

export async function getWorkoutContextSnapshot() {
  // Return a snapshot of today's workout sessions. Use the
  // service directly (static import) so bundlers can optimise.
  try {
    const sessions = await fetchTodayWorkoutSessions();
    return { sessions };
  } catch (err) {
    return { sessions: [] };
  }
}
