import { calculateAngle } from "./angleCalculator.js";

// Safety helpers to prevent NaN/Infinity/undefined entering analyzer state
function isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function safeSubtract(a, b) {
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) return null;
  const v = a - b;
  return Number.isFinite(v) ? v : null;
}

function safeDivide(a, b) {
  if (!isFiniteNumber(a) || !isFiniteNumber(b) || b === 0) return null;
  const v = a / b;
  return Number.isFinite(v) ? v : null;
}

function safeClamp(value, min, max) {
  if (!isFiniteNumber(value)) return null;
  return Math.min(Math.max(value, min), max);
}

function applySmoothing(prev, raw, alpha) {
  if (isFiniteNumber(raw)) {
    if (isFiniteNumber(prev)) return alpha * raw + (1 - alpha) * prev;
    return raw;
  }
  // keep previous valid value if raw is invalid
  return isFiniteNumber(prev) ? prev : null;
}

const DEBUG_SQUAT = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const MIN_VISIBILITY = 0.30;
const REP_COOLDOWN_FRAMES = 12;
const MOVEMENT_FRAMES = 6;

const DEFAULT_STATE = {
  exerciseId: null,
  phase: "idle",
  phaseFrames: 0,
  lastHipRelative: null,
  lastKneeAngle: null,
  lastElbowAngle: null,
  lastShoulderY: null,
  lastHipY: null,
  lastBodyY: null,
  minHipRelative: 1,
  maxHipRelative: 0,
  minKneeAngle: 180,
  maxKneeAngle: 0,
  minElbowAngle: 180,
  maxElbowAngle: 0,
  repCooldown: 0,
  repPending: false,
  smoothedHipRelative: null,
  smoothedKneeAngle: null,
  smoothedElbowAngle: null,
  smoothedShoulderY: null,
  smoothedHipY: null,
  debug: {},
};

const squatRules = {
  standingHipRelative: 0.62,
  bottomHipRelative: 0.57,
  descentThreshold: 0.02,
  ascentThreshold: 0.035,
  kneeBendThreshold: 145,
  repCooldown: REP_COOLDOWN_FRAMES,
};

const pushUpRules = {
  topElbowThreshold: 140,
  bottomElbowThreshold: 102,
  torsoVerticalThreshold: 30,
  hipVerticalThreshold: 28,
  descentAngleDelta: 18,
  ascentAngleDelta: 12,
  repCooldown: REP_COOLDOWN_FRAMES,
};

export function createDefaultAnalysisState(exerciseId) {
  return {
    ...DEFAULT_STATE,
    exerciseId,
  };
}

function getLandmarkConfidence(landmark) {
  if (!landmark) return 0;
  return typeof landmark.visibility === "number" ? landmark.visibility : 1;
}

function isVisibleLandmark(landmark) {
  return Boolean(
    landmark &&
    typeof landmark.x === "number" &&
    typeof landmark.y === "number" &&
    getLandmarkConfidence(landmark) >= MIN_VISIBILITY
  );
}

function hasMinimalSquatLandmarks(landmarks) {
  const leftLeg = ["left_hip", "left_knee", "left_ankle"].every((key) => isVisibleLandmark(landmarks?.[key]));
  const rightLeg = ["right_hip", "right_knee", "right_ankle"].every((key) => isVisibleLandmark(landmarks?.[key]));
  return leftLeg || rightLeg;
}

function hasMinimalPushUpLandmarks(landmarks) {
  const leftArm = ["left_shoulder", "left_elbow", "left_wrist"].every((key) => isVisibleLandmark(landmarks?.[key]));
  const rightArm = ["right_shoulder", "right_elbow", "right_wrist"].every((key) => isVisibleLandmark(landmarks?.[key]));
  const hips = ["left_hip", "right_hip"].some((key) => isVisibleLandmark(landmarks?.[key]));
  return (leftArm || rightArm) && hips;
}

function hasExerciseLandmarks(exerciseId, landmarks) {
  const normalized = String(exerciseId || "").toLowerCase();
  if (normalized === "squat") {
    return hasMinimalSquatLandmarks(landmarks);
  }
  if (normalized === "push-up") {
    return hasMinimalPushUpLandmarks(landmarks);
  }
  if (normalized === "sit-up") {
    return Boolean(landmarks && (isVisibleLandmark(landmarks.left_shoulder) || isVisibleLandmark(landmarks.right_shoulder)) && (isVisibleLandmark(landmarks.left_hip) || isVisibleLandmark(landmarks.right_hip)) && (isVisibleLandmark(landmarks.left_knee) || isVisibleLandmark(landmarks.right_knee)));
  }
  if (normalized === "pull-up") {
    return Boolean(landmarks && (isVisibleLandmark(landmarks.left_shoulder) || isVisibleLandmark(landmarks.right_shoulder)) && (isVisibleLandmark(landmarks.left_elbow) || isVisibleLandmark(landmarks.right_elbow)) && (isVisibleLandmark(landmarks.left_wrist) || isVisibleLandmark(landmarks.right_wrist)));
  }
  if (normalized === "lunge") {
    return hasMinimalSquatLandmarks(landmarks);
  }
  return false;
}

function hasRequiredLandmarksFromRules(rulesEntry, landmarks) {
  if (!rulesEntry) return false;
  const required = Array.isArray(rulesEntry) ? null : rulesEntry.requiredLandmarks || null;
  // If legacy array of rules passed, no structured required landmarks available
  if (!required || !required.length) return null;

  // Group by base name removing left_/right_ prefixes when applicable
  const groups = {};
  required.forEach((key) => {
    const base = key.replace(/^(left_|right_)/, "");
    groups[base] = groups[base] || [];
    groups[base].push(key);
  });

  // For each base group, require that at least one of the side-specific landmarks be visible
  const missing = [];
  const visible = [];
  Object.entries(groups).forEach(([base, variants]) => {
    const ok = variants.some((k) => isVisibleLandmark(landmarks?.[k]));
    if (ok) {
      visible.push(...variants.filter((k) => isVisibleLandmark(landmarks?.[k])));
    } else {
      missing.push(...variants);
    }
  });

  return { ok: missing.length === 0, missing, visible };
}

function formatLandmark(landmark) {
  if (!landmark) return "n/a";
  return `${landmark.x.toFixed(2)}, ${landmark.y.toFixed(2)}`;
}

function average(values) {
  const valid = values.filter((value) => typeof value === "number");
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

function horizontalDistance(a, b) {
  if (!a || !b) return null;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function computeSquatMetrics(landmarks) {
  const leftKnee = calculateAngle(landmarks.left_hip, landmarks.left_knee, landmarks.left_ankle);
  const rightKnee = calculateAngle(landmarks.right_hip, landmarks.right_knee, landmarks.right_ankle);
  const leftHip = calculateAngle(landmarks.left_shoulder, landmarks.left_hip, landmarks.left_knee);
  const rightHip = calculateAngle(landmarks.right_shoulder, landmarks.right_hip, landmarks.right_knee);

  const torsoLeft = verticalDeviation(landmarks.left_shoulder, landmarks.left_hip);
  const torsoRight = verticalDeviation(landmarks.right_shoulder, landmarks.right_hip);
  const hipLeft = verticalDeviation(landmarks.left_hip, landmarks.left_knee);
  const hipRight = verticalDeviation(landmarks.right_hip, landmarks.right_knee);

  const shoulderY = average([landmarks.left_shoulder?.y, landmarks.right_shoulder?.y]);
  const hipY = average([landmarks.left_hip?.y, landmarks.right_hip?.y]);
  const ankleY = average([landmarks.left_ankle?.y, landmarks.right_ankle?.y]);
  const approxBodyHeight = isFiniteNumber(ankleY) && isFiniteNumber(shoulderY) ? safeSubtract(ankleY, shoulderY) : null;
  const bodyHeight = isFiniteNumber(approxBodyHeight) ? Math.max(approxBodyHeight, 0.15) : 0.15;
  const hipRelative = (isFiniteNumber(hipY) && isFiniteNumber(shoulderY)) ? safeClamp(safeDivide(safeSubtract(hipY, shoulderY), bodyHeight) ?? null, 0, 1) : null;

  return {
    avgKneeAngle: average([leftKnee, rightKnee]),
    avgHipAngle: average([leftHip, rightHip]),
    kneeAngleDiff: (isFiniteNumber(leftKnee) && isFiniteNumber(rightKnee)) ? Math.abs(leftKnee - rightKnee) : null,
    hipAngleDiff: (isFiniteNumber(leftHip) && isFiniteNumber(rightHip)) ? Math.abs(leftHip - rightHip) : null,
    torsoVertical: average([torsoLeft, torsoRight]),
    hipVertical: average([hipLeft, hipRight]),
    hipRelative,
    bodyHeight,
    leftKnee,
    rightKnee,
    leftHip,
    rightHip,
    leftHipPos: landmarks.left_hip,
    rightHipPos: landmarks.right_hip,
    leftKneePos: landmarks.left_knee,
    rightKneePos: landmarks.right_knee,
    leftAnklePos: landmarks.left_ankle,
    rightAnklePos: landmarks.right_ankle,
  };
}

function computePushUpMetrics(landmarks) {
  const leftElbow = calculateAngle(landmarks.left_shoulder, landmarks.left_elbow, landmarks.left_wrist);
  const rightElbow = calculateAngle(landmarks.right_shoulder, landmarks.right_elbow, landmarks.right_wrist);
  const leftHip = calculateAngle(landmarks.left_shoulder, landmarks.left_hip, landmarks.left_knee);
  const rightHip = calculateAngle(landmarks.right_shoulder, landmarks.right_hip, landmarks.right_knee);

  const torsoLeft = verticalDeviation(landmarks.left_shoulder, landmarks.left_hip);
  const torsoRight = verticalDeviation(landmarks.right_shoulder, landmarks.right_hip);
  const hipLeft = verticalDeviation(landmarks.left_hip, landmarks.left_knee);
  const hipRight = verticalDeviation(landmarks.right_hip, landmarks.right_knee);

  const shoulderY = average([landmarks.left_shoulder?.y, landmarks.right_shoulder?.y]);
  const hipY = average([landmarks.left_hip?.y, landmarks.right_hip?.y]);
  const ankleY = average([landmarks.left_ankle?.y, landmarks.right_ankle?.y]);
  const approxBodyHeight = isFiniteNumber(ankleY) && isFiniteNumber(shoulderY) ? safeSubtract(ankleY, shoulderY) : null;
  const bodyHeight = isFiniteNumber(approxBodyHeight) ? Math.max(approxBodyHeight, 0.15) : 0.15;
  const shoulderRelative = (isFiniteNumber(shoulderY) && isFiniteNumber(landmarks.left_shoulder?.y)) ? safeClamp(safeDivide(safeSubtract(shoulderY, landmarks.left_shoulder?.y), bodyHeight) ?? null, 0, 1) : null;

  return {
    avgElbowAngle: average([leftElbow, rightElbow]),
    avgHipAngle: average([leftHip, rightHip]),
    elbowAngleDiff: Math.abs((leftElbow || 0) - (rightElbow || 0)),
    hipAngleDiff: Math.abs((leftHip || 0) - (rightHip || 0)),
    torsoVertical: average([torsoLeft, torsoRight]),
    hipVertical: average([hipLeft, hipRight]),
    shoulderY,
    hipY,
    bodyHeight,
    leftElbow,
    rightElbow,
    leftShoulder: landmarks.left_shoulder,
    rightShoulder: landmarks.right_shoulder,
  };
}

function computeBicepCurlMetrics(landmarks) {
  const leftElbow = calculateAngle(landmarks.left_shoulder, landmarks.left_elbow, landmarks.left_wrist);
  const rightElbow = calculateAngle(landmarks.right_shoulder, landmarks.right_elbow, landmarks.right_wrist);
  const leftShoulderY = isFiniteNumber(landmarks.left_shoulder?.y) ? landmarks.left_shoulder.y : null;
  const rightShoulderY = isFiniteNumber(landmarks.right_shoulder?.y) ? landmarks.right_shoulder.y : null;

  return {
    avgElbowAngle: average([leftElbow, rightElbow]),
    leftElbow: isFiniteNumber(leftElbow) ? leftElbow : null,
    rightElbow: isFiniteNumber(rightElbow) ? rightElbow : null,
    leftShoulderY,
    rightShoulderY,
  };
}

function computeShoulderPressMetrics(landmarks) {
  const leftElbow = calculateAngle(landmarks.left_shoulder, landmarks.left_elbow, landmarks.left_wrist);
  const rightElbow = calculateAngle(landmarks.right_shoulder, landmarks.right_elbow, landmarks.right_wrist);
  const leftWristY = isFiniteNumber(landmarks.left_wrist?.y) ? landmarks.left_wrist.y : null;
  const rightWristY = isFiniteNumber(landmarks.right_wrist?.y) ? landmarks.right_wrist.y : null;
  const leftShoulderY = isFiniteNumber(landmarks.left_shoulder?.y) ? landmarks.left_shoulder.y : null;
  const rightShoulderY = isFiniteNumber(landmarks.right_shoulder?.y) ? landmarks.right_shoulder.y : null;

  return {
    avgElbowAngle: average([leftElbow, rightElbow]),
    leftElbow: isFiniteNumber(leftElbow) ? leftElbow : null,
    rightElbow: isFiniteNumber(rightElbow) ? rightElbow : null,
    leftWristY,
    rightWristY,
    leftShoulderY,
    rightShoulderY,
  };
}

function computeLateralRaiseMetrics(landmarks) {
  const leftWristY = isFiniteNumber(landmarks.left_wrist?.y) ? landmarks.left_wrist.y : null;
  const rightWristY = isFiniteNumber(landmarks.right_wrist?.y) ? landmarks.right_wrist.y : null;
  const leftShoulderY = isFiniteNumber(landmarks.left_shoulder?.y) ? landmarks.left_shoulder.y : null;
  const rightShoulderY = isFiniteNumber(landmarks.right_shoulder?.y) ? landmarks.right_shoulder.y : null;

  const leftDiff = (isFiniteNumber(leftShoulderY) && isFiniteNumber(leftWristY)) ? leftShoulderY - leftWristY : null;
  const rightDiff = (isFiniteNumber(rightShoulderY) && isFiniteNumber(rightWristY)) ? rightShoulderY - rightWristY : null;

  return {
    leftWristY,
    rightWristY,
    leftShoulderY,
    rightShoulderY,
    avgWristAboveShoulder: average([leftDiff, rightDiff]),
  };
}

function computeSitUpMetrics(landmarks) {
  const leftShoulder = landmarks.left_shoulder;
  const rightShoulder = landmarks.right_shoulder;
  const leftHip = landmarks.left_hip;
  const rightHip = landmarks.right_hip;
  const leftKnee = landmarks.left_knee;
  const rightKnee = landmarks.right_knee;

  const shoulderY = average([leftShoulder?.y, rightShoulder?.y]);
  const hipY = average([leftHip?.y, rightHip?.y]);
  const kneeY = average([leftKnee?.y, rightKnee?.y]);
  const torsoDistance = isFiniteNumber(shoulderY) && isFiniteNumber(hipY) ? Math.abs(shoulderY - hipY) : null;
  const kneeDistance = isFiniteNumber(hipY) && isFiniteNumber(kneeY) ? Math.abs(kneeY - hipY) : null;

  return {
    shoulderY,
    hipY,
    kneeY,
    torsoDistance,
    kneeDistance,
    avgHipKneeAngle: average([
      calculateAngle(landmarks.left_shoulder, landmarks.left_hip, landmarks.left_knee),
      calculateAngle(landmarks.right_shoulder, landmarks.right_hip, landmarks.right_knee),
    ]),
  };
}

function computePullUpMetrics(landmarks) {
  const leftElbow = calculateAngle(landmarks.left_shoulder, landmarks.left_elbow, landmarks.left_wrist);
  const rightElbow = calculateAngle(landmarks.right_shoulder, landmarks.right_elbow, landmarks.right_wrist);
  const shoulderY = average([landmarks.left_shoulder?.y, landmarks.right_shoulder?.y]);
  const wristY = average([landmarks.left_wrist?.y, landmarks.right_wrist?.y]);

  return {
    avgElbowAngle: average([leftElbow, rightElbow]),
    shoulderY,
    wristY,
    wristBelowShoulder: isFiniteNumber(shoulderY) && isFiniteNumber(wristY) ? shoulderY - wristY : null,
  };
}

function computePlankMetrics(landmarks) {
  const torsoLeft = verticalDeviation(landmarks.left_shoulder, landmarks.left_hip);
  const torsoRight = verticalDeviation(landmarks.right_shoulder, landmarks.right_hip);
  const hipLeft = verticalDeviation(landmarks.left_hip, landmarks.left_knee);
  const hipRight = verticalDeviation(landmarks.right_hip, landmarks.right_knee);

  return {
    torsoVertical: average([torsoLeft, torsoRight]),
    hipVertical: average([hipLeft, hipRight]),
    leftShoulder: landmarks.left_shoulder || null,
    rightShoulder: landmarks.right_shoulder || null,
    leftHip: landmarks.left_hip || null,
    rightHip: landmarks.right_hip || null,
    leftAnkle: landmarks.left_ankle || null,
    rightAnkle: landmarks.right_ankle || null,
  };
}

function describeSquatFeedback(metrics, state) {
  const messages = [];
  if (state.phase === "idle" || state.phase === "ready") {
    if (metrics.avgKneeAngle < 155) {
      messages.push("Stand tall with your feet shoulder-width apart and keep your shoulders over your hips.");
    }
  }

  if (state.phase === "descending") {
    messages.push("Lower with control and aim to get your thighs at least parallel to the floor.");
  }

  if (state.phase === "bottom") {
    messages.push("Hold the bottom of the squat briefly, then push back up with control.");
  }

  if (state.phase === "ascending") {
    messages.push("Drive through your heels and keep your chest lifted as you stand up.");
  }

  if (metrics.minAngle > 105) {
    messages.push("Go deeper into the squat until your thighs are close to parallel.");
  }

  if (metrics.kneeAngleDiff > 14) {
    messages.push("Keep your knees tracking evenly and avoid letting one knee collapse inward.");
  }

  if (metrics.torsoVertical > 24) {
    messages.push("Keep your torso more upright and maintain a strong chest position.");
  }

  if (messages.length === 0) {
    messages.push("Focus on a controlled squat: descend, pause, and rise while maintaining alignment.");
  }

  return messages;
}

function describePushUpFeedback(metrics, state) {
  const messages = [];
  if (state.phase === "idle" || state.phase === "ready") {
    if (metrics.avgElbowAngle < 160 || metrics.hipVertical > 25) {
      messages.push("Start in a strong plank with shoulders over wrists and hips level.");
    }
  }

  if (state.phase === "descending") {
    messages.push("Lower your chest with control rather than just moving your arms.");
  }

  if (state.phase === "bottom") {
    messages.push("Keep your body straight and push back up while keeping your hips level.");
  }

  if (state.phase === "ascending") {
    messages.push("Push the floor away and return to the top plank position with control.");
  }

  if (metrics.avgElbowAngle > 110 && state.phase === "bottom") {
    messages.push("Bend your elbows more so your chest reaches a deeper push-up position.");
  }

  if (metrics.hipVertical > 25) {
    messages.push("Keep your hips level and avoid sagging or raising your butt.");
  }

  if (messages.length === 0) {
    messages.push("Focus on a controlled push-up: plank, lower, and then rise back to a strong top position.");
  }

  return messages;
}

function computeSquatScore(metrics) {
  if (!metrics.hasConfidence) return 0;
  const depthScore = clamp((110 - metrics.minAngle) * 0.75, 0, 35);
  const alignmentScore = clamp(25 - metrics.torsoVertical, 0, 25);
  const symmetryScore = clamp(15 - metrics.kneeAngleDiff * 0.5, 0, 15);
  const hipScore = clamp(20 - metrics.hipVertical, 0, 20);
  const controlScore = clamp(metrics.phase === "bottom" || metrics.phase === "ascending" ? 15 : 8, 0, 15);
  return Math.round(clamp(depthScore + alignmentScore + symmetryScore + hipScore + controlScore, 0, 100));
}

function computePushUpScore(metrics) {
  if (!metrics.hasConfidence) return 0;
  const depthScore = clamp(35 - (metrics.avgElbowAngle - 85), 0, 35);
  const alignmentScore = clamp(25 - metrics.torsoVertical, 0, 25);
  const hipScore = clamp(20 - metrics.hipVertical, 0, 20);
  const symmetryScore = clamp(15 - metrics.elbowAngleDiff * 0.35, 0, 15);
  const controlScore = clamp(metrics.phase === "bottom" || metrics.phase === "ascending" ? 15 : 8, 0, 15);
  return Math.round(clamp(depthScore + alignmentScore + hipScore + symmetryScore + controlScore, 0, 100));
}

function updateSquatState(metrics, state) {
  const next = { ...state };
  let repIncrement = 0;
  const feedback = [];
  const smoothingAlpha = 0.35;

  const rawHipRelative = metrics.hipRelative;
  const rawKneeAngle = metrics.avgKneeAngle;
  const rawBodyY = average([metrics.leftHipPos?.y, metrics.rightHipPos?.y, metrics.leftKneePos?.y, metrics.rightKneePos?.y]);
  next.smoothedHipRelative = applySmoothing(next.smoothedHipRelative, rawHipRelative, smoothingAlpha);
  next.smoothedKneeAngle = applySmoothing(next.smoothedKneeAngle, rawKneeAngle, smoothingAlpha);
  next.smoothedHipY = applySmoothing(next.smoothedHipY, metrics.hipY, smoothingAlpha);

  const hipRelative = isFiniteNumber(next.smoothedHipRelative) ? next.smoothedHipRelative : null;
  const kneeAngle = isFiniteNumber(next.smoothedKneeAngle) ? next.smoothedKneeAngle : null;
  const hipY = isFiniteNumber(next.smoothedHipY) ? next.smoothedHipY : null;

  next.lastHipRelative = hipRelative;
  next.lastKneeAngle = kneeAngle;

  next.minHipRelative = Math.min(next.minHipRelative, isFiniteNumber(hipRelative) ? hipRelative : next.minHipRelative);
  next.maxHipRelative = Math.max(next.maxHipRelative, isFiniteNumber(hipRelative) ? hipRelative : next.maxHipRelative);
  next.minKneeAngle = Math.min(next.minKneeAngle, isFiniteNumber(kneeAngle) ? kneeAngle : next.minKneeAngle);
  next.maxKneeAngle = Math.max(next.maxKneeAngle, isFiniteNumber(kneeAngle) ? kneeAngle : next.maxKneeAngle);

  if (next.repCooldown > 0) {
    next.repCooldown -= 1;
  }

  const isReady = hipRelative !== null && isFiniteNumber(kneeAngle) && hipRelative < 0.34 && kneeAngle > 150;
  const isDescending = hipRelative !== null && hipRelative - next.maxHipRelative > squatRules.descentThreshold;
  const hasBottom = hipRelative !== null && hipRelative > squatRules.bottomHipRelative;
  const hasBend = kneeAngle !== null && kneeAngle < squatRules.kneeBendThreshold;
  const isAscending = hipRelative !== null && next.maxHipRelative - hipRelative > squatRules.ascentThreshold;

  if (next.phase === "idle" || next.phase === "untracked") {
    if (isReady) {
      next.phase = "ready";
      next.phaseFrames = 1;
      next.repPending = false;
    } else {
      next.phase = "idle";
      next.phaseFrames = 0;
    }
  } else if (next.phase === "ready") {
    if (isDescending && hasBend) {
      next.phase = "descending";
      next.phaseFrames = 1;
      next.repPending = true;
    } else if (isReady) {
      next.phaseFrames += 1;
    } else {
      next.phaseFrames = 0;
    }
  } else if (next.phase === "descending") {
    if (hasBottom) {
      next.phase = "bottom";
      next.phaseFrames = 1;
    } else if (isAscending) {
      next.phase = "ascending";
      next.phaseFrames = 1;
    } else {
      next.phaseFrames += 1;
    }
  } else if (next.phase === "bottom") {
    if (isAscending) {
      next.phase = "ascending";
      next.phaseFrames = 1;
    } else {
      next.phaseFrames += 1;
    }
  } else if (next.phase === "ascending") {
    if (isReady && next.repPending && next.repCooldown === 0) {
      repIncrement = 1;
      next.phase = "ready";
      next.phaseFrames = 1;
      next.repPending = false;
      next.minHipRelative = 1;
      next.maxHipRelative = 0;
      next.minKneeAngle = 180;
      next.maxKneeAngle = 0;
      next.repCooldown = squatRules.repCooldown;
    } else if (hasBottom) {
      next.phase = "bottom";
      next.phaseFrames = 1;
    } else {
      next.phaseFrames += 1;
    }
  }

  next.debug = {
    state: next.phase,
    hipRelative: hipRelative !== null ? hipRelative.toFixed(3) : null,
    kneeAngle: kneeAngle !== null ? kneeAngle.toFixed(1) : null,
    minHipRelative: isFiniteNumber(next.minHipRelative) ? next.minHipRelative.toFixed(3) : null,
    maxHipRelative: isFiniteNumber(next.maxHipRelative) ? next.maxHipRelative.toFixed(3) : null,
    minKneeAngle: isFiniteNumber(next.minKneeAngle) ? next.minKneeAngle.toFixed(1) : null,
    maxKneeAngle: isFiniteNumber(next.maxKneeAngle) ? next.maxKneeAngle.toFixed(1) : null,
    repPending: next.repPending,
    repCooldown: next.repCooldown,
    repIncrement,
  };

  feedback.push(...describeSquatFeedback(metrics, next));
  return { nextState: next, repIncrement, feedback };
}

function updatePushUpState(metrics, state) {
  const next = { ...state };
  let repIncrement = 0;
  const feedback = [];
  const smoothingAlpha = 0.35;

  const rawElbowAngle = metrics.avgElbowAngle;
  const rawShoulderY = metrics.shoulderY;
  const rawHipY = metrics.hipY;

  next.smoothedElbowAngle = applySmoothing(next.smoothedElbowAngle, rawElbowAngle, smoothingAlpha);
  next.smoothedShoulderY = applySmoothing(next.smoothedShoulderY, rawShoulderY, smoothingAlpha);
  next.smoothedHipY = applySmoothing(next.smoothedHipY, rawHipY, smoothingAlpha);

  const elbowAngle = isFiniteNumber(next.smoothedElbowAngle) ? next.smoothedElbowAngle : null;
  const shoulderY = isFiniteNumber(next.smoothedShoulderY) ? next.smoothedShoulderY : null;
  const hipY = isFiniteNumber(next.smoothedHipY) ? next.smoothedHipY : null;

  next.lastElbowAngle = elbowAngle;
  next.lastShoulderY = shoulderY;
  next.lastHipY = hipY;

  next.minElbowAngle = Math.min(next.minElbowAngle, isFiniteNumber(elbowAngle) ? elbowAngle : next.minElbowAngle);
  next.maxElbowAngle = Math.max(next.maxElbowAngle, isFiniteNumber(elbowAngle) ? elbowAngle : next.maxElbowAngle);

  if (next.repCooldown > 0) {
    next.repCooldown -= 1;
  }

  const isTop = elbowAngle !== null && elbowAngle >= pushUpRules.topElbowThreshold && isFiniteNumber(metrics.torsoVertical) && metrics.torsoVertical <= 22 && isFiniteNumber(metrics.hipVertical) && metrics.hipVertical <= 24;
  const isDescending = elbowAngle != null && next.maxElbowAngle - elbowAngle > pushUpRules.descentAngleDelta;
  const isBottom = elbowAngle != null && elbowAngle <= pushUpRules.bottomElbowThreshold;
  const isAscending = elbowAngle != null && elbowAngle - next.minElbowAngle > pushUpRules.ascentAngleDelta;

  if (next.phase === "idle" || next.phase === "untracked") {
    if (isTop) {
      next.phase = "ready";
      next.phaseFrames = 1;
      next.repPending = false;
    } else {
      next.phase = "idle";
      next.phaseFrames = 0;
    }
  } else if (next.phase === "ready") {
    if (isDescending && isBottom) {
      next.phase = "descending";
      next.phaseFrames = 1;
      next.repPending = true;
    } else if (isTop) {
      next.phaseFrames += 1;
    } else {
      next.phaseFrames = 0;
    }
  } else if (next.phase === "descending") {
    if (isBottom) {
      next.phase = "bottom";
      next.phaseFrames = 1;
    } else if (isTop) {
      next.phase = "ready";
      next.phaseFrames = 1;
      next.repPending = false;
    } else {
      next.phaseFrames += 1;
    }
  } else if (next.phase === "bottom") {
    if (isAscending) {
      next.phase = "ascending";
      next.phaseFrames = 1;
    } else {
      next.phaseFrames += 1;
    }
  } else if (next.phase === "ascending") {
    if (isTop && next.repPending && next.repCooldown === 0) {
      repIncrement = 1;
      next.phase = "ready";
      next.phaseFrames = 1;
      next.repPending = false;
      next.minElbowAngle = 180;
      next.maxElbowAngle = 0;
      next.repCooldown = pushUpRules.repCooldown;
    } else if (isBottom) {
      next.phase = "bottom";
      next.phaseFrames = 1;
    } else {
      next.phaseFrames += 1;
    }
  }

  next.debug = {
    state: next.phase,
    elbowAngle: elbowAngle !== null ? elbowAngle.toFixed(1) : null,
    minElbowAngle: isFiniteNumber(next.minElbowAngle) ? next.minElbowAngle.toFixed(1) : null,
    maxElbowAngle: isFiniteNumber(next.maxElbowAngle) ? next.maxElbowAngle.toFixed(1) : null,
    repPending: next.repPending,
    repCooldown: next.repCooldown,
    repIncrement,
  };

  feedback.push(...describePushUpFeedback(metrics, next));

  return { nextState: next, repIncrement, feedback };
}

// Generic curl state machine (elbow-angle based)
function updateBicepCurlState(metrics, state) {
  const next = { ...state };
  let repIncrement = 0;
  const feedback = [];
  const smoothingAlpha = 0.4;

  const rawElbow = metrics.avgElbowAngle;
  next.smoothedElbowAngle = applySmoothing(next.smoothedElbowAngle, rawElbow, smoothingAlpha);
  const elbow = isFiniteNumber(next.smoothedElbowAngle) ? next.smoothedElbowAngle : null;
  next.lastElbowAngle = elbow;

  if (next.repCooldown > 0) next.repCooldown -= 1;

  const isExtended = elbow != null && elbow > 160;
  const isCurlTop = elbow != null && elbow < 65;

  if (next.phase === "idle" || next.phase === "untracked") {
    if (isExtended) { next.phase = "ready"; next.phaseFrames = 1; next.repPending = false; }
  } else if (next.phase === "ready") {
    if (isCurlTop) { next.phase = "curling"; next.phaseFrames = 1; next.repPending = true; }
    else next.phaseFrames += 1;
  } else if (next.phase === "curling") {
    if (isExtended && next.repPending && next.repCooldown === 0) {
      repIncrement = 1;
      next.phase = "ready";
      next.phaseFrames = 1;
      next.repPending = false;
      next.repCooldown = REP_COOLDOWN_FRAMES;
    } else {
      next.phaseFrames += 1;
    }
  }

  next.debug = { state: next.phase, elbow: elbow?.toFixed(1), repPending: next.repPending, repCooldown: next.repCooldown, repIncrement };
  feedback.push("Control the curl and avoid swinging the torso.");
  return { nextState: next, repIncrement, feedback };
}

function updateShoulderPressState(metrics, state) {
  const next = { ...state };
  let repIncrement = 0;
  const feedback = [];
  const smoothingAlpha = 0.35;

  const rawElbow = metrics.avgElbowAngle;
  const rawLeftWristY = metrics.leftWristY;
  const rawRightWristY = metrics.rightWristY;
  next.smoothedElbowAngle = applySmoothing(next.smoothedElbowAngle, rawElbow, smoothingAlpha);
  next.smoothedShoulderY = applySmoothing(next.smoothedShoulderY, average([metrics.leftShoulderY, metrics.rightShoulderY]), smoothingAlpha);
  next.smoothedWristY = applySmoothing(next.smoothedWristY, average([rawLeftWristY, rawRightWristY]), smoothingAlpha);

  const elbow = isFiniteNumber(next.smoothedElbowAngle) ? next.smoothedElbowAngle : null;
  const shoulderY = isFiniteNumber(next.smoothedShoulderY) ? next.smoothedShoulderY : null;
  const wristY = isFiniteNumber(next.smoothedWristY) ? next.smoothedWristY : null;

  if (next.repCooldown > 0) next.repCooldown -= 1;

  const isArmsDown = elbow != null && elbow > 150 && wristY != null && wristY > shoulderY + 0.02;
  const isArmsOverhead = wristY != null && shoulderY != null && wristY < shoulderY - 0.08;

  if (next.phase === "idle" || next.phase === "untracked") {
    if (isArmsDown) { next.phase = "ready"; next.phaseFrames = 1; next.repPending = false; }
  } else if (next.phase === "ready") {
    if (isArmsOverhead) { next.phase = "pressing"; next.phaseFrames = 1; next.repPending = true; }
    else next.phaseFrames += 1;
  } else if (next.phase === "pressing") {
    if (isArmsDown && next.repPending && next.repCooldown === 0) {
      repIncrement = 1; next.phase = "ready"; next.phaseFrames = 1; next.repPending = false; next.repCooldown = REP_COOLDOWN_FRAMES;
    } else next.phaseFrames += 1;
  }

  next.debug = { state: next.phase, elbow: elbow?.toFixed(1), wristY: wristY?.toFixed(3), repPending: next.repPending, repCooldown: next.repCooldown, repIncrement };
  feedback.push("Control the press; avoid leaning back or using legs to help.");
  return { nextState: next, repIncrement, feedback };
}

function updateLateralRaiseState(metrics, state) {
  const next = { ...state };
  let repIncrement = 0;
  const feedback = [];
  const smoothingAlpha = 0.35;

  const rawAvg = metrics.avgWristAboveShoulder;
  next.smoothedWristAbove = applySmoothing(next.smoothedWristAbove, rawAvg, smoothingAlpha);
  const above = isFiniteNumber(next.smoothedWristAbove) ? next.smoothedWristAbove : null;

  if (next.repCooldown > 0) next.repCooldown -= 1;

  // positive value means wrist is above shoulder (since we computed shoulderY - wristY)
  const isArmsDown = above != null && above < -0.02;
  const isRaised = above != null && above > 0.02;

  if (next.phase === "idle" || next.phase === "untracked") {
    if (isArmsDown) { next.phase = "ready"; next.phaseFrames = 1; next.repPending = false; }
  } else if (next.phase === "ready") {
    if (isRaised) { next.phase = "raising"; next.phaseFrames = 1; next.repPending = true; }
    else next.phaseFrames += 1;
  } else if (next.phase === "raising") {
    if (isArmsDown && next.repPending && next.repCooldown === 0) {
      repIncrement = 1; next.phase = "ready"; next.phaseFrames = 1; next.repPending = false; next.repCooldown = REP_COOLDOWN_FRAMES;
    } else next.phaseFrames += 1;
  }

  next.debug = { state: next.phase, above: above?.toFixed(3), repPending: next.repPending, repCooldown: next.repCooldown, repIncrement };
  feedback.push("Raise with control to shoulder height and lower with a slow tempo.");
  return { nextState: next, repIncrement, feedback };
}

function updateSitUpState(metrics, state) {
  const next = { ...state };
  let repIncrement = 0;
  const feedback = [];

  const smoothingAlpha = 0.35;
  next.smoothedTorsoDistance = applySmoothing(next.smoothedTorsoDistance, metrics.torsoDistance, smoothingAlpha);
  next.smoothedKneeDistance = applySmoothing(next.smoothedKneeDistance, metrics.kneeDistance, smoothingAlpha);

  const torsoDistance = isFiniteNumber(next.smoothedTorsoDistance) ? next.smoothedTorsoDistance : null;
  const kneeDistance = isFiniteNumber(next.smoothedKneeDistance) ? next.smoothedKneeDistance : null;
  const isDown = torsoDistance != null && torsoDistance < 0.08;
  const isUp = torsoDistance != null && torsoDistance > 0.14;

  if (next.phase === "idle" || next.phase === "untracked") {
    if (isDown) {
      next.phase = "ready";
      next.phaseFrames = 1;
      next.repPending = false;
    }
  } else if (next.phase === "ready") {
    if (isUp) {
      next.phase = "lifting";
      next.phaseFrames = 1;
      next.repPending = true;
    } else {
      next.phaseFrames += 1;
    }
  } else if (next.phase === "lifting") {
    if (isDown && next.repPending && next.repCooldown === 0) {
      repIncrement = 1;
      next.phase = "ready";
      next.phaseFrames = 1;
      next.repPending = false;
      next.repCooldown = REP_COOLDOWN_FRAMES;
    } else {
      next.phaseFrames += 1;
    }
  }

  if (next.repCooldown > 0) next.repCooldown -= 1;

  next.debug = { state: next.phase, torsoDistance: torsoDistance?.toFixed(3), kneeDistance: kneeDistance?.toFixed(3), repPending: next.repPending, repCooldown: next.repCooldown, repIncrement };
  feedback.push("Lift the torso with your abs and avoid yanking your head and neck upward.");
  return { nextState: next, repIncrement, feedback };
}

function updatePullUpState(metrics, state) {
  const next = { ...state };
  let repIncrement = 0;
  const feedback = [];

  const smoothingAlpha = 0.35;
  next.smoothedElbowAngle = applySmoothing(next.smoothedElbowAngle, metrics.avgElbowAngle, smoothingAlpha);
  const elbow = isFiniteNumber(next.smoothedElbowAngle) ? next.smoothedElbowAngle : null;
  const wristBelowShoulder = metrics.wristBelowShoulder ?? (isFiniteNumber(metrics.wristBelowShoulder) ? metrics.wristBelowShoulder : null);

  if (next.repCooldown > 0) next.repCooldown -= 1;

  const isExtended = elbow != null && elbow > 150;
  const isPull = elbow != null && elbow < 90 && wristBelowShoulder !== null && wristBelowShoulder > 0.02;

  if (next.phase === "idle" || next.phase === "untracked") {
    if (isExtended) {
      next.phase = "ready";
      next.phaseFrames = 1;
      next.repPending = false;
    }
  } else if (next.phase === "ready") {
    if (isPull) {
      next.phase = "pulling";
      next.phaseFrames = 1;
      next.repPending = true;
    } else {
      next.phaseFrames += 1;
    }
  } else if (next.phase === "pulling") {
    if (isExtended && next.repPending && next.repCooldown === 0) {
      repIncrement = 1;
      next.phase = "ready";
      next.phaseFrames = 1;
      next.repPending = false;
      next.repCooldown = REP_COOLDOWN_FRAMES;
    } else {
      next.phaseFrames += 1;
    }
  }

  next.debug = { state: next.phase, elbow: elbow?.toFixed(1), repPending: next.repPending, repCooldown: next.repCooldown, repIncrement };
  feedback.push("Pull your elbows down and back while keeping the torso still.");
  return { nextState: next, repIncrement, feedback };
}

function updatePlankState(metrics, state, timestamp = Date.now()) {
  const next = { ...state };
  let repIncrement = 0;
  const feedback = [];

  const smoothingAlpha = 0.35;
  next.smoothedTorso = applySmoothing(next.smoothedTorso, metrics.torsoVertical, smoothingAlpha);

  const torsoVertical = isFiniteNumber(next.smoothedTorso) ? next.smoothedTorso : null;
  const isGood = torsoVertical != null && torsoVertical < 18; // lower is better

  if (!next.holdStart && isGood) next.holdStart = timestamp;
  if (next.holdStart && !isGood) next.holdStart = null;

  const holdDuration = next.holdStart ? Math.max(0, Math.floor((timestamp - next.holdStart) / 1000)) : 0;

  next.debug = { state: isGood ? "holding" : "untracked", torsoVertical: torsoVertical?.toFixed(2), holdDuration };
  feedback.push(isGood ? "Good plank posture — hold steady." : "Keep a straight line from shoulders to ankles.");

  return { nextState: next, repIncrement, feedback, holdDuration };
}

// Track one-time resolved logs and throttled runtime logs per exercise
const _ANALYZER_RESOLVED_LOGGED = {};
const _LAST_RUNTIME_LOG = {};

export function analyzeExercisePose(exerciseId, poseLandmarks, exerciseRules = [], previousState = null) {
  const state = previousState && previousState.exerciseId === exerciseId ? { ...previousState } : createDefaultAnalysisState(exerciseId);
  const rules = exerciseRules || [];
  const structuredRules = Array.isArray(rules) ? null : rules;

  // Determine required landmarks using provided structured rules when available.
  const requiredCheck = structuredRules ? hasRequiredLandmarksFromRules(structuredRules, poseLandmarks) : null;

  let hasConfidence = null;
  if (requiredCheck) {
    hasConfidence = Boolean(requiredCheck.ok);
  } else {
    // Fallback to legacy per-exercise minimal checks
    hasConfidence = hasExerciseLandmarks(exerciseId, poseLandmarks);
  }

  if (!hasConfidence) {
    const missingKeys = requiredCheck ? requiredCheck.missing : [];
    const visibleKeys = requiredCheck ? requiredCheck.visible : [];

    const nextState = {
      ...state,
      phase: "untracked",
      phaseFrames: 0,
      repCooldown: Math.max(0, state.repCooldown - 1),
      debug: {
        state: "untracked",
        requiredVisible: false,
        missingKeys,
        visibleKeys,
        confidences: Object.fromEntries((requiredCheck ? requiredCheck.missing.concat(requiredCheck.visible) : []).map((key) => [key, getLandmarkConfidence(poseLandmarks?.[key])])),
      },
    };

    const guidanceMessage = structuredRules && structuredRules.guidance ? structuredRules.guidance : "Move into a clear position so I can analyze your form.";

    return {
      exerciseId,
      score: 0,
      feedback: [guidanceMessage],
      passed: false,
      repIncrement: 0,
      state: nextState,
    };
  }

  let metrics;
  // choose metrics by analyzer or exerciseId; normalize to lowercase to support variations like "Squat" or "squats"
  const analyzerRaw = structuredRules?.analyzer || exerciseId || "";
  const analyzer = String(analyzerRaw).toLowerCase();
  if (analyzer === "squat") metrics = computeSquatMetrics(poseLandmarks);
  else if (analyzer === "push-up") metrics = computePushUpMetrics(poseLandmarks);
  else if (analyzer === "sit-up") metrics = computeSitUpMetrics(poseLandmarks);
  else if (analyzer === "pull-up") metrics = computePullUpMetrics(poseLandmarks);
  else if (analyzer === "lunge") metrics = computeSquatMetrics(poseLandmarks);
  else if (analyzer === "bicep-curl") metrics = computeBicepCurlMetrics(poseLandmarks);
  else if (analyzer === "shoulder-press") metrics = computeShoulderPressMetrics(poseLandmarks);
  else if (analyzer === "lateral-raise") metrics = computeLateralRaiseMetrics(poseLandmarks);
  else if (analyzer === "plank") metrics = computePlankMetrics(poseLandmarks);
  else metrics = { hasConfidence, phase: state.phase };
  metrics.hasConfidence = hasConfidence;
  metrics.phase = state.phase;

  let result;
  // Dispatch to appropriate analyzer state machine
  if (analyzer === "squat") result = updateSquatState(metrics, state);
  else if (analyzer === "push-up") result = updatePushUpState(metrics, state);
  else if (analyzer === "sit-up") result = updateSitUpState(metrics, state);
  else if (analyzer === "pull-up") result = updatePullUpState(metrics, state);
  else if (analyzer === "lunge") result = updateSquatState(metrics, state);
  else if (analyzer === "bicep-curl") result = updateBicepCurlState(metrics, state);
  else if (analyzer === "shoulder-press") result = updateShoulderPressState(metrics, state);
  else if (analyzer === "lateral-raise") result = updateLateralRaiseState(metrics, state);
  else if (analyzer === "plank") result = updatePlankState(metrics, state);
  else result = { nextState: state, repIncrement: 0, feedback: ["This exercise is not supported for form-based rep counting yet."] };

  // compute score using analyzer-specific scoring
  let score = 0;
  if (analyzer === "squat") score = computeSquatScore({ ...metrics, phase: result.nextState.phase });
  else if (analyzer === "push-up") score = computePushUpScore({ ...metrics, phase: result.nextState.phase });
  else if (analyzer === "sit-up") score = Math.round(clamp(100 - ((metrics.torsoDistance ?? 0.2) * 250), 0, 100));
  else if (analyzer === "pull-up") score = Math.round(clamp(100 - Math.abs((metrics.avgElbowAngle || 180) - 90) * 0.8, 0, 100));
  else if (analyzer === "lunge") score = Math.round(clamp(100 - ((metrics.kneeAngleDiff ?? 0) * 1.4), 0, 100));
  else if (analyzer === "bicep-curl") score = Math.round(clamp(100 - Math.abs((metrics.avgElbowAngle || 180) - 100) * 0.6, 0, 100));
  else if (analyzer === "shoulder-press") score = Math.round(clamp(100 - (metrics.torsoVertical || 0), 0, 100));
  else if (analyzer === "lateral-raise") score = Math.round(clamp(50 + (metrics.avgWristAboveShoulder || 0) * 200, 0, 100));
  else if (analyzer === "plank") score = Math.round(clamp(100 - (metrics.torsoVertical || 0), 0, 100));

  const passed = hasConfidence && score >= 60;

  const structuredFeedback = [...new Set(result.feedback)].slice(0, 4);
  const formRulesList = structuredRules && Array.isArray(structuredRules.formRules) ? structuredRules.formRules : Array.isArray(exerciseRules) ? exerciseRules : [];
  const staticMessages = formRulesList.map((rule) => rule.text).slice(0, 2);
  const feedback = staticMessages.length ? [...structuredFeedback, ...staticMessages] : structuredFeedback;

  // Enrich debug info
  const requiredList = structuredRules ? structuredRules.requiredLandmarks || [] : [];
  const confidences = Object.fromEntries((requiredList.length ? requiredList : Object.keys(poseLandmarks || {})).map((k) => [k, getLandmarkConfidence(poseLandmarks?.[k])]));

  const debugMeta = {
    exercise: exerciseId,
    analyzer,
    type: structuredRules?.type || "repetition",
    requiredLandmarks: requiredList,
    confidences,
    movementDebug: result.nextState?.debug || null,
  };

  // DEV-only: log once when analyzer is resolved so it's easy to verify resolution
  try {
    if (DEBUG_SQUAT && !_ANALYZER_RESOLVED_LOGGED[exerciseId]) {
      console.debug("[ANALYZER]", `exerciseId=${exerciseId}`, `analyzerType=${analyzer}`, `requiredLandmarks=${JSON.stringify(requiredList)}`);
      _ANALYZER_RESOLVED_LOGGED[exerciseId] = true;
    }
  } catch (e) {
    // ignore logging failures
  }

  // DEV-only: throttled runtime metrics (approx every 500ms)
  try {
    if (DEBUG_SQUAT) {
      const now = Date.now();
      const last = _LAST_RUNTIME_LOG[exerciseId] || 0;
      if (now - last >= 500) {
        _LAST_RUNTIME_LOG[exerciseId] = now;
        const phase = result.nextState?.phase || "n/a";
        const leftKnee = metrics?.leftKnee ?? null;
        const rightKnee = metrics?.rightKnee ?? null;
        const leftHip = metrics?.leftHip ?? null;
        const rightHip = metrics?.rightHip ?? null;
        const movement = {
          avgKnee: metrics?.avgKneeAngle ?? null,
          avgHip: metrics?.avgHipAngle ?? null,
          hipRelative: metrics?.hipRelative ?? null,
        };
        const repCountHint = result.nextState?.repCount ?? null;
        const formScoreHint = typeof score !== "undefined" ? score : null;
        console.debug("[ANALYZER]", `phase=${phase}`, `leftKnee=${leftKnee}`, `rightKnee=${rightKnee}`, `leftHip=${leftHip}`, `rightHip=${rightHip}`, `movement=${JSON.stringify(movement)}`, `repIncrement=${result.repIncrement || 0}`, `formScore=${formScoreHint}`);
      }
    }
  } catch (e) {
    // ignore
  }

  const final = {
    exerciseId,
    score,
    feedback,
    passed,
    repIncrement: result.repIncrement || 0,
    state: result.nextState,
  };
  // attach debug state for dev UI
  final.state = { ...final.state, debugMeta };

  return final;
}
