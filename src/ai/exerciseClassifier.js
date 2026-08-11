import { calculateAngle } from "./angleCalculator.js";

const MIN_VISIBILITY = 0.22;
const SWITCH_FRAMES = 4;
const UNKNOWN_THRESHOLD = 0.36;
const HISTORY_LENGTH = 8;

function getLandmarkConfidence(landmark) {
  if (!landmark) return 0;
  return typeof landmark.visibility === "number" ? landmark.visibility : 1;
}

function isVisible(landmark) {
  return Boolean(landmark && typeof landmark.x === "number" && typeof landmark.y === "number" && getLandmarkConfidence(landmark) >= MIN_VISIBILITY);
}

function average(values) {
  const valid = values.filter((value) => typeof value === "number");
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function distance(a, b) {
  if (!a || !b) return null;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function lineAngleDegrees(a, b) {
  if (!a || !b) return null;
  const radians = Math.atan2(b.y - a.y, b.x - a.x);
  let degrees = (radians * 180) / Math.PI;
  if (degrees < 0) degrees += 360;
  return degrees;
}

function verticalDeviation(a, b) {
  const angle = lineAngleDegrees(a, b);
  if (typeof angle !== "number") return null;
  return Math.min(Math.abs(angle - 90), Math.abs(angle - 270));
}

function hasVisibleSide(landmarks, sideKeys) {
  return sideKeys.every((key) => isVisible(landmarks?.[key]));
}

function hasLowerBodyLandmarks(landmarks) {
  const hips = ["left_hip", "right_hip"].filter((key) => isVisible(landmarks?.[key]));
  const leftLeg = hasVisibleSide(landmarks, ["left_knee", "left_ankle"]);
  const rightLeg = hasVisibleSide(landmarks, ["right_knee", "right_ankle"]);
  return hips.length >= 1 && (leftLeg || rightLeg);
}

function hasUpperBodyLandmarks(landmarks) {
  const shoulders = ["left_shoulder", "right_shoulder"].filter((key) => isVisible(landmarks?.[key]));
  const elbows = ["left_elbow", "right_elbow"].filter((key) => isVisible(landmarks?.[key]));
  const wrists = ["left_wrist", "right_wrist"].filter((key) => isVisible(landmarks?.[key]));
  const hips = ["left_hip", "right_hip"].filter((key) => isVisible(landmarks?.[key]));
  return shoulders.length >= 1 && elbows.length >= 1 && wrists.length >= 1 && hips.length >= 1;
}

function getBodyHeight(landmarks) {
  const shoulderY = average([landmarks.left_shoulder?.y, landmarks.right_shoulder?.y]);
  const ankleY = average([landmarks.left_ankle?.y, landmarks.right_ankle?.y]);
  if (typeof shoulderY !== "number" || typeof ankleY !== "number") return 1;
  return Math.max(ankleY - shoulderY, 0.2);
}

function computeSquatFeatures(landmarks) {
  const leftKneeAngle = calculateAngle(landmarks.left_hip, landmarks.left_knee, landmarks.left_ankle);
  const rightKneeAngle = calculateAngle(landmarks.right_hip, landmarks.right_knee, landmarks.right_ankle);
  const leftHipAngle = calculateAngle(landmarks.left_shoulder, landmarks.left_hip, landmarks.left_knee);
  const rightHipAngle = calculateAngle(landmarks.right_shoulder, landmarks.right_hip, landmarks.right_knee);
  const torsoLeft = verticalDeviation(landmarks.left_shoulder, landmarks.left_hip);
  const torsoRight = verticalDeviation(landmarks.right_shoulder, landmarks.right_hip);
  const hipLeft = verticalDeviation(landmarks.left_hip, landmarks.left_knee);
  const hipRight = verticalDeviation(landmarks.right_hip, landmarks.right_knee);
  const shoulderY = average([landmarks.left_shoulder?.y, landmarks.right_shoulder?.y]);
  const hipY = average([landmarks.left_hip?.y, landmarks.right_hip?.y]);
  const kneeY = average([landmarks.left_knee?.y, landmarks.right_knee?.y]);
  const bodyHeight = getBodyHeight(landmarks);

  return {
    avgKneeAngle: average([leftKneeAngle, rightKneeAngle]),
    avgHipAngle: average([leftHipAngle, rightHipAngle]),
    torsoVertical: average([torsoLeft, torsoRight]),
    hipVertical: average([hipLeft, hipRight]),
    kneeAngleDiff: Math.abs((leftKneeAngle || 0) - (rightKneeAngle || 0)),
    hipAngleDiff: Math.abs((leftHipAngle || 0) - (rightHipAngle || 0)),
    hipBelowShoulder: Math.max(0, hipY - shoulderY),
    bodyHeight,
    hipY,
    shoulderY,
    kneeY,
  };
}

function computePushUpFeatures(landmarks) {
  const leftElbowAngle = calculateAngle(landmarks.left_shoulder, landmarks.left_elbow, landmarks.left_wrist);
  const rightElbowAngle = calculateAngle(landmarks.right_shoulder, landmarks.right_elbow, landmarks.right_wrist);
  const leftHipAngle = calculateAngle(landmarks.left_shoulder, landmarks.left_hip, landmarks.left_knee);
  const rightHipAngle = calculateAngle(landmarks.right_shoulder, landmarks.right_hip, landmarks.right_knee);
  const torsoLeft = verticalDeviation(landmarks.left_shoulder, landmarks.left_hip);
  const torsoRight = verticalDeviation(landmarks.right_shoulder, landmarks.right_hip);
  const hipLeft = verticalDeviation(landmarks.left_hip, landmarks.left_knee);
  const hipRight = verticalDeviation(landmarks.right_hip, landmarks.right_knee);
  const shoulderY = average([landmarks.left_shoulder?.y, landmarks.right_shoulder?.y]);
  const hipY = average([landmarks.left_hip?.y, landmarks.right_hip?.y]);
  const bodyHeight = getBodyHeight(landmarks);

  return {
    avgElbowAngle: average([leftElbowAngle, rightElbowAngle]),
    avgHipAngle: average([leftHipAngle, rightHipAngle]),
    torsoVertical: average([torsoLeft, torsoRight]),
    hipVertical: average([hipLeft, hipRight]),
    avgShoulderHipYDiff: Math.abs(shoulderY - hipY),
    bodyHeight,
    shoulderY,
    hipY,
  };
}

function computeLungeFeatures(landmarks) {
  const leftKneeAngle = calculateAngle(landmarks.left_hip, landmarks.left_knee, landmarks.left_ankle);
  const rightKneeAngle = calculateAngle(landmarks.right_hip, landmarks.right_knee, landmarks.right_ankle);
  const torsoLeft = verticalDeviation(landmarks.left_shoulder, landmarks.left_hip);
  const torsoRight = verticalDeviation(landmarks.right_shoulder, landmarks.right_hip);
  const leftHipY = landmarks.left_hip?.y;
  const rightHipY = landmarks.right_hip?.y;

  return {
    avgKneeAngle: average([leftKneeAngle, rightKneeAngle]),
    kneeAngleDiff: Math.abs((leftKneeAngle || 0) - (rightKneeAngle || 0)),
    torsoVertical: average([torsoLeft, torsoRight]),
    hipHeightDiff: Math.abs((leftHipY || 0) - (rightHipY || 0)),
  };
}

function computeCurlFeatures(landmarks) {
  const leftElbowAngle = calculateAngle(landmarks.left_shoulder, landmarks.left_elbow, landmarks.left_wrist);
  const rightElbowAngle = calculateAngle(landmarks.right_shoulder, landmarks.right_elbow, landmarks.right_wrist);
  const leftWristY = landmarks.left_wrist?.y;
  const rightWristY = landmarks.right_wrist?.y;
  const leftShoulderY = landmarks.left_shoulder?.y;
  const rightShoulderY = landmarks.right_shoulder?.y;
  const leftElbowX = landmarks.left_elbow?.x;
  const rightElbowX = landmarks.right_elbow?.x;
  const leftShoulderX = landmarks.left_shoulder?.x;
  const rightShoulderX = landmarks.right_shoulder?.x;

  return {
    avgElbowAngle: average([leftElbowAngle, rightElbowAngle]),
    avgWristY: average([leftWristY, rightWristY]),
    avgShoulderY: average([leftShoulderY, rightShoulderY]),
    avgElbowXDiff: Math.abs((leftElbowX || 0) - (leftShoulderX || 0)) + Math.abs((rightElbowX || 0) - (rightShoulderX || 0)),
  };
}

function computeShoulderPressFeatures(landmarks) {
  const leftArmAngle = calculateAngle(landmarks.left_elbow, landmarks.left_shoulder, landmarks.left_hip);
  const rightArmAngle = calculateAngle(landmarks.right_elbow, landmarks.right_shoulder, landmarks.right_hip);
  const leftWristY = landmarks.left_wrist?.y;
  const rightWristY = landmarks.right_wrist?.y;
  const leftShoulderY = landmarks.left_shoulder?.y;
  const rightShoulderY = landmarks.right_shoulder?.y;

  return {
    avgArmAngle: average([leftArmAngle, rightArmAngle]),
    avgWristAboveShoulder: (leftWristY != null && rightWristY != null && leftShoulderY != null && rightShoulderY != null)
      ? ((leftWristY < leftShoulderY ? 1 : 0) + (rightWristY < rightShoulderY ? 1 : 0)) / 2
      : 0,
    torsoVertical: average([
      verticalDeviation(landmarks.left_shoulder, landmarks.left_hip),
      verticalDeviation(landmarks.right_shoulder, landmarks.right_hip),
    ]),
  };
}

function computeSquatScore(landmarks) {
  if (!hasLowerBodyLandmarks(landmarks)) return 0;
  const features = computeSquatFeatures(landmarks);
  if (features.avgKneeAngle == null || features.hipRelative == null) return 0;

  const kneeBend = clamp((170 - features.avgKneeAngle) / 45, 0, 1);
  const hipDepth = clamp((features.hipRelative - 0.38) / 0.35, 0, 1);
  const torsoScore = clamp((40 - features.torsoVertical) / 50, 0, 1);
  const stability = clamp(1 - features.kneeAngleDiff / 50, 0, 1);

  return clamp(kneeBend * 0.5 + hipDepth * 0.25 + torsoScore * 0.15 + stability * 0.1, 0, 1);
}

function computePushUpScore(landmarks) {
  if (!hasUpperBodyLandmarks(landmarks)) return 0;
  const features = computePushUpFeatures(landmarks);
  if (features.avgElbowAngle == null || features.torsoVertical == null) return 0;

  const elbowBend = clamp((170 - features.avgElbowAngle) / 80, 0, 1);
  const torsoScore = clamp((30 - features.torsoVertical) / 40, 0, 1);
  const hipScore = clamp((30 - features.hipVertical) / 40, 0, 1);
  const shoulderHipLevel = clamp(1 - features.avgShoulderHipYDiff / 0.16, 0, 1);

  return clamp(elbowBend * 0.45 + torsoScore * 0.25 + hipScore * 0.2 + shoulderHipLevel * 0.1, 0, 1);
}

function computeLungeScore(landmarks) {
  if (!hasLowerBodyLandmarks(landmarks)) return 0;
  const features = computeLungeFeatures(landmarks);
  if (features.kneeAngleDiff == null || features.torsoVertical == null) return 0;

  const diffScore = clamp((features.kneeAngleDiff - 20) / 50, 0, 1);
  const deepScore = clamp((150 - Math.min(features.avgKneeAngle || 180, 180)) / 60, 0, 1);
  const torsoScore = clamp((40 - features.torsoVertical) / 40, 0, 1);
  const hipHeightScore = clamp(features.hipHeightDiff / 0.1, 0, 1);

  return clamp(diffScore * 0.5 + deepScore * 0.25 + torsoScore * 0.15 + hipHeightScore * 0.1, 0, 1);
}

function computeBicepCurlScore(landmarks) {
  if (!hasUpperBodyLandmarks(landmarks)) return 0;
  const features = computeCurlFeatures(landmarks);
  if (features.avgElbowAngle == null) return 0;

  const elbowBend = clamp((140 - features.avgElbowAngle) / 80, 0, 1);
  const elbowBySide = clamp(1 - features.avgElbowXDiff / 0.25, 0, 1);
  const wristPosition = clamp((features.avgWristY - features.avgShoulderY) / 0.35, 0, 1);

  return clamp(elbowBend * 0.5 + elbowBySide * 0.3 + wristPosition * 0.2, 0, 1);
}

function computeShoulderPressScore(landmarks) {
  if (!hasUpperBodyLandmarks(landmarks)) return 0;
  const features = computeShoulderPressFeatures(landmarks);
  if (features.avgArmAngle == null) return 0;

  const armVertical = clamp((features.avgArmAngle - 120) / 60, 0, 1);
  const wristAbove = features.avgWristAboveShoulder;
  const torsoScore = clamp((40 - features.torsoVertical) / 40, 0, 1);

  return clamp(armVertical * 0.45 + wristAbove * 0.35 + torsoScore * 0.2, 0, 1);
}

export function createExerciseClassifierState() {
  return {
    lastDetected: "unknown",
    lastRaw: "unknown",
    consecutiveRaw: 0,
    frameHistory: [],
  };
}

export function classifyExerciseLandmarks(landmarks, previousState = createExerciseClassifierState()) {
  const state = {
    ...previousState,
    frameHistory: Array.isArray(previousState.frameHistory) ? [...previousState.frameHistory] : [],
  };

  if (!landmarks) {
    return {
      exercise: state.lastDetected || "unknown",
      confidence: 0,
      rawExercise: "unknown",
      rawConfidence: 0,
      state,
    };
  }

  const scores = {
    squat: computeSquatScore(landmarks),
    "push-up": computePushUpScore(landmarks),
    lunge: computeLungeScore(landmarks),
    "bicep-curl": computeBicepCurlScore(landmarks),
    "shoulder-press": computeShoulderPressScore(landmarks),
  };

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  let [rawExercise, rawConfidence] = sorted[0];

  if (rawConfidence < UNKNOWN_THRESHOLD) {
    rawExercise = "unknown";
    rawConfidence = 0.28;
  }

  if (rawExercise === state.lastRaw) {
    state.consecutiveRaw += 1;
  } else {
    state.consecutiveRaw = 1;
  }

  state.lastRaw = rawExercise;

  let detectedExercise = state.lastDetected || "unknown";
  if (rawExercise !== detectedExercise && state.consecutiveRaw >= SWITCH_FRAMES) {
    detectedExercise = rawExercise;
  }

  const confidence = rawExercise === detectedExercise ? rawConfidence : Math.max(rawConfidence * 0.68, 0.18);

  state.lastDetected = detectedExercise;

  const rawFeatures = {
    exercise: rawExercise,
    score: rawConfidence,
    timestamp: Date.now(),
  };
  state.frameHistory.push(rawFeatures);
  if (state.frameHistory.length > HISTORY_LENGTH) {
    state.frameHistory.shift();
  }

  return {
    exercise: detectedExercise,
    confidence,
    rawExercise,
    rawConfidence,
    state,
  };
}
