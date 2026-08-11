import { ROUTES } from "../utils/routes.js";

function ensureArray(actions) {
  if (!actions) return [];
  return Array.isArray(actions) ? actions : [actions];
}

export async function executeAthronActions(actions, env = {}) {
  const { navigate, workout, speak } = env;
  const list = ensureArray(actions);
  const results = [];

  for (const action of list) {
    try {
      if (!action || !action.type) {
        results.push({ action, success: false, message: "Invalid action format." });
        continue;
      }

      if (action.type === "NAVIGATE") {
        const route = action.route || (action.target === "AI" ? "/ai" : action.target === "NUTRITION" ? ROUTES.NUTRITION : action.route || action.path);
        if (!route) {
          results.push({ action, success: false, message: "No route specified for navigation." });
          continue;
        }
        if (typeof navigate === "function") {
          navigate(route);
          results.push({ action, success: true, message: `Opened ${route}` });
        } else {
          results.push({ action, success: false, message: "Navigation unavailable in this environment." });
        }
        continue;
      }

      if (action.type === "WORKOUT_ACTION") {
        const act = action.action;
        if (!workout) {
          results.push({ action, success: false, message: "Workout context not available." });
          continue;
        }

        // map supported workout actions to context methods
        if (act === "START_WORKOUT") {
          if (typeof workout.startWorkout === "function") {
            await workout.startWorkout();
            results.push({ action, success: true, message: "Your workout has started." });
          } else {
            results.push({ action, success: false, message: "Start workout not supported." });
          }
          continue;
        }

        if (act === "NEXT_EXERCISE") {
          if (typeof workout.goToNextExercise === "function") {
            await workout.goToNextExercise();
            results.push({ action, success: true, message: "Moved to the next exercise." });
          } else {
            results.push({ action, success: false, message: "Next exercise not supported." });
          }
          continue;
        }

        if (act === "COMPLETE_SET") {
          if (typeof workout.completeSet === "function") {
            await workout.completeSet();
            results.push({ action, success: true, message: "Set completed." });
          } else {
            results.push({ action, success: false, message: "Complete set not supported." });
          }
          continue;
        }

        if (act === "PAUSE_WORKOUT") {
          if (typeof workout.pauseWorkout === "function") {
            await workout.pauseWorkout();
            results.push({ action, success: true, message: "Workout paused." });
          } else {
            results.push({ action, success: false, message: "Pause not supported." });
          }
          continue;
        }

        if (act === "RESUME_WORKOUT") {
          if (typeof workout.resumeWorkout === "function") {
            await workout.resumeWorkout();
            results.push({ action, success: true, message: "Workout resumed." });
          } else {
            results.push({ action, success: false, message: "Resume not supported." });
          }
          continue;
        }

        if (act === "START_REST_TIMER") {
          const seconds = action.seconds || 60;
          if (typeof workout.startRestTimer === "function") {
            await workout.startRestTimer(seconds);
            results.push({ action, success: true, message: `Started ${seconds}s rest timer.` });
          } else {
            results.push({ action, success: false, message: "Rest timer not supported." });
          }
          continue;
        }

        if (act === "OPEN_FORM_CHECKER") {
          if (typeof navigate === "function") {
            navigate(ROUTES.FORM_CHECKER());
            results.push({ action, success: true, message: "Opening form checker." });
          } else {
            results.push({ action, success: false, message: "Cannot open form checker." });
          }
          continue;
        }

        results.push({ action, success: false, message: `Unsupported workout action: ${act}` });
        continue;
      }

      // unknown type
      results.push({ action, success: false, message: "Unknown action type." });
    } catch (err) {
      results.push({ action, success: false, message: err?.message || String(err) });
    }
  }

  return results;
}

export default executeAthronActions;
