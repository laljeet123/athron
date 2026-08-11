import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createPoseDetector } from "../ai/poseDetection.js";

const FORM_ANALYZERS = {
  "push-up": {
    id: "push-up",
    name: "Push-Up",
    analyzer: "push-up",
    requiredLandmarks: [
      "left_shoulder",
      "right_shoulder",
      "left_elbow",
      "right_elbow",
      "left_wrist",
      "right_wrist",
      "left_hip",
      "right_hip",
    ],
  },
  squat: {
    id: "squat",
    name: "Squat",
    analyzer: "squat",
    requiredLandmarks: [
      "left_hip",
      "right_hip",
      "left_knee",
      "right_knee",
      "left_ankle",
      "right_ankle",
    ],
  },
  "sit-up": {
    id: "sit-up",
    name: "Sit-Up",
    analyzer: "sit-up",
    requiredLandmarks: [
      "left_shoulder",
      "right_shoulder",
      "left_hip",
      "right_hip",
      "left_knee",
      "right_knee",
    ],
  },
};

const DEFAULT_ANALYSIS = {
  exerciseId: "",
  poseDetected: false,
  landmarkCount: 0,
  confidence: 0,
  phase: "READY",
  metrics: {},
  repCount: 0,
  formScore: 0,
  feedback: ["Move into a clear position so I can analyze your form."],
};

function normalizeExerciseId(value) {
  if (!value) return "";

  const lowered = String(value).trim().toLowerCase();
  const withDashes = lowered.replace(/[_\s]+/g, "-");

  if (withDashes === "pushup" || withDashes === "push-up") return "push-up";
  if (withDashes === "squat" || withDashes === "squats") return "squat";
  if (withDashes === "situp" || withDashes === "sit-up") return "sit-up";

  return "";
}

function safeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getPoint(landmarks, key) {
  const point = landmarks?.[key];

  if (
    !point ||
    typeof point.x !== "number" ||
    typeof point.y !== "number"
  ) {
    return null;
  }

  return point;
}

function getAngle(pointA, pointB, pointC) {
  if (!pointA || !pointB || !pointC) return null;

  const ab = {
    x: pointA.x - pointB.x,
    y: pointA.y - pointB.y,
  };

  const cb = {
    x: pointC.x - pointB.x,
    y: pointC.y - pointB.y,
  };

  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);

  if (!magAB || !magCB) return null;

  const cosine = Math.max(
    -1,
    Math.min(1, dot / (magAB * magCB))
  );

  return (Math.acos(cosine) * 180) / Math.PI;
}

function getBodyAlignment(landmarks) {
  const leftShoulder = getPoint(landmarks, "left_shoulder");
  const rightShoulder = getPoint(landmarks, "right_shoulder");
  const leftHip = getPoint(landmarks, "left_hip");
  const rightHip = getPoint(landmarks, "right_hip");

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return null;
  }

  const shoulderMidY =
    (leftShoulder.y + rightShoulder.y) / 2;

  const hipMidY =
    (leftHip.y + rightHip.y) / 2;

  return Math.abs(shoulderMidY - hipMidY);
}

function averageNumbers(values) {
  const valid = values.filter(
    (value) =>
      typeof value === "number" &&
      Number.isFinite(value)
  );

  if (!valid.length) return null;

  return (
    valid.reduce((sum, value) => sum + value, 0) /
    valid.length
  );
}

function getTorsoHipSpread(landmarks) {
  const leftShoulder = getPoint(landmarks, "left_shoulder");
  const rightShoulder = getPoint(landmarks, "right_shoulder");
  const leftHip = getPoint(landmarks, "left_hip");
  const rightHip = getPoint(landmarks, "right_hip");

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return null;
  }

  const shoulderY =
    (leftShoulder.y + rightShoulder.y) / 2;

  const hipY =
    (leftHip.y + rightHip.y) / 2;

  return Math.abs(shoulderY - hipY);
}

function getElbowFlexion(landmarks) {
  const leftElbow = getAngle(
    getPoint(landmarks, "left_shoulder"),
    getPoint(landmarks, "left_elbow"),
    getPoint(landmarks, "left_wrist")
  );

  const rightElbow = getAngle(
    getPoint(landmarks, "right_shoulder"),
    getPoint(landmarks, "right_elbow"),
    getPoint(landmarks, "right_wrist")
  );

  return averageNumbers(
    [safeNumber(leftElbow), safeNumber(rightElbow)].filter(
      (value) => value != null
    )
  );
}

function getHipKneeFlexion(landmarks) {
  const leftHip = getAngle(
    getPoint(landmarks, "left_shoulder"),
    getPoint(landmarks, "left_hip"),
    getPoint(landmarks, "left_knee")
  );

  const rightHip = getAngle(
    getPoint(landmarks, "right_shoulder"),
    getPoint(landmarks, "right_hip"),
    getPoint(landmarks, "right_knee")
  );

  return averageNumbers(
    [safeNumber(leftHip), safeNumber(rightHip)].filter(
      (value) => value != null
    )
  );
}

function getKneeDrive(landmarks) {
  const leftKnee = getAngle(
    getPoint(landmarks, "left_hip"),
    getPoint(landmarks, "left_knee"),
    getPoint(landmarks, "left_ankle")
  );

  const rightKnee = getAngle(
    getPoint(landmarks, "right_hip"),
    getPoint(landmarks, "right_knee"),
    getPoint(landmarks, "right_ankle")
  );

  return averageNumbers(
    [safeNumber(leftKnee), safeNumber(rightKnee)].filter(
      (value) => value != null
    )
  );
}

function getBestVisibleElbow(landmarks) {
  const leftAngle = getAngle(
    getPoint(landmarks, "left_shoulder"),
    getPoint(landmarks, "left_elbow"),
    getPoint(landmarks, "left_wrist")
  );

  const rightAngle = getAngle(
    getPoint(landmarks, "right_shoulder"),
    getPoint(landmarks, "right_elbow"),
    getPoint(landmarks, "right_wrist")
  );

  if (
    safeNumber(leftAngle) != null &&
    safeNumber(rightAngle) != null
  ) {
    return {
      side:
        Math.abs(180 - safeNumber(leftAngle)) <=
        Math.abs(180 - safeNumber(rightAngle))
          ? "LEFT"
          : "RIGHT",
      angle:
        Math.abs(180 - safeNumber(leftAngle)) <=
        Math.abs(180 - safeNumber(rightAngle))
          ? safeNumber(leftAngle)
          : safeNumber(rightAngle),
    };
  }

  if (safeNumber(leftAngle) != null) {
    return {
      side: "LEFT",
      angle: safeNumber(leftAngle),
    };
  }

  if (safeNumber(rightAngle) != null) {
    return {
      side: "RIGHT",
      angle: safeNumber(rightAngle),
    };
  }

  return {
    side: "NONE",
    angle: null,
  };
}

function classifyMovementPattern(
  landmarks,
  selectedExercise,
  prior
) {
  const priorState =
    prior || {
      lastElbowAngle: null,
      lastTorsoDistance: null,
      lastHipKneeAngle: null,
      lastKneeDrive: null,
    };

  const elbowFlexion = getElbowFlexion(landmarks);
  const torsoDistance = getTorsoHipSpread(landmarks);
  const hipKneeAngle = getHipKneeFlexion(landmarks);
  const kneeDrive = getKneeDrive(landmarks);

  if (selectedExercise === "push-up") {
    const elbowDelta =
      priorState.lastElbowAngle == null
        ? null
        : Math.abs(
            elbowFlexion - priorState.lastElbowAngle
          );

    const torsoDelta =
      priorState.lastTorsoDistance == null
        ? null
        : Math.abs(
            (torsoDistance ?? 0) -
              priorState.lastTorsoDistance
          );

    const hasMeaningfulElbowMotion =
      elbowFlexion != null &&
      elbowDelta != null &&
      elbowDelta > 12 &&
      elbowFlexion > 60 &&
      elbowFlexion < 170;

    const hasPushAlignment =
      torsoDistance != null &&
      torsoDistance < 0.18 &&
      (hipKneeAngle == null || hipKneeAngle > 90);

    const valid = Boolean(
      hasMeaningfulElbowMotion &&
        hasPushAlignment &&
        (torsoDelta == null || torsoDelta < 0.2)
    );

    return {
      movement: valid ? "PUSH-UP" : "UNKNOWN",
      confidence: valid ? 94 : 0,
      primaryMetric:
        elbowFlexion != null
          ? Number(elbowFlexion.toFixed(1))
          : null,
      secondaryMetric:
        torsoDistance != null
          ? Number(torsoDistance.toFixed(3))
          : null,
      wrongExercise: !valid,
      phase:
        elbowFlexion != null && elbowFlexion < 120
          ? "DESCENDING"
          : elbowFlexion != null && elbowFlexion > 150
          ? "ASCENDING"
          : "READY",
      valid,
    };
  }

  if (selectedExercise === "sit-up") {
    const torsoDelta =
      priorState.lastTorsoDistance == null
        ? null
        : Math.abs(
            (torsoDistance ?? 0) -
              priorState.lastTorsoDistance
          );

    const hipKneeDelta =
      priorState.lastHipKneeAngle == null
        ? null
        : Math.abs(
            (hipKneeAngle ?? 0) -
              priorState.lastHipKneeAngle
          );

    const elbowDriven =
      elbowFlexion != null &&
      elbowFlexion < 150 &&
      elbowFlexion > 60;

    const sitUpGeometry =
      torsoDistance != null &&
      torsoDistance > 0.06 &&
      hipKneeAngle != null &&
      hipKneeAngle > 60 &&
      (hipKneeDelta == null || hipKneeDelta > 8);

    const valid = Boolean(
      sitUpGeometry &&
        !elbowDriven &&
        (torsoDelta == null || torsoDelta > 0.02)
    );

    return {
      movement: valid ? "SIT-UP" : "UNKNOWN",
      confidence: valid ? 92 : 0,
      primaryMetric:
        hipKneeAngle != null
          ? Number(hipKneeAngle.toFixed(1))
          : null,
      secondaryMetric:
        torsoDistance != null
          ? Number(torsoDistance.toFixed(3))
          : null,
      wrongExercise: !valid,
      phase:
        hipKneeAngle != null && hipKneeAngle < 100
          ? "DESCENDING"
          : hipKneeAngle != null && hipKneeAngle > 140
          ? "ASCENDING"
          : "READY",
      valid,
    };
  }

  return {
    movement: "UNKNOWN",
    confidence: 0,
    primaryMetric: null,
    secondaryMetric: null,
    wrongExercise: true,
    phase: "READY",
    valid: false,
  };
}

function normalizeLandmarksMap(rawLandmarks) {
  if (!rawLandmarks) return {};

  if (Array.isArray(rawLandmarks)) {
    const landmarkMap = {};

    const keyMap = {
      11: "left_shoulder",
      12: "right_shoulder",
      13: "left_elbow",
      14: "right_elbow",
      15: "left_wrist",
      16: "right_wrist",
      23: "left_hip",
      24: "right_hip",
      25: "left_knee",
      26: "right_knee",
      27: "left_ankle",
      28: "right_ankle",
    };

    rawLandmarks.forEach((landmark, index) => {
      const key = keyMap[index];

      if (key) {
        landmarkMap[key] = landmark;
      }
    });

    return landmarkMap;
  }

  return rawLandmarks;
}

function buildPushUpAnalysis(landmarks, state) {
  const leftShoulder = getPoint(
    landmarks,
    "left_shoulder"
  );
  const rightShoulder = getPoint(
    landmarks,
    "right_shoulder"
  );
  const leftElbow = getPoint(
    landmarks,
    "left_elbow"
  );
  const rightElbow = getPoint(
    landmarks,
    "right_elbow"
  );
  const leftWrist = getPoint(
    landmarks,
    "left_wrist"
  );
  const rightWrist = getPoint(
    landmarks,
    "right_wrist"
  );

  const leftElbowAngle = getAngle(
    leftShoulder,
    leftElbow,
    leftWrist
  );

  const rightElbowAngle = getAngle(
    rightShoulder,
    rightElbow,
    rightWrist
  );

  const validAngles = [
    safeNumber(leftElbowAngle),
    safeNumber(rightElbowAngle),
  ].filter((value) => value != null);

  if (!validAngles.length) {
    return {
      exerciseId: "push-up",
      poseDetected: false,
      landmarkCount: 0,
      confidence: 0,
      phase: "READY",
      metrics: {
        leftElbowAngle: null,
        rightElbowAngle: null,
        movementMetric: {
          leftElbowAngle: null,
          rightElbowAngle: null,
        },
      },
      repCount: Number.isFinite(state.repCount)
        ? state.repCount
        : 0,
      formScore: 0,
      feedback: ["Pose: NOT DETECTED"],
      trace: {
        lastTransition:
          state.lastTransition || "READY",
        why: "No usable elbow landmarks for push-up.",
      },
      currentAngle: state.lastAngle ?? null,
      repBlockedReason: "Landmarks unavailable",
      selectedElbow: "NONE",
    };
  }

  const selectedElbow = getBestVisibleElbow(landmarks);

  const currentAngle =
    selectedElbow.angle ??
    averageNumbers(validAngles);

  const previousAngle =
    typeof state.lastAngle === "number"
      ? state.lastAngle
      : currentAngle;

  let phase = state.phase || "READY";
  let repCount = Number.isFinite(state.repCount)
    ? state.repCount
    : 0;

  let lastTransition =
    state.lastTransition || "READY";

  let why =
    state.lastReason ||
    "Waiting for movement.";

  let repBlockedReason = null;

  if (phase === "READY") {
    if (
      currentAngle < 155 &&
      previousAngle - currentAngle >= 8
    ) {
      phase = "DESCENDING";
      lastTransition = "READY → DESCENDING";
      why = `selected elbow ${selectedElbow.side}: ${previousAngle.toFixed(
        1
      )}° → ${currentAngle.toFixed(1)}°`;
    } else {
      repBlockedReason =
        "Waiting for elbow movement";
    }
  } else if (phase === "DESCENDING") {
    if (currentAngle <= 115) {
      phase = "BOTTOM";
      lastTransition = "DESCENDING → BOTTOM";
      why = `bottom position reached: ${currentAngle.toFixed(
        1
      )}°`;
    } else {
      repBlockedReason =
        "Waiting for bottom position";
    }
  } else if (phase === "BOTTOM") {
    if (
      currentAngle >= previousAngle + 8
    ) {
      phase = "ASCENDING";
      lastTransition = "BOTTOM → ASCENDING";
      why = `ascending from bottom: ${previousAngle.toFixed(
        1
      )}° → ${currentAngle.toFixed(1)}°`;
    } else {
      repBlockedReason =
        "Waiting for upward drive";
    }
  } else if (phase === "ASCENDING") {
    if (
      currentAngle >= 150 &&
      currentAngle >= previousAngle - 2
    ) {
      repCount += 1;
      phase = "READY";
      lastTransition = "ASCENDING → READY";
      why = `full top return: ${previousAngle.toFixed(
        1
      )}° → ${currentAngle.toFixed(1)}°`;
      repBlockedReason = null;
    } else {
      repBlockedReason =
        "Waiting for full return";
    }
  }

  let feedback = [
    "Move into a clear position so I can analyze your form.",
  ];

  if (phase === "READY" && repBlockedReason) {
    feedback = [repBlockedReason];
  } else if (phase === "DESCENDING") {
    feedback = [
      "Lower with control and keep the elbow moving through the full range.",
    ];
  } else if (phase === "BOTTOM") {
    feedback = [
      "Great depth. Push back up and extend the arms.",
    ];
  } else if (phase === "ASCENDING") {
    feedback = [
      "Drive upward and finish with full elbow extension.",
    ];
  } else if (currentAngle >= 150) {
    feedback = [
      "Excellent push-up range. Hold the top position and reset.",
    ];
  }

  const formScore = Math.max(
    0,
    Math.min(
      100,
      100 - Math.abs(currentAngle - 90) * 0.8
    )
  );

  return {
    exerciseId: "push-up",
    poseDetected: true,
    landmarkCount: 33,
    confidence: 100,
    phase,
    metrics: {
      leftElbowAngle: safeNumber(leftElbowAngle),
      rightElbowAngle: safeNumber(rightElbowAngle),
      movementMetric: {
        leftElbowAngle: safeNumber(leftElbowAngle),
        rightElbowAngle: safeNumber(rightElbowAngle),
      },
    },
    repCount,
    formScore,
    feedback,
    trace: {
      lastTransition,
      why,
    },
    currentAngle,
    repBlockedReason,
    selectedElbow: selectedElbow.side,
  };
}

function buildSquatAnalysis(landmarks, state) {
  const leftHip = getPoint(
    landmarks,
    "left_hip"
  );
  const rightHip = getPoint(
    landmarks,
    "right_hip"
  );
  const leftKnee = getPoint(
    landmarks,
    "left_knee"
  );
  const rightKnee = getPoint(
    landmarks,
    "right_knee"
  );
  const leftAnkle = getPoint(
    landmarks,
    "left_ankle"
  );
  const rightAnkle = getPoint(
    landmarks,
    "right_ankle"
  );
  const leftShoulder = getPoint(
    landmarks,
    "left_shoulder"
  );
  const rightShoulder = getPoint(
    landmarks,
    "right_shoulder"
  );

  const leftKneeAngle = getAngle(
    leftHip,
    leftKnee,
    leftAnkle
  );

  const rightKneeAngle = getAngle(
    rightHip,
    rightKnee,
    rightAnkle
  );

  const leftHipAngle = getAngle(
    leftShoulder,
    leftHip,
    leftKnee
  );

  const rightHipAngle = getAngle(
    rightShoulder,
    rightHip,
    rightKnee
  );

  const validKneeAngles = [
    safeNumber(leftKneeAngle),
    safeNumber(rightKneeAngle),
  ].filter((value) => value != null);

  if (!validKneeAngles.length) {
    return {
      exerciseId: "squat",
      poseDetected: false,
      landmarkCount: 0,
      confidence: 0,
      phase: "READY",
      metrics: {
        leftKneeAngle: null,
        rightKneeAngle: null,
        leftHipAngle: null,
        rightHipAngle: null,
        movementMetric: {
          leftKneeAngle: null,
          rightKneeAngle: null,
          leftHipAngle: null,
          rightHipAngle: null,
        },
      },
      repCount: Number.isFinite(state.repCount)
        ? state.repCount
        : 0,
      formScore: 0,
      feedback: ["Pose: NOT DETECTED"],
      trace: {
        lastTransition:
          state.lastTransition || "READY",
        why: "No usable knee landmarks for squat.",
      },
      currentAngle: state.lastAngle ?? null,
    };
  }

  const currentAngle =
    averageNumbers(validKneeAngles);

  const previousAngle =
    typeof state.lastAngle === "number"
      ? state.lastAngle
      : currentAngle;

  let phase = state.phase || "READY";

  let repCount = Number.isFinite(state.repCount)
    ? state.repCount
    : 0;

  let lastTransition =
    state.lastTransition || "READY";

  let why =
    state.lastReason ||
    "Waiting for movement.";

  if (
    phase === "READY" &&
    currentAngle < 165 &&
    currentAngle < previousAngle - 6
  ) {
    phase = "DESCENDING";
    lastTransition = "READY → DESCENDING";
    why = `knee angle ${previousAngle.toFixed(
      1
    )}° → ${currentAngle.toFixed(1)}°`;
  } else if (
    phase === "DESCENDING" &&
    currentAngle < 105
  ) {
    phase = "BOTTOM";
    lastTransition = "DESCENDING → BOTTOM";
    why = `squat depth reached: ${currentAngle.toFixed(
      1
    )}°`;
  } else if (
    phase === "BOTTOM" &&
    currentAngle > 120 &&
    currentAngle > previousAngle + 6
  ) {
    phase = "ASCENDING";
    lastTransition = "BOTTOM → ASCENDING";
    why = `standing up: ${previousAngle.toFixed(
      1
    )}° → ${currentAngle.toFixed(1)}°`;
  } else if (
    phase === "ASCENDING" &&
    currentAngle > 155 &&
    currentAngle > previousAngle + 4
  ) {
    repCount += 1;
    phase = "READY";
    lastTransition = "ASCENDING → READY";
    why = `complete squat cycle: ${previousAngle.toFixed(
      1
    )}° → ${currentAngle.toFixed(1)}°`;
  }

  let feedback = [
    "Move into a clear position so I can analyze your form.",
  ];

  if (currentAngle < 105) {
    feedback = [
      "Stay upright through the torso and drive up strongly from the hips.",
    ];
  } else if (currentAngle < 155) {
    feedback = [
      "Control the descent and stop when your thighs are close to parallel.",
    ];
  } else {
    feedback = [
      "Excellent squat depth and strong upward drive.",
    ];
  }

  const formScore = Math.max(
    0,
    Math.min(
      100,
      100 - Math.abs(currentAngle - 90) * 0.7
    )
  );

  return {
    exerciseId: "squat",
    poseDetected: true,
    landmarkCount: 33,
    confidence: 100,
    phase,
    metrics: {
      leftKneeAngle: safeNumber(leftKneeAngle),
      rightKneeAngle: safeNumber(rightKneeAngle),
      leftHipAngle: safeNumber(leftHipAngle),
      rightHipAngle: safeNumber(rightHipAngle),
      movementMetric: {
        leftKneeAngle: safeNumber(leftKneeAngle),
        rightKneeAngle: safeNumber(rightKneeAngle),
        leftHipAngle: safeNumber(leftHipAngle),
        rightHipAngle: safeNumber(rightHipAngle),
      },
    },
    repCount,
    formScore,
    feedback,
    trace: {
      lastTransition,
      why,
    },
    currentAngle,
  };
}

function leftShoulderFallback(landmarks, key) {
  return (
    getPoint(landmarks, key) ||
    getPoint(landmarks, "left_shoulder")
  );
}

function rightShoulderFallback(landmarks, key) {
  return (
    getPoint(landmarks, key) ||
    getPoint(landmarks, "right_shoulder")
  );
}

function getCameraErrorMessage(error) {
  const name = error?.name || "UnknownError";

  if (
    name === "NotAllowedError" ||
    name === "PermissionDeniedError"
  ) {
    return "Camera permission denied. Allow camera access in your browser settings.";
  }

  if (
    name === "NotReadableError" ||
    name === "TrackStartError"
  ) {
    return "Camera is unavailable. Close other apps using the camera and try again.";
  }

  if (
    name === "NotFoundError" ||
    name === "DevicesNotFoundError"
  ) {
    return "Camera is unavailable. No usable camera was found.";
  }

  if (
    name === "OverconstrainedError" ||
    name === "ConstraintNotSatisfiedError"
  ) {
    return "The requested camera configuration is unavailable.";
  }

  if (name === "AbortError") {
    return "Camera startup was interrupted. Please try again.";
  }

  if (name === "SecurityError") {
    return "Camera access was blocked by the browser. Make sure you are using HTTPS.";
  }

  return "Unable to start video preview.";
}

function waitForVideo(video) {
  return new Promise((resolve, reject) => {
    if (!video) {
      reject(
        new Error("Video element is not ready.")
      );
      return;
    }

    const ready = () =>
      video.readyState >= 2 &&
      video.videoWidth > 0 &&
      video.videoHeight > 0;

    if (ready()) {
      resolve();
      return;
    }

    const onReady = () => {
      if (ready()) {
        cleanup();
        resolve();
      }
    };

    const onError = () => {
      cleanup();
      reject(
        new Error("Video preview failed to load.")
      );
    };

    const cleanup = () => {
      video.removeEventListener(
        "loadedmetadata",
        onReady
      );
      video.removeEventListener(
        "canplay",
        onReady
      );
      video.removeEventListener(
        "error",
        onError
      );
      clearTimeout(timeoutId);
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          "Timed out waiting for video stream."
        )
      );
    }, 5000);

    video.addEventListener(
      "loadedmetadata",
      onReady
    );

    video.addEventListener(
      "canplay",
      onReady
    );

    video.addEventListener(
      "error",
      onError
    );
  });
}

function FormChecker() {
  const navigate = useNavigate();

  const {
    exerciseId: routeExerciseId,
  } = useParams();

  const [searchParams] =
    useSearchParams();

  const requestedExerciseId =
    normalizeExerciseId(
      searchParams.get("id") ||
        routeExerciseId ||
        ""
    );

  const exerciseMeta =
    requestedExerciseId
      ? FORM_ANALYZERS[requestedExerciseId]
      : null;

  const isSupportedExercise =
    Boolean(exerciseMeta);

  const [cameraStatus, setCameraStatus] =
    useState("idle");

  const [poseStatus, setPoseStatus] =
    useState("loading");

  const [cameraError, setCameraError] =
    useState("");

  const [landmarks, setLandmarks] =
    useState([]);

  const [analysisResult, setAnalysisResult] =
    useState({
      ...DEFAULT_ANALYSIS,
      exerciseId: requestedExerciseId,
    });

  const [videoReady, setVideoReady] =
    useState(false);

  const [videoDimensions, setVideoDimensions] =
    useState({
      width: 0,
      height: 0,
    });

  const [videoElementStatus, setVideoElementStatus] =
    useState("NOT FOUND");

  const [videoReadyState, setVideoReadyState] =
    useState(0);

  const [videoSrcObjectStatus, setVideoSrcObjectStatus] =
    useState("NOT CONNECTED");

  const [poseDetectorStatus, setPoseDetectorStatus] =
    useState("INITIALIZING");

  const [poseResultStatus, setPoseResultStatus] =
    useState("NOT RECEIVED");

  const [poseError, setPoseError] =
    useState("");

  const [frameLoopStatus, setFrameLoopStatus] =
    useState("NOT RUNNING");

  const [framesSent, setFramesSent] =
    useState(0);

  const [lastPoseResultTimestamp, setLastPoseResultTimestamp] =
    useState(null);

  // Mobile camera diagnostics
  const [cameraPermissionState, setCameraPermissionState] =
    useState("UNKNOWN");

  const [getUserMediaError, setGetUserMediaError] =
    useState("");

  const [debugSnapshot, setDebugSnapshot] =
    useState({
      camera: "idle",
      video: "NOT READY",
      poseDetector: "INITIALIZING",
      poseInference: "NOT RECEIVING",
      landmarks: 0,
      analyzer: "INACTIVE",
      metrics: "INACTIVE",
      frameLoop: "NOT RUNNING",
      framesSent: 0,
    });

  const videoRef = useRef(null);

  const streamRef = useRef(null);

  // Prevent duplicate getUserMedia calls
  const cameraStartPromiseRef = useRef(null);

  const poseDetectorRef = useRef(null);

  const animationFrameRef =
    useRef(null);

  const cameraActiveRef =
    useRef(false);

  const frameCounterRef =
    useRef(0);

  const lastAnalysisTimeRef =
    useRef(0);

  const lastDebugUpdateRef =
    useRef(0);

  const lastFrameUpdateRef =
    useRef(0);

  const analyzerStateRef =
    useRef({
      phase: "READY",
      repCount: 0,
      lastAngle: null,
      lastTransition: "READY",
      lastReason: "Waiting for movement.",
    });

  useEffect(() => {
    if (
      !requestedExerciseId ||
      !isSupportedExercise
    ) {
      setCameraStatus("stopped");
      setPoseStatus("loading");
      setVideoReady(false);

      setVideoDimensions({
        width: 0,
        height: 0,
      });

      setPoseDetectorStatus(
        "INITIALIZING"
      );

      setPoseResultStatus(
        "NOT RECEIVED"
      );

      setLandmarks([]);
      setCameraError("");
      setPoseError("");

      setDebugSnapshot({
        camera: "stopped",
        video: "NOT READY",
        poseDetector: "INITIALIZING",
        poseInference: "NOT RECEIVING",
        landmarks: 0,
        analyzer: "INACTIVE",
        metrics: "INACTIVE",
      });

      setAnalysisResult({
        ...DEFAULT_ANALYSIS,
        exerciseId:
          requestedExerciseId,
        feedback: [
          "Form Analyzer currently supports Push-Ups and Squats only.",
        ],
      });

      return;
    }

    analyzerStateRef.current = {
      phase: "READY",
      repCount: 0,
      lastAngle: null,
      lastTransition: "READY",
      lastReason: "Waiting for movement.",
    };

    setCameraStatus("idle");
    setPoseStatus("loading");
    setVideoReady(false);

    setVideoDimensions({
      width: 0,
      height: 0,
    });

    setPoseDetectorStatus(
      "INITIALIZING"
    );

    setPoseResultStatus(
      "NOT RECEIVED"
    );

    setLandmarks([]);
    setCameraError("");
    setPoseError("");
    setGetUserMediaError("");
    setCameraPermissionState("UNKNOWN");

    setDebugSnapshot({
      camera: "idle",
      video: "NOT READY",
      poseDetector: "INITIALIZING",
      poseInference: "NOT RECEIVING",
      landmarks: 0,
      analyzer: "INACTIVE",
      metrics: "INACTIVE",
    });

    setAnalysisResult({
      ...DEFAULT_ANALYSIS,
      exerciseId:
        requestedExerciseId,
      feedback: [
        "Move into a clear position so I can analyze your form.",
      ],
    });
  }, [
    requestedExerciseId,
    isSupportedExercise,
  ]);

  const stopCamera = useCallback(() => {
    cameraActiveRef.current = false;

    cameraStartPromiseRef.current = null;

    setFrameLoopStatus("NOT RUNNING");

    setDebugSnapshot((prev) => ({
      ...prev,
      frameLoop: "NOT RUNNING",
      poseInference: "NOT RECEIVING",
    }));

    if (animationFrameRef.current) {
      cancelAnimationFrame(
        animationFrameRef.current
      );

      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    poseDetectorRef.current = null;

    setLandmarks([]);
    setVideoReady(false);

    setVideoDimensions({
      width: 0,
      height: 0,
    });

    setVideoReadyState(0);
    setVideoSrcObjectStatus(
      "NOT CONNECTED"
    );

    setCameraStatus("stopped");
    setPoseStatus("loading");
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handlePoseResults = useCallback(
    (results) => {
      if (!exerciseMeta) return;

      const detectedLandmarks =
        Array.isArray(results?.poseLandmarks)
          ? results.poseLandmarks
          : Array.isArray(results?.landmarksArray)
          ? results.landmarksArray
          : [];

      const landmarksMap =
        normalizeLandmarksMap(
          results?.landmarks ||
            results?.landmarksArray ||
            []
        );

      const visibleKeys =
        Object.keys(landmarksMap).filter(
          (key) =>
            getPoint(
              landmarksMap,
              key
            )
        );

      const actualLandmarkCount =
        detectedLandmarks.length ||
        visibleKeys.length;

      const actualConfidence =
        Number.isFinite(
          results?.confidence
        )
          ? results.confidence
          : actualLandmarkCount
          ? Math.round(
              (visibleKeys.length /
                Math.max(
                  actualLandmarkCount,
                  1
                )) *
                100
            )
          : 0;

      setPoseResultStatus(
        actualLandmarkCount
          ? "RECEIVED"
          : "NOT RECEIVED"
      );

      setPoseStatus(
        actualLandmarkCount
          ? "DETECTED"
          : "NOT DETECTED"
      );

      setPoseError("");

      if (actualLandmarkCount) {
        setLastPoseResultTimestamp(
          Date.now()
        );
      }

      if (!actualLandmarkCount) {
        setLandmarks([]);

        setAnalysisResult({
          ...DEFAULT_ANALYSIS,
          exerciseId:
            requestedExerciseId,
          feedback: [
            "Pose: NOT DETECTED",
          ],
        });

        return;
      }

      setLandmarks(
        visibleKeys.map(
          (key) =>
            landmarksMap[key]
        )
      );

      const now = Date.now();

      if (
        now -
          lastAnalysisTimeRef.current <
        350
      ) {
        return;
      }

      lastAnalysisTimeRef.current =
        now;

      const state =
        analyzerStateRef.current;

      const base = {
        exerciseId:
          requestedExerciseId,
        poseDetected: true,
        landmarkCount:
          actualLandmarkCount,
        confidence:
          actualConfidence,
        phase: state.phase,
        metrics: {},
        repCount: state.repCount,
        formScore: 0,
        feedback: [
          "Move into a clear position so I can analyze your form.",
        ],
      };

      const movementProfile =
        classifyMovementPattern(
          landmarksMap,
          requestedExerciseId,
          {
            lastElbowAngle:
              typeof state.lastAngle ===
              "number"
                ? state.lastAngle
                : null,
            lastTorsoDistance: null,
            lastHipKneeAngle: null,
            lastKneeDrive: null,
          }
        );

      if (
        exerciseMeta.analyzer ===
        "push-up"
      ) {
        const next =
          buildPushUpAnalysis(
            landmarksMap,
            state
          );

        const pushUpElbow =
          averageNumbers(
            [
              safeNumber(
                next.metrics
                  .leftElbowAngle
              ),
              safeNumber(
                next.metrics
                  .rightElbowAngle
              ),
            ].filter(
              (value) =>
                value != null
            )
          );

        if (pushUpElbow == null) {
          analyzerStateRef.current = {
            ...state,
            lastReason:
              next.repBlockedReason ||
              "Landmarks unavailable",
            lastTransition:
              state.lastTransition ||
              "READY",
          };

          setAnalysisResult({
            ...next,
            confidence:
              actualConfidence,
            landmarkCount:
              actualLandmarkCount,
            poseDetected: true,
            feedback: [
              next.repBlockedReason ||
                "Landmarks unavailable",
            ],
            repBlockedReason:
              next.repBlockedReason ||
              "Landmarks unavailable",
            wrongExercise: false,
            selectedElbow:
              next.selectedElbow ||
              "NONE",
          });

          return;
        }

        analyzerStateRef.current = {
          phase: next.phase,
          repCount:
            next.repCount,
          lastAngle:
            next.currentAngle,
          lastTransition:
            next.trace
              ?.lastTransition ||
            state.lastTransition ||
            "READY",
          lastReason:
            next.repBlockedReason ||
            next.trace?.why ||
            state.lastReason ||
            "Waiting for movement.",
        };

        setAnalysisResult({
          ...next,
          confidence:
            actualConfidence,
          landmarkCount:
            actualLandmarkCount,
          poseDetected: true,
          movementClassification:
            movementProfile.movement,
          movementConfidence:
            movementProfile.confidence,
          primaryMetric:
            movementProfile.primaryMetric,
          secondaryMetric:
            movementProfile.secondaryMetric,
          wrongExercise: false,
          repBlockedReason:
            next.repBlockedReason ||
            null,
          selectedElbow:
            next.selectedElbow ||
            "LEFT",
        });
      } else if (
        exerciseMeta.analyzer ===
        "squat"
      ) {
        const next =
          buildSquatAnalysis(
            landmarksMap,
            state
          );

        const squatKnee =
          averageNumbers(
            [
              safeNumber(
                next.metrics
                  .leftKneeAngle
              ),
              safeNumber(
                next.metrics
                  .rightKneeAngle
              ),
            ].filter(
              (value) =>
                value != null
            )
          );

        const pushUpElbow =
          averageNumbers(
            [
              safeNumber(
                getAngle(
                  getPoint(
                    landmarksMap,
                    "left_shoulder"
                  ),
                  getPoint(
                    landmarksMap,
                    "left_elbow"
                  ),
                  getPoint(
                    landmarksMap,
                    "left_wrist"
                  )
                )
              ),
              safeNumber(
                getAngle(
                  getPoint(
                    landmarksMap,
                    "right_shoulder"
                  ),
                  getPoint(
                    landmarksMap,
                    "right_elbow"
                  ),
                  getPoint(
                    landmarksMap,
                    "right_wrist"
                  )
                )
              ),
            ].filter(
              (value) =>
                value != null
            )
          );

        const wrongExercise =
          (pushUpElbow != null &&
            squatKnee != null &&
            pushUpElbow < 145 &&
            squatKnee > 150) ||
          !movementProfile.valid;

        if (wrongExercise) {
          analyzerStateRef.current = {
            ...state,
            lastReason:
              "Wrong exercise. Perform a squat.",
            lastTransition:
              state.lastTransition ||
              "READY",
          };

          setAnalysisResult({
            ...next,
            feedback: [
              "Wrong exercise. Perform a squat.",
            ],
            trace: {
              lastTransition:
                state.lastTransition ||
                "READY",
              why: "The detected movement does not match the squat pattern.",
            },
            movementClassification:
              movementProfile.movement,
            movementConfidence:
              movementProfile.confidence,
            primaryMetric:
              movementProfile.primaryMetric,
            secondaryMetric:
              movementProfile.secondaryMetric,
            wrongExercise: true,
          });

          return;
        }

        analyzerStateRef.current = {
          phase: next.phase,
          repCount:
            next.repCount,
          lastAngle:
            next.currentAngle,
          lastTransition:
            next.trace
              ?.lastTransition ||
            state.lastTransition ||
            "READY",
          lastReason:
            next.trace?.why ||
            state.lastReason ||
            "Waiting for movement.",
        };

        setAnalysisResult({
          ...next,
          confidence:
            actualConfidence,
          landmarkCount:
            actualLandmarkCount,
          poseDetected: true,
          movementClassification:
            movementProfile.movement,
          movementConfidence:
            movementProfile.confidence,
          primaryMetric:
            movementProfile.primaryMetric,
          secondaryMetric:
            movementProfile.secondaryMetric,
          wrongExercise: false,
        });
      } else if (
        exerciseMeta.analyzer ===
        "sit-up"
      ) {
        const torsoDistance =
          getTorsoHipSpread(
            landmarksMap
          );

        const elbowFlexion =
          getElbowFlexion(
            landmarksMap
          );

        const hipKneeAngle =
          getHipKneeFlexion(
            landmarksMap
          );

        const sitUpMovement =
          classifyMovementPattern(
            landmarksMap,
            "sit-up",
            {
              lastElbowAngle:
                elbowFlexion,
              lastTorsoDistance:
                torsoDistance,
              lastHipKneeAngle:
                hipKneeAngle,
              lastKneeDrive: null,
            }
          );

        const wrongExercise =
          !sitUpMovement.valid ||
          (elbowFlexion != null &&
            elbowFlexion < 150 &&
            elbowFlexion > 60);

        if (wrongExercise) {
          analyzerStateRef.current = {
            ...state,
            lastReason:
              "Wrong exercise. Perform a sit-up.",
            lastTransition:
              state.lastTransition ||
              "READY",
          };

          setAnalysisResult({
            ...base,
            exerciseId:
              requestedExerciseId,
            poseDetected: true,
            landmarkCount:
              actualLandmarkCount,
            confidence:
              actualConfidence,
            feedback: [
              "Wrong exercise. Perform a sit-up.",
            ],
            phase: "READY",
            movementClassification:
              sitUpMovement.movement,
            movementConfidence:
              sitUpMovement.confidence,
            primaryMetric:
              sitUpMovement.primaryMetric,
            secondaryMetric:
              sitUpMovement.secondaryMetric,
            wrongExercise: true,
          });

          return;
        }

        const next = {
          ...base,
          exerciseId:
            requestedExerciseId,
          poseDetected: true,
          landmarkCount:
            actualLandmarkCount,
          confidence:
            actualConfidence,
          phase:
            sitUpMovement.phase,
          metrics: {
            torsoDistance,
            elbowFlexion,
            hipKneeAngle,
          },
          repCount:
            state.repCount,
          formScore: 0,
          feedback: [
            "Correct sit-up pattern detected.",
          ],
          movementClassification:
            sitUpMovement.movement,
          movementConfidence:
            sitUpMovement.confidence,
          primaryMetric:
            sitUpMovement.primaryMetric,
          secondaryMetric:
            sitUpMovement.secondaryMetric,
          wrongExercise: false,
        };

        analyzerStateRef.current = {
          ...state,
          phase:
            sitUpMovement.phase,
          repCount:
            state.repCount,
          lastAngle:
            sitUpMovement.primaryMetric,
          lastTransition:
            sitUpMovement.phase,
          lastReason:
            sitUpMovement.movement,
        };

        setAnalysisResult(next);
      } else {
        setAnalysisResult({
          ...base,
          feedback: [
            "Form Analyzer currently supports Push-Ups and Squats only.",
          ],
        });
      }

      const nextDebugSnapshot = {
        camera: cameraStatus,
        video: videoReady
          ? "READY"
          : "NOT READY",
        poseDetector:
          poseDetectorStatus,
        poseInference:
          actualLandmarkCount
            ? "RECEIVING"
            : "NOT RECEIVING",
        landmarks:
          actualLandmarkCount,
        analyzer:
          exerciseMeta?.analyzer
            ? exerciseMeta.analyzer.toUpperCase()
            : "INACTIVE",
        metrics:
          actualLandmarkCount
            ? "ACTIVE"
            : "INACTIVE",
        frameLoop:
          frameLoopStatus,
        framesSent:
          frameCounterRef.current,
      };

      if (
        Date.now() -
          lastDebugUpdateRef.current >
        400
      ) {
        lastDebugUpdateRef.current =
          Date.now();

        setDebugSnapshot(
          nextDebugSnapshot
        );
      }
    },
    [
      cameraStatus,
      exerciseMeta,
      requestedExerciseId,
      poseDetectorStatus,
      videoReady,
      frameLoopStatus,
    ]
  );

  const startPoseProcessing =
    useCallback(() => {
      if (
        !exerciseMeta ||
        !videoRef.current ||
        !navigator.mediaDevices
      ) {
        return;
      }

      cameraActiveRef.current = true;

      setFrameLoopStatus("RUNNING");

      setDebugSnapshot((prev) => ({
        ...prev,
        frameLoop: "RUNNING",
        poseInference: "RECEIVING",
        poseDetector: "READY",
      }));

      const frameLoop = async () => {
        const currentVideo =
          videoRef.current;

        const detector =
          poseDetectorRef.current;

        if (
          !cameraActiveRef.current ||
          !currentVideo ||
          !detector
        ) {
          setFrameLoopStatus(
            "NOT RUNNING"
          );
          return;
        }

        const videoReadyToAnalyze =
          currentVideo.readyState >= 2 &&
          currentVideo.videoWidth > 0 &&
          currentVideo.videoHeight > 0 &&
          currentVideo.srcObject !== null;

        if (!videoReadyToAnalyze) {
          animationFrameRef.current =
            requestAnimationFrame(
              frameLoop
            );

          return;
        }

        try {
          frameCounterRef.current += 1;

          if (
            Date.now() -
              lastFrameUpdateRef.current >
            400
          ) {
            lastFrameUpdateRef.current =
              Date.now();

            setFramesSent(
              frameCounterRef.current
            );

            setDebugSnapshot((prev) => ({
              ...prev,
              frameLoop: "RUNNING",
              video: "READY",
              poseInference:
                "RECEIVING",
              framesSent:
                frameCounterRef.current,
              landmarks:
                landmarks.length ||
                prev.landmarks,
            }));
          }

          setPoseDetectorStatus(
            "READY"
          );

          setPoseStatus(
            "detecting"
          );

          await detector.send({
            image: currentVideo,
          });
        } catch (error) {
          setPoseDetectorStatus(
            "ERROR"
          );

          setPoseError(
            `${error?.name || "PoseInferenceError"}: ${
              error?.message ||
              "Unknown pose inference error"
            }`
          );

          setCameraError(
            getCameraErrorMessage(
              error
            )
          );

          setPoseStatus("error");
          setFrameLoopStatus(
            "NOT RUNNING"
          );

          return;
        }

        animationFrameRef.current =
          requestAnimationFrame(
            frameLoop
          );
      };

      animationFrameRef.current =
        requestAnimationFrame(
          frameLoop
        );
    }, [exerciseMeta, landmarks.length]);

  /*
   * ============================================================
   * MOBILE-SAFE CAMERA INITIALIZATION
   * ============================================================
   *
   * Analyzer logic is not changed below.
   */
  const startCamera = useCallback(
    async () => {
      if (!exerciseMeta) return;

      // Prevent duplicate getUserMedia calls.
      if (cameraStartPromiseRef.current) {
        return cameraStartPromiseRef.current;
      }

      // Already running.
      if (
        streamRef.current &&
        cameraActiveRef.current
      ) {
        return;
      }

      const startPromise =
        (async () => {
          setCameraStatus("starting");
          setCameraError("");
          setGetUserMediaError("");
          setPoseStatus("loading");

          /*
           * Check camera API support before
           * calling getUserMedia.
           */
          if (
            typeof navigator ===
              "undefined" ||
            !navigator.mediaDevices ||
            typeof navigator.mediaDevices
              .getUserMedia !==
              "function"
          ) {
            setCameraStatus(
              "error"
            );

            setCameraError(
              "Your browser does not support camera access."
            );

            setGetUserMediaError(
              "navigator.mediaDevices.getUserMedia is unavailable."
            );

            return;
          }

          /*
           * Camera permission diagnostic.
           * Permissions API is optional, so failure
           * here does not prevent camera startup.
           */
          try {
            if (
              navigator.permissions?.query
            ) {
              const permission =
                await navigator.permissions.query(
                  {
                    name: "camera",
                  }
                );

              setCameraPermissionState(
                permission.state
              );

              permission.onchange =
                () => {
                  setCameraPermissionState(
                    permission.state
                  );
                };
            }
          } catch {
            setCameraPermissionState(
              "UNKNOWN"
            );
          }

          /*
           * The video element must already
           * be mounted.
           */
          const video =
            videoRef.current;

          if (!video) {
            setCameraStatus(
              "error"
            );

            setCameraError(
              "Unable to start video preview."
            );

            setGetUserMediaError(
              "Video element is not mounted."
            );

            return;
          }

          /*
           * Mobile-safe video properties.
           */
          video.autoplay = true;
          video.playsInline = true;
          video.muted = true;

          let stream = null;

          try {
            /*
             * Prefer rear/environment camera.
             *
             * "ideal" is intentionally used so that
             * the browser can fall back to another
             * available camera.
             */
            const cameraConstraints = {
              video: {
                facingMode: {
                  ideal: "environment",
                },
                width: {
                  ideal: 1280,
                },
                height: {
                  ideal: 720,
                },
              },
              audio: false,
            };

            try {
              stream =
                await navigator.mediaDevices.getUserMedia(
                  cameraConstraints
                );
            } catch (error) {
              /*
               * If the preferred configuration cannot
               * be satisfied, request any available
               * video camera.
               */
              if (
                error?.name ===
                  "OverconstrainedError" ||
                error?.name ===
                  "ConstraintNotSatisfiedError"
              ) {
                stream =
                  await navigator.mediaDevices.getUserMedia(
                    {
                      video: true,
                      audio: false,
                    }
                  );
              } else {
                throw error;
              }
            }

            streamRef.current =
              stream;

            /*
             * Make sure the video element
             * still exists.
             */
            if (!videoRef.current) {
              stream
                .getTracks()
                .forEach((track) =>
                  track.stop()
                );

              streamRef.current =
                null;

              setCameraStatus(
                "error"
              );

              setCameraError(
                "Unable to start video preview."
              );

              setGetUserMediaError(
                "Video element disappeared before stream assignment."
              );

              return;
            }

            const currentVideo =
              videoRef.current;

            currentVideo.autoplay =
              true;

            currentVideo.playsInline =
              true;

            currentVideo.muted =
              true;

            /*
             * Attach MediaStream to video.
             */
            currentVideo.srcObject =
              stream;

            setVideoElementStatus(
              "FOUND"
            );

            setVideoSrcObjectStatus(
              currentVideo.srcObject
                ? "CONNECTED"
                : "NOT CONNECTED"
            );

            setCameraPermissionState(
              "granted"
            );

            setGetUserMediaError(
              ""
            );

            /*
             * Wait until browser has usable
             * video metadata.
             */
            await waitForVideo(
              currentVideo
            );

            const nextVideoWidth =
              currentVideo.videoWidth ||
              0;

            const nextVideoHeight =
              currentVideo.videoHeight ||
              0;

            setVideoReady(
              nextVideoWidth > 0 &&
                nextVideoHeight > 0
            );

            setVideoDimensions({
              width: nextVideoWidth,
              height: nextVideoHeight,
            });

            setVideoReadyState(
              currentVideo.readyState ||
                0
            );

            setVideoElementStatus(
              "FOUND"
            );

            setVideoSrcObjectStatus(
              currentVideo.srcObject
                ? "CONNECTED"
                : "NOT CONNECTED"
            );

            /*
             * Explicitly call play().
             *
             * This is important for mobile browsers.
             */
            try {
              await currentVideo.play();
            } catch (playError) {
              console.error(
                "Video playback failed:",
                playError
              );

              setCameraStatus(
                "error"
              );

              setCameraError(
                "Unable to start video preview."
              );

              setGetUserMediaError(
                `${
                  playError?.name ||
                  "PlaybackError"
                }: ${
                  playError?.message ||
                  "Video playback failed."
                }`
              );

              stream
                .getTracks()
                .forEach((track) =>
                  track.stop()
                );

              streamRef.current =
                null;

              currentVideo.srcObject =
                null;

              return;
            }

            /*
             * Camera and video are actually ready.
             */
            cameraActiveRef.current =
              true;

            setCameraStatus(
              "active"
            );

            setPoseStatus(
              "detecting"
            );

            setDebugSnapshot({
              camera: "active",
              video:
                nextVideoWidth > 0 &&
                nextVideoHeight > 0
                  ? "READY"
                  : "NOT READY",
              poseDetector:
                "INITIALIZING",
              poseInference:
                "NOT RECEIVING",
              landmarks: 0,
              analyzer:
                exerciseMeta?.analyzer
                  ? exerciseMeta.analyzer.toUpperCase()
                  : "INACTIVE",
              metrics: "INACTIVE",
              frameLoop: "RUNNING",
              framesSent: 0,
            });

            /*
             * Existing pose detector pipeline.
             * DO NOT change analyzer logic.
             */
            if (
              !poseDetectorRef.current
            ) {
              setPoseDetectorStatus(
                "INITIALIZING"
              );

              try {
                poseDetectorRef.current =
                  await createPoseDetector(
                    handlePoseResults
                  );

                setPoseDetectorStatus(
                  "READY"
                );

                setPoseError("");
              } catch (error) {
                setPoseDetectorStatus(
                  "ERROR"
                );

                setPoseError(
                  `${
                    error?.name ||
                    "PoseDetectorError"
                  }: ${
                    error?.message ||
                    "Unknown pose detector initialization error"
                  }`
                );

                setPoseStatus(
                  "error"
                );

                setCameraError(
                  "Unable to initialize pose detection."
                );

                return;
              }
            }

            /*
             * Existing analyzer processing pipeline.
             */
            startPoseProcessing();
          } catch (error) {
            console.error(
              "Camera initialization error:",
              error
            );

            if (stream) {
              stream
                .getTracks()
                .forEach((track) =>
                  track.stop()
                );
            }

            streamRef.current =
              null;

            cameraActiveRef.current =
              false;

            setCameraStatus(
              "error"
            );

            setPoseStatus(
              "error"
            );

            setGetUserMediaError(
              `${
                error?.name ||
                "UnknownError"
              }: ${
                error?.message ||
                "Unknown camera error."
              }`
            );

            setCameraError(
              getCameraErrorMessage(
                error
              )
            );
          }
        })();

      cameraStartPromiseRef.current =
        startPromise;

      try {
        await startPromise;
      } finally {
        cameraStartPromiseRef.current =
          null;
      }
    },
    [
      exerciseMeta,
      handlePoseResults,
      startPoseProcessing,
    ]
  );

  const activeExerciseName =
    exerciseMeta?.name ||
    "Unsupported exercise";

  const feedbackList = useMemo(() => {
    const items =
      Array.isArray(
        analysisResult?.feedback
      )
        ? analysisResult.feedback
        : [
            "Move into a clear position so I can analyze your form.",
          ];

    return items.map(
      (item, index) => {
        const value =
          typeof item === "string" &&
          item.trim()
            ? item
            : "No feedback available.";

        return (
          <div
            key={`${value}-${index}`}
            style={{
              padding:
                "12px 14px",
              borderRadius:
                "14px",
              background:
                "rgba(255,255,255,0.04)",
              color:
                value.startsWith("✅")
                  ? "#9ee7ff"
                  : "#fbbf24",
            }}
          >
            {value}
          </div>
        );
      }
    );
  }, [analysisResult]);

  /*
   * DEV-only diagnostics.
   *
   * These values are calculated only for the
   * development diagnostic section below.
   */
  const isMobile =
    typeof navigator !==
      "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(
      navigator.userAgent
    );

  const browser =
    typeof navigator !==
      "undefined"
      ? navigator.userAgent
      : "UNKNOWN";

  const mediaDevicesAvailable =
    typeof navigator !==
      "undefined" &&
    Boolean(
      navigator.mediaDevices
    );

  const getUserMediaAvailable =
    mediaDevicesAvailable &&
    typeof navigator.mediaDevices
      .getUserMedia ===
      "function";

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #050b18 0%, #0d172a 100%)",
        color: "#edf6ff",
        padding: "32px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gap: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                fontSize: "1.8rem",
              }}
            >
              ⚡
            </div>

            <div>
              <div
                style={{
                  fontWeight: 800,
                  letterSpacing:
                    "0.14em",
                  textTransform:
                    "uppercase",
                  color: "#8fe7ff",
                }}
              >
                AI FORM ANALYZER
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            style={{
              background:
                "rgba(255,255,255,0.06)",
              border:
                "1px solid rgba(255,255,255,0.1)",
              color: "#edf6ff",
              padding:
                "10px 16px",
              borderRadius:
                "12px",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>

        {!isSupportedExercise ? (
          <div
            style={{
              border:
                "1px solid rgba(255,255,255,0.1)",
              background:
                "rgba(17,24,39,0.9)",
              borderRadius:
                "20px",
              padding: "24px",
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 12px",
                color: "#f8fafc",
              }}
            >
              AI Form Analyzer
            </h2>

            <p
              style={{
                margin: 0,
                color: "#fbbf24",
              }}
            >
              Form Analyzer currently
              supports Push-Ups and Squats
              only.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gap: "20px",
                gridTemplateColumns:
                  "1.5fr 0.9fr",
                alignItems:
                  "start",
              }}
            >
              <div
                style={{
                  border:
                    "1px solid rgba(255,255,255,0.1)",
                  background:
                    "rgba(17,24,39,0.9)",
                  borderRadius:
                    "22px",
                  padding: "18px",
                  display: "grid",
                  gap: "18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color:
                          "#96a0b8",
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          "0.14em",
                        fontSize:
                          "0.72rem",
                      }}
                    >
                      Exercise
                    </div>

                    <h2
                      style={{
                        margin:
                          "6px 0 0",
                        color:
                          "#f8fafc",
                        fontSize:
                          "2rem",
                      }}
                    >
                      {
                        activeExerciseName
                      }
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={
                      cameraStatus ===
                      "active"
                        ? stopCamera
                        : startCamera
                    }
                    style={{
                      background:
                        cameraStatus ===
                        "active"
                          ? "rgba(255,87,87,0.2)"
                          : "linear-gradient(135deg, #0fffc1, #3d8dff)",
                      border: "none",
                      color:
                        cameraStatus ===
                        "active"
                          ? "#fff"
                          : "#050a17",
                      borderRadius:
                        "12px",
                      padding:
                        "12px 18px",
                      fontWeight: 700,
                      cursor:
                        "pointer",
                    }}
                  >
                    {cameraStatus ===
                    "active"
                      ? "Stop Camera"
                      : cameraStatus ===
                        "error"
                      ? "Retry Camera"
                      : "Start Camera"}
                  </button>
                </div>

                <div
                  style={{
                    position:
                      "relative",
                    background:
                      "#000",
                    borderRadius:
                      "18px",
                    overflow:
                      "hidden",
                    aspectRatio:
                      "16 / 9",
                    border:
                      "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit:
                        "cover",
                      display:
                        "block",
                    }}
                  />

                  {!cameraError &&
                    cameraStatus !==
                      "active" && (
                      <div
                        style={{
                          position:
                            "absolute",
                          inset: 0,
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          background:
                            "rgba(0,0,0,0.4)",
                          color:
                            "#d7ebff",
                          fontSize:
                            "1rem",
                          fontWeight: 600,
                        }}
                      >
                        {cameraStatus ===
                        "starting"
                          ? "Starting camera..."
                          : "Camera is idle."}
                      </div>
                    )}
                </div>

                {cameraError ? (
                  <div
                    style={{
                      padding:
                        "14px 16px",
                      background:
                        "rgba(255, 87, 87, 0.12)",
                      border:
                        "1px solid rgba(255, 87, 87, 0.35)",
                      color:
                        "#ffd7d7",
                      borderRadius:
                        "14px",
                    }}
                  >
                    {cameraError}
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "18px",
                }}
              >
                <div
                  style={{
                    border:
                      "1px solid rgba(255,255,255,0.1)",
                    background:
                      "rgba(17,24,39,0.9)",
                    borderRadius:
                      "20px",
                    padding: "22px",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#96a0b8",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.12em",
                      fontSize:
                        "0.72rem",
                    }}
                  >
                    Form Score
                  </div>

                  <div
                    style={{
                      marginTop:
                        "12px",
                      fontSize:
                        "3rem",
                      fontWeight:
                        800,
                      color:
                        "#f8fafc",
                    }}
                  >
                    {Number.isFinite(
                      analysisResult.formScore
                    )
                      ? Math.round(
                          analysisResult.formScore
                        )
                      : "N/A"}
                    %
                  </div>
                </div>

                <div
                  style={{
                    border:
                      "1px solid rgba(255,255,255,0.1)",
                    background:
                      "rgba(17,24,39,0.9)",
                    borderRadius:
                      "20px",
                    padding: "22px",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#96a0b8",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.12em",
                      fontSize:
                        "0.72rem",
                    }}
                  >
                    Repetitions
                  </div>

                  <div
                    style={{
                      marginTop:
                        "12px",
                      fontSize:
                        "2.5rem",
                      fontWeight:
                        800,
                      color:
                        "#f8fafc",
                    }}
                  >
                    {analysisResult.repCount ??
                      0}
                  </div>
                </div>

                <div
                  style={{
                    border:
                      "1px solid rgba(255,255,255,0.1)",
                    background:
                      "rgba(17,24,39,0.9)",
                    borderRadius:
                      "20px",
                    padding: "22px",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#96a0b8",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.12em",
                      fontSize:
                        "0.72rem",
                    }}
                  >
                    Status
                  </div>

                  <div
                    style={{
                      marginTop:
                        "12px",
                      display:
                        "grid",
                      gap: "8px",
                      color:
                        "#edf6ff",
                    }}
                  >
                    <div>
                      Camera:{" "}
                      {
                        cameraStatus
                      }
                    </div>

                    <div>
                      Pose:{" "}
                      {
                        poseStatus
                      }
                    </div>

                    <div>
                      Landmarks:{" "}
                      {landmarks.length ||
                        analysisResult.landmarkCount ||
                        0}
                    </div>

                    <div>
                      Phase:{" "}
                      {analysisResult.phase ||
                        "READY"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                border:
                  "1px solid rgba(255,255,255,0.1)",
                background:
                  "rgba(17,24,39,0.9)",
                borderRadius:
                  "20px",
                padding: "22px",
              }}
            >
              <div
                style={{
                  color:
                    "#96a0b8",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "0.12em",
                  fontSize:
                    "0.72rem",
                }}
              >
                Feedback
              </div>

              <div
                style={{
                  marginTop:
                    "12px",
                  display:
                    "grid",
                  gap: "10px",
                }}
              >
                {feedbackList}
              </div>
            </div>

            {import.meta.env.DEV && (
              <div
                style={{
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  background:
                    "rgba(7,12,22,0.95)",
                  borderRadius:
                    "16px",
                  padding: "18px",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    marginBottom:
                      "10px",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#8fe7ff",
                      fontWeight:
                        700,
                    }}
                  >
                    DEV DEBUG
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (
                          navigator.clipboard
                        ) {
                          await navigator.clipboard.writeText(
                            JSON.stringify(
                              {
                                exercise:
                                  activeExerciseName,
                                cameraStatus,
                                poseStatus,
                                landmarks:
                                  landmarks.length,
                                analysisResult,
                                browser,
                                isMobile,
                                mediaDevicesAvailable,
                                getUserMediaAvailable,
                                cameraPermissionState,
                                streamCreated:
                                  Boolean(
                                    streamRef.current
                                  ),
                                videoReadyState:
                                  videoRef.current?.readyState ??
                                  videoReadyState,
                                videoWidth:
                                  videoRef.current?.videoWidth ??
                                  videoDimensions.width,
                                videoHeight:
                                  videoRef.current?.videoHeight ??
                                  videoDimensions.height,
                                getUserMediaError,
                              },
                              null,
                              2
                            )
                          );
                        }
                      } catch {
                        // Ignore clipboard errors.
                      }
                    }}
                    style={{
                      background:
                        "transparent",
                      border:
                        "1px solid rgba(255,255,255,0.08)",
                      color:
                        "#d8eaff",
                      borderRadius:
                        "8px",
                      padding:
                        "6px 10px",
                      cursor:
                        "pointer",
                    }}
                  >
                    Copy Debug Snapshot
                  </button>
                </div>

                <div
                  style={{
                    display:
                      "grid",
                    gap: "8px",
                    fontSize:
                      "0.88rem",
                    color:
                      "#dfeaf8",
                  }}
                >
                  <div>
                    Browser:{" "}
                    {browser}
                  </div>

                  <div>
                    Mobile:{" "}
                    {isMobile
                      ? "YES"
                      : "NO"}
                  </div>

                  <div>
                    navigator.mediaDevices:{" "}
                    {mediaDevicesAvailable
                      ? "AVAILABLE"
                      : "NOT AVAILABLE"}
                  </div>

                  <div>
                    getUserMedia:{" "}
                    {getUserMediaAvailable
                      ? "AVAILABLE"
                      : "NOT AVAILABLE"}
                  </div>

                  <div>
                    Camera Permission:{" "}
                    {
                      cameraPermissionState
                    }
                  </div>

                  <div>
                    Stream Created:{" "}
                    {streamRef.current
                      ? "YES"
                      : "NO"}
                  </div>

                  <div>
                    Video Ready State:{" "}
                    {videoRef.current
                      ?.readyState ??
                      videoReadyState}
                  </div>

                  <div>
                    Video Width:{" "}
                    {videoRef.current
                      ?.videoWidth ??
                      videoDimensions.width}
                  </div>

                  <div>
                    Video Height:{" "}
                    {videoRef.current
                      ?.videoHeight ??
                      videoDimensions.height}
                  </div>

                  <div>
                    getUserMedia Error:{" "}
                    {getUserMediaError ||
                      "NONE"}
                  </div>

                  <div>
                    Selected Exercise:{" "}
                    {exerciseMeta?.name ||
                      "UNKNOWN"}
                  </div>

                  <div>
                    Selected Elbow:{" "}
                    {analysisResult.selectedElbow ||
                      "NONE"}
                  </div>

                  <div>
                    Movement Classification:{" "}
                    {analysisResult.movementClassification ||
                      "UNKNOWN"}
                  </div>

                  <div>
                    Movement Confidence:{" "}
                    {analysisResult.movementConfidence ??
                      0}
                    %
                  </div>

                  <div>
                    Primary Metric:{" "}
                    {analysisResult.primaryMetric !=
                    null
                      ? `${analysisResult.primaryMetric}`
                      : "N/A"}
                  </div>

                  <div>
                    Secondary Metric:{" "}
                    {analysisResult.secondaryMetric !=
                    null
                      ? `${analysisResult.secondaryMetric}`
                      : "N/A"}
                  </div>

                  <div>
                    Exercise:{" "}
                    {activeExerciseName}
                  </div>

                  <div>
                    Camera:{" "}
                    {cameraStatus}
                  </div>

                  <div>
                    Video Element:{" "}
                    {
                      videoElementStatus
                    }
                  </div>

                  <div>
                    Video Ready State:{" "}
                    {
                      videoReadyState
                    }
                  </div>

                  <div>
                    Video Width:{" "}
                    {videoDimensions.width ||
                      0}
                  </div>

                  <div>
                    Video Height:{" "}
                    {videoDimensions.height ||
                      0}
                  </div>

                  <div>
                    Video Src Object:{" "}
                    {
                      videoSrcObjectStatus
                    }
                  </div>

                  <div>
                    Video:{" "}
                    {videoReady
                      ? "READY"
                      : "NOT READY"}
                  </div>

                  <div>
                    Frame Loop:{" "}
                    {
                      frameLoopStatus
                    }
                  </div>

                  <div>
                    Frames Sent:{" "}
                    {framesSent}
                  </div>

                  <div>
                    Pose Detector:{" "}
                    {
                      poseDetectorStatus
                    }
                  </div>

                  <div>
                    Pose Result:{" "}
                    {
                      poseResultStatus
                    }
                  </div>

                  <div>
                    Last Pose Result:{" "}
                    {lastPoseResultTimestamp
                      ? new Date(
                          lastPoseResultTimestamp
                        ).toLocaleTimeString()
                      : "N/A"}
                  </div>

                  <div>
                    Pose:{" "}
                    {poseStatus}
                  </div>

                  <div>
                    Landmarks:{" "}
                    {landmarks.length ||
                      analysisResult.landmarkCount ||
                      0}
                  </div>

                  <div>
                    Confidence:{" "}
                    {analysisResult.confidence ??
                      0}
                    %
                  </div>

                  <div>
                    Phase:{" "}
                    {analysisResult.phase ||
                      "READY"}
                  </div>

                  <div>
                    Left Elbow:{" "}
                    {analysisResult.metrics
                        ?.leftElbowAngle !=
                      null
                      ? `${analysisResult.metrics.leftElbowAngle.toFixed(
                          1
                        )}°`
                      : "N/A"}
                  </div>

                  <div>
                    Right Elbow:{" "}
                    {analysisResult.metrics
                        ?.rightElbowAngle !=
                      null
                      ? `${analysisResult.metrics.rightElbowAngle.toFixed(
                          1
                        )}°`
                      : "N/A"}
                  </div>

                  <div>
                    Left Knee:{" "}
                    {analysisResult.metrics
                        ?.leftKneeAngle !=
                      null
                      ? `${analysisResult.metrics.leftKneeAngle.toFixed(
                          1
                        )}°`
                      : "N/A"}
                  </div>

                  <div>
                    Right Knee:{" "}
                    {analysisResult.metrics
                        ?.rightKneeAngle !=
                      null
                      ? `${analysisResult.metrics.rightKneeAngle.toFixed(
                          1
                        )}°`
                      : "N/A"}
                  </div>

                  <div>
                    Left Hip:{" "}
                    {analysisResult.metrics
                        ?.leftHipAngle !=
                      null
                      ? `${analysisResult.metrics.leftHipAngle.toFixed(
                          1
                        )}°`
                      : "N/A"}
                  </div>

                  <div>
                    Right Hip:{" "}
                    {analysisResult.metrics
                        ?.rightHipAngle !=
                      null
                      ? `${analysisResult.metrics.rightHipAngle.toFixed(
                          1
                        )}°`
                      : "N/A"}
                  </div>

                  <div>
                    Movement:{" "}
                    {analysisResult.currentAngle !=
                    null
                      ? `${analysisResult.currentAngle.toFixed(
                          1
                        )}°`
                      : "N/A"}
                  </div>

                  <div>
                    Last Transition:{" "}
                    {analysisResult.trace
                        ?.lastTransition ||
                      "READY"}
                  </div>

                  <div>
                    Why:{" "}
                    {analysisResult.trace
                        ?.why ||
                      "Waiting for movement."}
                  </div>

                  <div>
                    REP BLOCKED REASON:{" "}
                    {analysisResult.repBlockedReason ||
                      "—"}
                  </div>

                  <div>
                    Wrong Exercise:{" "}
                    {analysisResult.wrongExercise
                      ? "YES"
                      : "NO"}
                  </div>

                  <div>
                    Metrics:{" "}
                    {JSON.stringify(
                      analysisResult.metrics ||
                        {}
                    )}
                  </div>

                  <div>
                    Form Score:{" "}
                    {Number.isFinite(
                      analysisResult.formScore
                    )
                      ? `${Math.round(
                          analysisResult.formScore
                        )}%`
                      : "N/A"}
                  </div>

                  <div>
                    Rep Count:{" "}
                    {analysisResult.repCount ??
                      0}
                  </div>

                  <div>
                    Feedback:{" "}
                    {Array.isArray(
                      analysisResult.feedback
                    )
                      ? analysisResult.feedback.join(
                          " | "
                        )
                      : "N/A"}
                  </div>

                  {poseError ? (
                    <div>
                      Pose Inference Error:{" "}
                      {poseError}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default FormChecker;