export function detectIntent(message) {
  if (!message || typeof message !== "string") return "UNKNOWN";
  const text = message.toLowerCase();

  const mapping = [
    { intent: "WORKOUT_CONTROL", phrases: ["start my workout", "start workout", "begin workout", "start session"] },
    { intent: "WORKOUT_CONTROL", phrases: ["next exercise", "next", "skip"] },
    { intent: "WORKOUT_CONTROL", phrases: ["pause workout", "pause"] },
    { intent: "WORKOUT_CONTROL", phrases: ["resume workout", "resume"] },
    { intent: "WORKOUT", phrases: ["workout", "training", "exercise session"] },
    { intent: "EXERCISE", phrases: ["how was my", "analyze my", "check my"] },
    { intent: "FORM_CHECK", phrases: ["how was my", "form", "squat", "deadlift", "bench"] },
    { intent: "NUTRITION", phrases: ["what should i eat", "what to eat", "eat tonight", "what should i eat"] },
    { intent: "CALORIES", phrases: ["calories", "burned", "burn"] },
    { intent: "PROTEIN", phrases: ["protein", "how much protein", "protein do i need"] },
    { intent: "FOOD", phrases: ["log", "add", "i ate"] },
    { intent: "MEAL", phrases: ["meal", "breakfast", "lunch", "dinner"] },
    { intent: "WATER", phrases: ["water", "hydration", "drank"] },
    { intent: "PROGRESS", phrases: ["progress", "improving", "how am i progressing", "how am i doing"] },
    { intent: "PROFILE", phrases: ["profile", "my profile", "age", "height", "weight"] },
    { intent: "RECOVERY", phrases: ["rest", "recovery", "soreness"] },
    { intent: "NAVIGATION", phrases: ["open", "go to", "show me", "navigate"] },
    { intent: "WORKOUT", phrases: ["plan my workout", "plan workout"] },
    { intent: "GENERAL_FITNESS", phrases: ["what is", "how to", "advice"] },
  ];

  for (const rule of mapping) {
    for (const phrase of rule.phrases) {
      if (text.includes(phrase)) return rule.intent;
    }
  }

  return "UNKNOWN";
}
