import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { startWorkoutSession } from "./workoutStart.js";

const STORAGE_KEY = "athron_active_workout_state";

const initialState = {
  session: null,
  activeExerciseIndex: 0,
  currentSet: 1,
  paused: false,
  timerActive: false,
  timerSeconds: 0,
};

function loadSavedState() {
  if (typeof window === "undefined") {
    return initialState;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return initialState;
    }
    return JSON.parse(stored);
  } catch {
    return initialState;
  }
}

function saveState(state) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function createSampleWorkout() {
  return {
    workoutName: "Shoulder Focus",
    name: "Shoulder Focus",
    bodyPartId: null,
    bodyPartName: "Shoulders",
    durationMinutes: 18,
    caloriesBurned: 120,
    totalExercises: 3,
    exercises: [
      {
        id: "shoulder-press",
        name: "Shoulder press",
        description: "Press the weight overhead with controlled motion.",
        sets: 3,
        reps: 10,
        restSeconds: 60,
      },
      {
        id: "lateral-raises",
        name: "Lateral raises",
        description: "Raise the arms to shoulder height with a slight bend.",
        sets: 3,
        reps: 12,
        restSeconds: 45,
      },
      {
        id: "front-raise",
        name: "Front raise",
        description: "Lift the weight in front of your body with control.",
        sets: 2,
        reps: 10,
        restSeconds: 45,
      },
    ],
  };
}

function reducer(state, action) {
  const currentExercise = state.session?.exercises?.[state.activeExerciseIndex] ?? null;
  const hasNext = state.session && state.activeExerciseIndex < state.session.exercises.length - 1;
  const hasPrevious = state.session && state.activeExerciseIndex > 0;

  switch (action.type) {
    case "START_WORKOUT": {
      const session = action.payload?.session || state.session || createSampleWorkout();
      return {
        ...state,
        session,
        activeExerciseIndex: 0,
        currentSet: 1,
        paused: false,
        timerActive: false,
        timerSeconds: 0,
      };
    }
    case "PAUSE_WORKOUT":
      return {
        ...state,
        paused: true,
      };
    case "RESUME_WORKOUT":
      return {
        ...state,
        paused: false,
      };
    case "NEXT_EXERCISE":
      if (!hasNext) {
        return state;
      }
      return {
        ...state,
        activeExerciseIndex: state.activeExerciseIndex + 1,
        currentSet: 1,
        timerActive: false,
        timerSeconds: 0,
      };
    case "PREVIOUS_EXERCISE":
      if (!hasPrevious) {
        return state;
      }
      return {
        ...state,
        activeExerciseIndex: state.activeExerciseIndex - 1,
        currentSet: 1,
        timerActive: false,
        timerSeconds: 0,
      };
    case "COMPLETE_SET": {
      if (!currentExercise) {
        return state;
      }
      if (state.currentSet < currentExercise.sets) {
        return {
          ...state,
          currentSet: state.currentSet + 1,
        };
      }
      if (hasNext) {
        return {
          ...state,
          activeExerciseIndex: state.activeExerciseIndex + 1,
          currentSet: 1,
          timerActive: false,
          timerSeconds: 0,
        };
      }
      return {
        ...state,
        session: null,
        activeExerciseIndex: 0,
        currentSet: 1,
        paused: false,
        timerActive: false,
        timerSeconds: 0,
      };
    }
    case "START_TIMER":
      return {
        ...state,
        timerActive: true,
        timerSeconds: action.payload?.seconds ?? currentExercise?.restSeconds ?? 60,
      };
    case "STOP_TIMER":
      return {
        ...state,
        timerActive: false,
      };
    case "FINISH_WORKOUT":
      return {
        ...state,
        session: null,
        activeExerciseIndex: 0,
        currentSet: 1,
        paused: false,
        timerActive: false,
        timerSeconds: 0,
      };
    default:
      return state;
  }
}

const WorkoutContext = createContext(null);

export function WorkoutProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, loadSavedState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const currentExercise = useMemo(
    () => state.session?.exercises?.[state.activeExerciseIndex] ?? null,
    [state.session, state.activeExerciseIndex]
  );

  const nextExercise = useMemo(
    () => state.session?.exercises?.[state.activeExerciseIndex + 1] ?? null,
    [state.session, state.activeExerciseIndex]
  );

  const value = useMemo(
    () => ({
      ...state,
      currentExercise,
      nextExercise,
      hasSession: Boolean(state.session),
      // Start workout flow: persist session first, then update active state.
      // Returns the persistence result or throws on Supabase failure.
      startWorkout: async (session, options = {}) => {
        // Use the start manager to prevent duplicate starts and to centralize persistence logic
        const { startWorkoutSession } = await import("./workoutStart.js");
        const res = await startWorkoutSession(session, options);
        if (res && res.result && res.result.persisted) {
          dispatch({ type: "START_WORKOUT", payload: { session: res.session } });
          return res;
        }

        // Local fallback: still start the workout but mark as local persistence
        if (res && res.result && res.result.persisted === false) {
          dispatch({ type: "START_WORKOUT", payload: { session: res.session } });
          return res;
        }

        throw new Error("Failed to persist workout session before starting workout.");
      },
      pauseWorkout: () => dispatch({ type: "PAUSE_WORKOUT" }),
      resumeWorkout: () => dispatch({ type: "RESUME_WORKOUT" }),
      goToNextExercise: () => dispatch({ type: "NEXT_EXERCISE" }),
      goToPreviousExercise: () => dispatch({ type: "PREVIOUS_EXERCISE" }),
      completeSet: () => dispatch({ type: "COMPLETE_SET" }),
      startRestTimer: (seconds) => dispatch({ type: "START_TIMER", payload: { seconds } }),
      stopRestTimer: () => dispatch({ type: "STOP_TIMER" }),
      finishWorkout: () => dispatch({ type: "FINISH_WORKOUT" }),
    }),
    [state, currentExercise, nextExercise]
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used inside WorkoutProvider");
  }
  return context;
}
