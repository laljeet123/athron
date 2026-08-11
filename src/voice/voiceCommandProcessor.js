export const VOICE_COMMANDS = {
  START_WORKOUT: "START_WORKOUT",
  PAUSE_WORKOUT: "PAUSE_WORKOUT",
  RESUME_WORKOUT: "RESUME_WORKOUT",
  FINISH_WORKOUT: "FINISH_WORKOUT",
  NEXT_EXERCISE: "NEXT_EXERCISE",
  PREVIOUS_EXERCISE: "PREVIOUS_EXERCISE",
  COMPLETE_SET: "COMPLETE_SET",
  REPEAT_INSTRUCTIONS: "REPEAT_INSTRUCTIONS",
  HOW_MANY_REPS: "HOW_MANY_REPS",
  CHECK_FORM: "CHECK_FORM",
  ANALYZE_POSTURE: "ANALYZE_POSTURE",
  START_CAMERA: "START_CAMERA",
  START_TIMER: "START_TIMER",
  STOP_TIMER: "STOP_TIMER",
  SHOW_PROTEIN: "SHOW_PROTEIN",
  SHOW_CALORIES: "SHOW_CALORIES",
  SHOW_WATER: "SHOW_WATER",
  SHOW_NUTRITION: "SHOW_NUTRITION",
  UNKNOWN: "UNKNOWN",
};

const COMMAND_PATTERNS = [
  { command: VOICE_COMMANDS.START_WORKOUT, phrases: ["start workout", "begin workout", "start my workout", "begin my workout", "start shoulder workout", "start chest workout", "start leg workout"] },
  { command: VOICE_COMMANDS.PAUSE_WORKOUT, phrases: ["pause workout", "pause session", "hold on", "take a break"] },
  { command: VOICE_COMMANDS.RESUME_WORKOUT, phrases: ["resume workout", "continue workout", "resume session", "continue session"] },
  { command: VOICE_COMMANDS.FINISH_WORKOUT, phrases: ["finish workout", "end workout", "complete workout", "stop workout"] },
  { command: VOICE_COMMANDS.NEXT_EXERCISE, phrases: ["next exercise", "move on", "next", "skip exercise"] },
  { command: VOICE_COMMANDS.PREVIOUS_EXERCISE, phrases: ["previous exercise", "go back", "last exercise"] },
  { command: VOICE_COMMANDS.COMPLETE_SET, phrases: ["complete set", "set complete", "finish set", "i finished the set", "set done"] },
  { command: VOICE_COMMANDS.REPEAT_INSTRUCTIONS, phrases: ["repeat instructions", "say that again", "repeat that"] },
  { command: VOICE_COMMANDS.HOW_MANY_REPS, phrases: ["how many reps", "what are my reps", "how many repetitions", "reps?"] },
  { command: VOICE_COMMANDS.CHECK_FORM, phrases: ["check my form", "analyze my form", "form check"] },
  { command: VOICE_COMMANDS.ANALYZE_POSTURE, phrases: ["analyze my posture", "check posture", "posture check"] },
  { command: VOICE_COMMANDS.START_CAMERA, phrases: ["start camera", "open camera", "turn on camera"] },
  { command: VOICE_COMMANDS.START_TIMER, phrases: ["start timer", "begin timer", "set timer"] },
  { command: VOICE_COMMANDS.STOP_TIMER, phrases: ["stop timer", "pause timer", "cancel timer"] },
  { command: VOICE_COMMANDS.SHOW_PROTEIN, phrases: ["how much protein today", "show protein", "protein today"] },
  { command: VOICE_COMMANDS.SHOW_CALORIES, phrases: ["show calories", "how many calories", "calories today"] },
  { command: VOICE_COMMANDS.SHOW_WATER, phrases: ["show water", "how much water", "water today", "hydration"] },
  { command: VOICE_COMMANDS.SHOW_NUTRITION, phrases: ["nutrition summary", "what should i eat", "am i on track", "nutrition today", "macros today"] },
];

function matchCommand(text) {
  const normalized = text.trim().toLowerCase();
  for (const item of COMMAND_PATTERNS) {
    for (const phrase of item.phrases) {
      if (normalized.includes(phrase)) {
        return item.command;
      }
    }
  }
  return VOICE_COMMANDS.UNKNOWN;
}

function extractNumbers(text) {
  const matches = text.match(/(\d+)\s*(seconds|secs|minutes|mins)?/i);
  if (!matches) {
    return null;
  }

  const value = Number(matches[1]);
  const unit = matches[2]?.toLowerCase();
  if (unit?.startsWith("minute")) {
    return value * 60;
  }
  return value;
}

export function processVoiceCommand(text) {
  const command = matchCommand(text);
  const params = {};

  if (command === VOICE_COMMANDS.START_WORKOUT) {
    const workoutMatch = text.match(/shoulder|chest|leg|back|core|cardio/i);
    if (workoutMatch) {
      params.workoutType = workoutMatch[0].toLowerCase();
    }
  }

  if (command === VOICE_COMMANDS.START_TIMER) {
    const seconds = extractNumbers(text);
    if (seconds) {
      params.seconds = seconds;
    }
  }

  return {
    command,
    params,
    rawText: text,
  };
}
