import { calculateAngle } from "./angleCalculator.js";

const jointMap = {
  knee: ["left_hip", "left_knee", "left_ankle"],
  elbow: ["left_shoulder", "left_elbow", "left_wrist"],
  hip: ["left_shoulder", "left_hip", "left_knee"],
  shoulder: ["left_elbow", "left_shoulder", "left_hip"],
};

function getJointAngle(landmarks, joint) {
  const keys = jointMap[joint];
  if (!keys) return null;

  const points = keys.map((key) => landmarks?.[key] || null);
  if (points.some((point) => !point)) return null;

  return calculateAngle(points[0], points[1], points[2]);
}

export function evaluateRules(landmarks, rules) {
  const feedback = [];
  let passedCount = 0;

  rules.forEach((rule) => {
    const jointAngle = getJointAngle(landmarks, rule.joint);
    const passed =
      jointAngle != null &&
      (rule.min_angle == null || jointAngle >= rule.min_angle) &&
      (rule.max_angle == null || jointAngle <= rule.max_angle);

    if (passed) {
      passedCount += 1;
      feedback.push({ type: rule.severity || "success", message: rule.feedback });
      return;
    }

    const warningMessage = rule.feedback || `Adjust your ${rule.joint}`;
    feedback.push({ type: rule.severity || "warning", message: warningMessage });
  });

  const score = rules.length ? Math.round((passedCount / rules.length) * 100) : 100;

  return {
    score,
    feedback,
    passed: passedCount === rules.length,
  };
}
