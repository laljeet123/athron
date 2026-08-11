import { persistWorkoutSession as defaultPersist } from "../services/workouts.js";

export const workoutStartManager = {
  currentPromise: null,
  _persistFn: defaultPersist,
};

export function setPersistFn(fn) {
  workoutStartManager._persistFn = fn || defaultPersist;
}

export async function startWorkoutSession(session, options = {}) {
  if (!session || !session.workoutName) {
    throw new Error("Invalid session: 'workoutName' is required");
  }

  if (workoutStartManager.currentPromise) {
    return workoutStartManager.currentPromise;
  }

  const persistFn = workoutStartManager._persistFn;

  const promise = (async () => {
    try {
      const res = await persistFn(session, options);
      if (res && res.persisted) {
        return {
          session: { ...session, id: res.record?.id, persistedSource: "backend" },
          result: res,
        };
      }

      return {
        session: { ...session, persistedSource: "local" },
        result: res,
      };
    } finally {
      workoutStartManager.currentPromise = null;
    }
  })();

  workoutStartManager.currentPromise = promise;
  return promise;
}
