import { exerciseRules as CENTRAL_EXERCISE_RULES } from "../data/exerciseRules.js";

const EXERCISE_RULES = {
  "push-up": [
    { id: "push-up-line", text: "Keep a straight line from head to heels and avoid sagging in the lower back." },
    { id: "push-up-elbows", text: "Keep your elbows at a 45-degree angle from your body as you lower down." },
    { id: "push-up-depth", text: "Lower until your chest is close to the floor without collapsing your shoulders." },
  ],
  squat: [
    { id: "squat-feet", text: "Stand with your feet about shoulder-width apart and point your toes slightly outward." },
    { id: "squat-knees", text: "Track your knees over your toes and avoid letting them collapse inward." },
    { id: "squat-depth", text: "Sit back into the movement and drop until your thighs are at least parallel to the floor." },
  ],
  "sit-up": [
    { id: "sit-up-posture", text: "Keep your neck neutral and curl your torso up without jerking." },
    { id: "sit-up-control", text: "Lower with control and keep your lower back from over-arching." },
  ],
  "pull-up": [
    { id: "pull-up-shoulders", text: "Begin from a full hang with shoulders engaged and scapula retracted." },
    { id: "pull-up-path", text: "Pull the bar to chest level and avoid swinging your body for momentum." },
    { id: "pull-up-chin", text: "Finish the rep with your chin clearing the bar and lower back under control." },
  ],
  lunge: [
    { id: "lunge-stance", text: "Keep your torso tall and your feet planted in a strong split stance." },
    { id: "lunge-depth", text: "Lower until both knees are bent with control and the front knee tracks over the toes." },
  ],
};

export async function fetchExerciseRules(exerciseId) {
  const supportedSet = new Set(["push-up", "squat"]);
  if (!exerciseId || !supportedSet.has(exerciseId)) {
    return [];
  }

  if (CENTRAL_EXERCISE_RULES && CENTRAL_EXERCISE_RULES[exerciseId]) {
    return CENTRAL_EXERCISE_RULES[exerciseId];
  }

  return EXERCISE_RULES[exerciseId] || [];
}
