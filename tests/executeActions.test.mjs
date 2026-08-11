import assert from "assert";
import { executeAthronActions } from "../src/ai/actionHandler.js";

function makeWorkoutMock() {
  let state = { started: false, paused: false, setsCompleted: 0, timer: 0, index: 0 };
  return {
    startWorkout: async () => { state.started = true; return true; },
    pauseWorkout: async () => { state.paused = true; return true; },
    resumeWorkout: async () => { state.paused = false; return true; },
    goToNextExercise: async () => { state.index += 1; return true; },
    goToPreviousExercise: async () => { state.index = Math.max(0, state.index - 1); return true; },
    completeSet: async () => { state.setsCompleted += 1; return true; },
    startRestTimer: async (s) => { state.timer = s; return true; },
    stopRestTimer: async () => { state.timer = 0; return true; },
    finishWorkout: async () => { state = { started: false }; return true; },
    _state: () => state,
  };
}

async function run() {
  const mockNavigate = (path) => { mockNavigate.last = path; };
  const workout = makeWorkoutMock();
  const speak = async (text) => { speak.last = text; };

  // Test NAVIGATE
  let res = await executeAthronActions({ type: "NAVIGATE", route: "/nutrition" }, { navigate: mockNavigate });
  console.log('NAVIGATE ->', res);
  assert.strictEqual(Array.isArray(res), true);
  assert.strictEqual(res[0].success, true);

  // Test START_WORKOUT
  console.log('RUN: START_WORKOUT');
  res = await executeAthronActions({ type: "WORKOUT_ACTION", action: "START_WORKOUT" }, { workout });
  console.log('START_WORKOUT ->', res);
  assert.strictEqual(res[0].success, true);
  assert.strictEqual(workout._state().started, true);

  // Test NEXT_EXERCISE
  console.log('RUN: NEXT_EXERCISE');
  res = await executeAthronActions({ type: "WORKOUT_ACTION", action: "NEXT_EXERCISE" }, { workout });
  console.log('NEXT_EXERCISE ->', res);
  assert.strictEqual(res[0].success, true);
  assert.strictEqual(workout._state().index, 1);

  // Test COMPLETE_SET
  console.log('RUN: COMPLETE_SET');
  res = await executeAthronActions({ type: "WORKOUT_ACTION", action: "COMPLETE_SET" }, { workout });
  console.log('COMPLETE_SET ->', res);
  assert.strictEqual(res[0].success, true);
  assert.strictEqual(workout._state().setsCompleted, 1);

  // Test START_REST_TIMER
  console.log('RUN: START_REST_TIMER');
  res = await executeAthronActions({ type: "WORKOUT_ACTION", action: "START_REST_TIMER", seconds: 45 }, { workout });
  console.log('START_REST_TIMER ->', res);
  assert.strictEqual(res[0].success, true);
  assert.strictEqual(workout._state().timer, 45);

  // Test OPEN_FORM_CHECKER navigates
  console.log('RUN: OPEN_FORM_CHECKER');
  res = await executeAthronActions({ type: "WORKOUT_ACTION", action: "OPEN_FORM_CHECKER" }, { navigate: mockNavigate, workout: {} });
  console.log('OPEN_FORM_CHECKER ->', res);
  assert.strictEqual(res[0].success, true);
  assert.strictEqual(mockNavigate.last, "/form-checker");

  // Test unknown action returns unsupported
  res = await executeAthronActions({ type: "WORKOUT_ACTION", action: "UNKNOWN" }, { workout });
  assert.strictEqual(res[0].success, false);

  console.log("All executeAthronActions tests passed.");
}

await run();
