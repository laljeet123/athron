import { generateResponseWithProvider } from "./providers/AIProvider.js";
import { generateRecommendation } from "./recommendationEngine.js";
import { ROUTES } from "../utils/routes.js";

export async function generateAthronResponse(message, intent, context) {
  // Try external provider first (if configured)
  const providerResult = await generateResponseWithProvider(message, { intent, context });
  if (providerResult) return providerResult;

  // Fall back to rule-driven responses
  const reply = { message: "", actions: [], suggestions: [] };

  switch (intent) {
    case "CALORIES": {
      const cal = context.nutrition?.dailyNutrition?.calories ?? null;
      const target = context.nutrition?.targets?.dailyCalories ?? null;
      if (cal == null || target == null) {
        reply.message = "I don't have enough nutrition data. Please complete your profile or log meals.";
      } else {
        reply.message = `You've consumed ${Math.round(cal)} kcal of your ${Math.round(target)} kcal target today.`;
        reply.actions = [];
        reply.data = { consumed: cal, target };
      }
      break;
    }
    case "PROTEIN": {
      const consumed = context.nutrition?.dailyNutrition?.protein_g ?? null;
      const target = context.nutrition?.targets?.proteinTarget ?? null;
      if (consumed == null || target == null) {
        reply.message = "I don't have enough protein data. Please complete your profile or log meals.";
      } else {
        const remaining = Math.max(0, Math.round(target - consumed));
        reply.message = `You've consumed ${Math.round(consumed)} g of protein. You have about ${remaining} g remaining today.`;
        reply.data = { consumed, target, remaining };
      }
      break;
    }
    case "NUTRITION": {
      // generate recommendation
      reply.message = generateRecommendation(context);
      reply.actions = [];
      break;
    }
    case "FORM_CHECK": {
      const r = context.form;
      if (!r) reply.message = "No recent form analysis found.";
      else reply.message = `Latest form score: ${r.score || r.form_score || "N/A"}. Feedback: ${r.feedback || r.notes || "No details."}`;
      break;
    }
    case "WORKOUT_CONTROL": {
      // map common verbs in the message to workout actions
      const text = (message || "").toLowerCase();
      if (text.includes("start")) reply.actions.push({ type: "WORKOUT_ACTION", action: "START_WORKOUT" });
      else if (text.includes("next")) reply.actions.push({ type: "WORKOUT_ACTION", action: "NEXT_EXERCISE" });
      else if (text.includes("complete") || text.includes("finish set") || text.includes("set done")) reply.actions.push({ type: "WORKOUT_ACTION", action: "COMPLETE_SET" });
      else if (text.includes("pause")) reply.actions.push({ type: "WORKOUT_ACTION", action: "PAUSE_WORKOUT" });
      else if (text.includes("resume") || text.includes("continue")) reply.actions.push({ type: "WORKOUT_ACTION", action: "RESUME_WORKOUT" });
      else if (text.includes("rest") || text.includes("timer")) {
        const secondsMatch = text.match(/(\d+)\s*(s|sec|secs|seconds|m|min|mins|minutes)/);
        let seconds = 60;
        if (secondsMatch) {
          const n = Number(secondsMatch[1]);
          seconds = secondsMatch[2].startsWith("m") ? n * 60 : n;
        }
        reply.actions.push({ type: "WORKOUT_ACTION", action: "START_REST_TIMER", seconds });
      } else {
        reply.actions.push({ type: "WORKOUT_ACTION", action: "NEXT_EXERCISE" });
      }
      reply.message = "Executing workout command.";
      break;
    }
    case "PROGRESS": {
      reply.message = "I can summarize your progress. (Using stored history)";
      break;
    }
    default: {
      reply.message = "I can help with workouts, nutrition, form checks, and progress. What would you like to do?";
    }
  }

  // navigation detection
  const lower = (message || "").toLowerCase();
  if (lower.includes("nutrition")) reply.actions.push({ type: "NAVIGATE", route: ROUTES.NUTRITION });
  if (lower.includes("open ai") || lower.includes("ai coach") || lower.includes("open ai coach") || lower.includes("open ai")) reply.actions.push({ type: "NAVIGATE", route: "/ai" });
  if (lower.includes("exercises")) reply.actions.push({ type: "NAVIGATE", route: ROUTES.EXERCISES("all", "all", "all") });
  if (lower.includes("progress")) reply.actions.push({ type: "NAVIGATE", route: ROUTES.PROGRESS });
  if (lower.includes("form") || lower.includes("check my form") || lower.includes("analyze my")) reply.actions.push({ type: "WORKOUT_ACTION", action: "OPEN_FORM_CHECKER" });

  return reply;
}
