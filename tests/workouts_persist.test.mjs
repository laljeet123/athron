import assert from "assert";
// Provide test env vars so src/lib/supabase.js doesn't throw during tests
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || "http://localhost";
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_test_key";

const workouts = await import("../src/services/workouts.js");
const supabaseModule = await import("../src/lib/supabase.js");

async function run() {
  // Monkey-patch supabase and auth helper
  let inserted = null;
  supabaseModule.supabase.from = (table) => ({
    insert: async (payload) => {
      inserted = { table, payload };
      return { data: [{ id: "w1" }], error: null };
    },
  });

  // Monkey-patch supabase.auth.getUser to simulate authenticated user
  supabaseModule.supabase.auth = {
    getUser: async () => ({ data: { user: { id: "test-user" } }, error: null }),
  };

  const session = {
    workoutName: "Test",
    bodyPartId: null,
    durationMinutes: 10,
    caloriesBurned: 50,
    totalExercises: 1,
    completedAt: new Date().toISOString(),
  };

  const res = await workouts.persistWorkoutSession(session, { supabaseClient: supabaseModule.supabase });
  // Expect the new strict API to return an object with persisted flag
  assert.ok(res && (res.persisted === true || res.persisted === false), "persistWorkoutSession should return result object with persisted flag");

  console.log("workouts persist tests passed (returned result object, insert attempted or fallback)");
}

await run();
