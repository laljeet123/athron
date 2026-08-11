import assert from "assert";
// Ensure env vars are set before importing modules that initialize the Supabase client
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || "http://localhost";
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_test_key";
import { workoutStartManager, startWorkoutSession, setPersistFn } from "../src/context/workoutStart.js";

const session = { workoutName: "RetryTest", durationMinutes: 10 };

async function testStartSucceeds() {
  let called = 0;
  setPersistFn(async (s) => {
    called++;
    return { persisted: true, record: { id: "ok" } };
  });

  const res = await startWorkoutSession(session);
  assert.ok(res.session.id === "ok", "Session id should be from persist result");
  assert.strictEqual(called, 1, "persist should be called once");
}

async function testStartFails() {
  setPersistFn(async () => {
    throw new Error("persist failed");
  });

  let threw = false;
  try {
    await startWorkoutSession(session);
  } catch (err) {
    threw = true;
  }
  assert.ok(threw, "start should throw when persist fails");
}

async function testRetrySucceedsAfterFailure() {
  let calls = 0;
  setPersistFn(async () => {
    calls++;
    if (calls === 1) throw new Error("first fail");
    return { persisted: true, record: { id: "retry-ok" } };
  });

  // First attempt fails
  let threw = false;
  try {
    await startWorkoutSession(session);
  } catch (e) {
    threw = true;
  }
  assert.ok(threw, "first start should fail");

  // Retry should succeed
  const res = await startWorkoutSession(session);
  assert.ok(res.session.id === "retry-ok", "Retry should return persisted session id");
}

async function testMultipleClicksNoDuplicate() {
  let calls = 0;
  setPersistFn(async () => {
    calls++;
    // simulate delay
    await new Promise((r) => setTimeout(r, 50));
    return { persisted: true, record: { id: "multi" } };
  });

  const p1 = startWorkoutSession(session);
  const p2 = startWorkoutSession(session);
  const [r1, r2] = await Promise.all([p1, p2]);
  assert.strictEqual(calls, 1, "persist should be called only once for concurrent starts");
  assert.strictEqual(r1.session.id, r2.session.id, "Both results should be same persisted id");
}

async function run() {
  await testStartSucceeds();
  console.log("1 passed");
  await testStartFails();
  console.log("2 passed");
  await testRetrySucceedsAfterFailure();
  console.log("3 passed");
  await testMultipleClicksNoDuplicate();
  console.log("4 passed");
}

await run();
console.log("startWorkoutRetry tests completed");
