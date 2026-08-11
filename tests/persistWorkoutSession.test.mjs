import assert from "assert";
// Ensure env vars are present before importing modules that read them
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || "http://localhost";
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_test_key";
const { persistWorkoutSession } = await import("../src/services/workouts.js");

// Helper to build mock supabase clients
function makeMockClient({ userId = "test-user", insertResult = { data: { id: "w1" }, error: null }, shouldThrow = false } = {}) {
  const client = {
    auth: {
      getUser: async () => ({ data: { user: { id: userId } }, error: null }),
    },
    from: (table) => ({
      insert: (payload) => ({
        select: () => ({
          single: async () => {
            if (shouldThrow) throw new Error("network");
            return insertResult;
          },
        }),
      }),
    }),
  };
  return client;
}

async function testSuccessfulSupabaseInsert() {
  const client = makeMockClient({ insertResult: { data: { id: "w123", workout_name: "Test" }, error: null } });
  const session = { workoutName: "Test", durationMinutes: 10, caloriesBurned: 50, totalExercises: 1, completedAt: new Date().toISOString() };
  // Ensure environment treats this as online for the test (isOffline checks navigator.onLine)
  try {
    if (typeof navigator !== "undefined") {
      Object.defineProperty(navigator, "onLine", { value: true, writable: true, configurable: true });
    }
  } catch (e) {
    // ignore if non-configurable
  }
  const res = await persistWorkoutSession(session, { supabaseClient: client });
  assert.ok(res.persisted === true, "Should indicate supabase persisted");
  assert.ok(res.record && res.record.id === "w123", "Inserted record should be returned");
}

async function testSupabaseInsertFailureThrows() {
  const client = makeMockClient({ insertResult: { data: null, error: { message: "insert failed" } } });
  const session = { workoutName: "FailTest", durationMinutes: 5 };
  let threw = false;
  try {
    await persistWorkoutSession(session, { supabaseClient: client });
  } catch (err) {
    threw = true;
    assert.ok(err && (err.message || err.message === "insert failed" || err.message === "network"), "Should throw error from supabase");
  }
  assert.ok(threw, "Expected persistWorkoutSession to throw on supabase error");
}

async function testMissingRequiredData() {
  let threw = false;
  try {
    await persistWorkoutSession({}, { supabaseClient: makeMockClient() });
  } catch (err) {
    threw = true;
    assert.strictEqual(err.message, "Invalid session: 'workoutName' is required");
  }
  assert.ok(threw, "Should throw for missing required data");
}

async function testLocalFallbackBehavior() {
  // Make client null to force local fallback
  const session = { workoutName: "LocalTest", durationMinutes: 8 };
  const res = await persistWorkoutSession(session, { supabaseClient: null });
  assert.ok(res.persisted === false && res.source === "local", "Should indicate local fallback when client missing");
  assert.ok(Array.isArray(res.history), "Should return history array on local fallback");
}

async function testReturnedSessionData() {
  const client = makeMockClient({ insertResult: { data: { id: "abc", workout_name: "ReturnTest" }, error: null } });
  const session = { workoutName: "ReturnTest", durationMinutes: 12 };
  const res = await persistWorkoutSession(session, { supabaseClient: client });
  assert.strictEqual(res.record.id, "abc");
  assert.strictEqual(res.source, "supabase");
}

async function run() {
  await testSuccessfulSupabaseInsert();
  console.log("A passed: Successful Supabase insert");
  await testSupabaseInsertFailureThrows();
  console.log("B passed: Supabase insert failure throws");
  await testMissingRequiredData();
  console.log("C passed: Missing/invalid required data throws");
  await testLocalFallbackBehavior();
  console.log("D passed: Local fallback behavior");
  await testReturnedSessionData();
  console.log("E passed: Returned session data verified");
}

await run();
console.log("persistWorkoutSession unit tests completed");
