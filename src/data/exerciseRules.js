export const exerciseRules = {
  "push-up": {
    analyzer: "push-up",
    type: "repetition",
    requiredLandmarks: ["left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_hip", "right_hip"],
    guidance: "Keep your shoulders, elbows, wrists and hips visible.",
    formRules: [
      { id: "hips_level", text: "Keep your hips level; avoid sagging or raising your butt.", severity: "medium" },
      { id: "elbow_range", text: "Aim for full elbow range of motion for each rep.", severity: "low" },
    ],
  },
  squat: {
    analyzer: "squat",
    type: "repetition",
    requiredLandmarks: ["left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle"],
    guidance: "Keep your hips, knees and feet visible.",
    formRules: [
      { id: "depth", text: "Reach at least parallel thigh depth for better activation.", severity: "medium" },
      { id: "knee_tracking", text: "Keep knees tracking over toes; avoid inward collapse.", severity: "high" },
    ],
  },
  "sit-up": {
    analyzer: "sit-up",
    type: "repetition",
    requiredLandmarks: ["left_shoulder", "right_shoulder", "left_hip", "right_hip", "left_knee", "right_knee"],
    guidance: "Keep your shoulders, hips and knees visible while you curl up.",
    formRules: [
      { id: "torso_control", text: "Lift your shoulders with a controlled torso curl instead of jerking your neck.", severity: "medium" },
      { id: "lower_back", text: "Keep your lower back neutral and avoid excessive arching.", severity: "high" },
    ],
  },
  "pull-up": {
    analyzer: "pull-up",
    type: "repetition",
    requiredLandmarks: ["left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist"],
    guidance: "Keep your shoulders, elbows and wrists visible as you pull.",
    formRules: [
      { id: "full_range", text: "Pull through a full range of motion without using momentum.", severity: "medium" },
      { id: "scapular_control", text: "Keep your shoulders engaged and avoid swinging your body.", severity: "high" },
    ],
  },
};
