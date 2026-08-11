import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { createPoseDetector } from "../ai/poseDetection.js";

/* ============================================================
   EXERCISE CONFIG
============================================================ */

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
  feedback: [
    "Move into a clear position so I can analyze your form.",
  ],
};

/* ============================================================
   LANDMARK INDEX MAP
============================================================ */

const LANDMARK_INDEX = {
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

/* ============================================================
   HELPERS
============================================================ */

function normalizeExerciseId(value) {
  if (!value) return "";

  const lowered = String(value)
    .trim()
    .toLowerCase();

  const normalized = lowered.replace(
    /[_\s]+/g,
    "-"
  );

  if (
    normalized === "pushup" ||
    normalized === "push-up"
  ) {
    return "push-up";
  }

  if (
    normalized === "squat" ||
    normalized === "squats"
  ) {
    return "squat";
  }

  if (
    normalized === "situp" ||
    normalized === "sit-up"
  ) {
    return "sit-up";
  }

  return "";
}

function safeNumber(value) {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : null;
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

function isVisible(point) {
  if (!point) return false;

  const visibility =
    typeof point.visibility === "number"
      ? point.visibility
      : 1;

  const presence =
    typeof point.presence === "number"
      ? point.presence
      : 1;

  return (
    visibility >= 0.25 &&
    presence >= 0.25
  );
}

function getAngle(
  pointA,
  pointB,
  pointC
) {
  if (!pointA || !pointB || !pointC) {
    return null;
  }

  const ab = {
    x: pointA.x - pointB.x,
    y: pointA.y - pointB.y,
  };

  const cb = {
    x: pointC.x - pointB.x,
    y: pointC.y - pointB.y,
  };

  const magAB = Math.hypot(
    ab.x,
    ab.y
  );

  const magCB = Math.hypot(
    cb.x,
    cb.y
  );

  if (!magAB || !magCB) {
    return null;
  }

  const dot =
    ab.x * cb.x +
    ab.y * cb.y;

  const cosine = Math.max(
    -1,
    Math.min(
      1,
      dot / (magAB * magCB)
    )
  );

  return (
    (Math.acos(cosine) * 180) /
    Math.PI
  );
}

function averageNumbers(values) {
  const valid = values.filter(
    (value) =>
      typeof value === "number" &&
      Number.isFinite(value)
  );

  if (!valid.length) {
    return null;
  }

  return (
    valid.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / valid.length
  );
}

/* ============================================================
   ROBUST LANDMARK EXTRACTION
============================================================ */

function unwrapLandmarks(value) {
  if (!value) return [];

  if (
    Array.isArray(value) &&
    value.length > 0 &&
    Array.isArray(value[0])
  ) {
    return value[0];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [];
}

function normalizeLandmarksMap(rawLandmarks) {
  if (!rawLandmarks) {
    return {};
  }

  /*
   * Direct array:
   * [33 landmarks]
   *
   * Nested MediaPipe style:
   * [[33 landmarks]]
   */
  const array =
    unwrapLandmarks(rawLandmarks);

  if (array.length) {
    const map = {};

    array.forEach(
      (landmark, index) => {
        const key =
          LANDMARK_INDEX[index];

        if (
          key &&
          landmark &&
          typeof landmark.x ===
            "number" &&
          typeof landmark.y ===
            "number"
        ) {
          map[key] = landmark;
        }
      }
    );

    return map;
  }

  /*
   * Already-normalized object.
   */
  if (
    typeof rawLandmarks ===
      "object" &&
    !Array.isArray(rawLandmarks)
  ) {
    return rawLandmarks;
  }

  return {};
}

/* ============================================================
   EXTRACT POSE RESULT
============================================================ */

function extractPoseLandmarks(results) {
  if (!results) {
    return [];
  }

  const candidates = [
    results.poseLandmarks,
    results.landmarksArray,
    results.landmarks,
    results.pose?.landmarks,
    results.pose?.poseLandmarks,
    results.results?.poseLandmarks,
    results.results?.landmarks,
  ];

  for (const candidate of candidates) {
    const landmarks =
      unwrapLandmarks(candidate);

    if (
      Array.isArray(landmarks) &&
      landmarks.length > 0
    ) {
      return landmarks;
    }
  }

  return [];
}

/* ============================================================
   PUSH-UP GEOMETRY
============================================================ */

function getElbowAngle(
  landmarks,
  side
) {
  return getAngle(
    getPoint(
      landmarks,
      `${side}_shoulder`
    ),
    getPoint(
      landmarks,
      `${side}_elbow`
    ),
    getPoint(
      landmarks,
      `${side}_wrist`
    )
  );
}

function getKneeAngle(
  landmarks,
  side
) {
  return getAngle(
    getPoint(
      landmarks,
      `${side}_hip`
    ),
    getPoint(
      landmarks,
      `${side}_knee`
    ),
    getPoint(
      landmarks,
      `${side}_ankle`
    )
  );
}

function getHipAngle(
  landmarks,
  side
) {
  return getAngle(
    getPoint(
      landmarks,
      `${side}_shoulder`
    ),
    getPoint(
      landmarks,
      `${side}_hip`
    ),
    getPoint(
      landmarks,
      `${side}_knee`
    )
  );
}

function getTorsoDistance(landmarks) {
  const leftShoulder =
    getPoint(
      landmarks,
      "left_shoulder"
    );

  const rightShoulder =
    getPoint(
      landmarks,
      "right_shoulder"
    );

  const leftHip =
    getPoint(
      landmarks,
      "left_hip"
    );

  const rightHip =
    getPoint(
      landmarks,
      "right_hip"
    );

  if (
    !leftShoulder ||
    !rightShoulder ||
    !leftHip ||
    !rightHip
  ) {
    return null;
  }

  const shoulderY =
    (leftShoulder.y +
      rightShoulder.y) /
    2;

  const hipY =
    (leftHip.y +
      rightHip.y) /
    2;

  return Math.abs(
    shoulderY - hipY
  );
}

/* ============================================================
   BEST PUSH-UP SIDE
============================================================ */

function getBestPushUpSide(
  landmarks
) {
  const leftAngle =
    getElbowAngle(
      landmarks,
      "left"
    );

  const rightAngle =
    getElbowAngle(
      landmarks,
      "right"
    );

  const leftElbow =
    getPoint(
      landmarks,
      "left_elbow"
    );

  const rightElbow =
    getPoint(
      landmarks,
      "right_elbow"
    );

  const leftVisible =
    isVisible(leftElbow) &&
    safeNumber(leftAngle) !== null;

  const rightVisible =
    isVisible(rightElbow) &&
    safeNumber(rightAngle) !== null;

  if (
    leftVisible &&
    rightVisible
  ) {
    /*
     * Prefer the side whose elbow angle
     * is more useful for movement tracking.
     */
    return Math.abs(
      leftAngle - 90
    ) <
      Math.abs(
        rightAngle - 90
      )
      ? {
          side: "LEFT",
          angle: leftAngle,
        }
      : {
          side: "RIGHT",
          angle: rightAngle,
        };
  }

  if (leftVisible) {
    return {
      side: "LEFT",
      angle: leftAngle,
    };
  }

  if (rightVisible) {
    return {
      side: "RIGHT",
      angle: rightAngle,
    };
  }

  return {
    side: "NONE",
    angle: null,
  };
}

/* ============================================================
   PUSH-UP ANALYZER
============================================================ */

function buildPushUpAnalysis(
  landmarks,
  state
) {
  const leftElbowAngle =
    getElbowAngle(
      landmarks,
      "left"
    );

  const rightElbowAngle =
    getElbowAngle(
      landmarks,
      "right"
    );

  const validAngles = [
    leftElbowAngle,
    rightElbowAngle,
  ].filter(
    (value) =>
      safeNumber(value) !== null
  );

  if (!validAngles.length) {
    return {
      ...DEFAULT_ANALYSIS,
      exerciseId: "push-up",
      feedback: [
        "Move your full upper body into the camera view.",
      ],
      trace: {
        lastTransition:
          state.lastTransition,
        why:
          "No usable elbow landmarks.",
      },
      repBlockedReason:
        "Elbows not visible",
      selectedElbow: "NONE",
      currentAngle: null,
    };
  }

  const selected =
    getBestPushUpSide(
      landmarks
    );

  const currentAngle =
    selected.angle ??
    averageNumbers(
      validAngles
    );

  const previousAngle =
    safeNumber(
      state.lastAngle
    ) ?? currentAngle;

  let phase =
    state.phase || "READY";

  let repCount =
    Number.isFinite(
      state.repCount
    )
      ? state.repCount
      : 0;

  let lastTransition =
    state.lastTransition ||
    "READY";

  let why =
    state.lastReason ||
    "Waiting for movement.";

  let repBlockedReason = null;

  /*
   * READY
   *
   * Detect the beginning of downward movement.
   */
  if (phase === "READY") {
    if (
      previousAngle -
        currentAngle >=
        5 &&
      currentAngle <
        165
    ) {
      phase = "DESCENDING";

      lastTransition =
        "READY → DESCENDING";

      why = `Elbow ${previousAngle.toFixed(
        1
      )}° → ${currentAngle.toFixed(
        1
      )}°`;
    } else {
      repBlockedReason =
        "Waiting for downward movement";
    }
  }

  /*
   * DESCENDING
   *
   * Reach bottom.
   */
  else if (
    phase === "DESCENDING"
  ) {
    if (
      currentAngle <= 115
    ) {
      phase = "BOTTOM";

      lastTransition =
        "DESCENDING → BOTTOM";

      why = `Bottom reached at ${currentAngle.toFixed(
        1
      )}°`;
    } else {
      repBlockedReason =
        "Go lower";
    }
  }

  /*
   * BOTTOM
   *
   * Detect upward movement.
   */
  else if (
    phase === "BOTTOM"
  ) {
    if (
      currentAngle -
        previousAngle >=
        5
    ) {
      phase = "ASCENDING";

      lastTransition =
        "BOTTOM → ASCENDING";

      why = `Moving upward ${previousAngle.toFixed(
        1
      )}° → ${currentAngle.toFixed(
        1
      )}°`;
    } else {
      repBlockedReason =
        "Push upward";
    }
  }

  /*
   * ASCENDING
   *
   * Full extension completes rep.
   */
  else if (
    phase === "ASCENDING"
  ) {
    if (
      currentAngle >=
      150
    ) {
      repCount += 1;

      phase = "READY";

      lastTransition =
        "ASCENDING → READY";

      why = `Rep ${repCount} completed`;

      repBlockedReason = null;
    } else {
      repBlockedReason =
        "Fully extend your arms";
    }
  }

  /*
   * Feedback
   */
  let feedback = [
    "Get into push-up position.",
  ];

  if (
    phase === "DESCENDING"
  ) {
    feedback = [
      "Good. Lower your body with control.",
    ];
  } else if (
    phase === "BOTTOM"
  ) {
    feedback = [
      "Good depth. Push back up.",
    ];
  } else if (
    phase === "ASCENDING"
  ) {
    feedback = [
      "Keep pushing until your arms are extended.",
    ];
  } else if (
    phase === "READY" &&
    repCount > 0
  ) {
    feedback = [
      `Great! ${repCount} push-up${
        repCount === 1
          ? ""
          : "s"
      } completed.`,
    ];
  }

  /*
   * Form score:
   *
   * Best score around 90°.
   */
  const formScore =
    currentAngle !== null
      ? Math.max(
          0,
          Math.min(
            100,
            100 -
              Math.abs(
                currentAngle -
                  90
              ) *
                0.5
          )
        )
      : 0;

  return {
    exerciseId: "push-up",
    poseDetected: true,
    landmarkCount: 33,
    confidence: 100,
    phase,
    metrics: {
      leftElbowAngle:
        safeNumber(
          leftElbowAngle
        ),
      rightElbowAngle:
        safeNumber(
          rightElbowAngle
        ),
      movementMetric: {
        leftElbowAngle:
          safeNumber(
            leftElbowAngle
          ),
        rightElbowAngle:
          safeNumber(
            rightElbowAngle
          ),
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
    selectedElbow:
      selected.side,
  };
}

/* ============================================================
   SQUAT ANALYZER
============================================================ */

function buildSquatAnalysis(
  landmarks,
  state
) {
  const leftKneeAngle =
    getKneeAngle(
      landmarks,
      "left"
    );

  const rightKneeAngle =
    getKneeAngle(
      landmarks,
      "right"
    );

  const leftHipAngle =
    getHipAngle(
      landmarks,
      "left"
    );

  const rightHipAngle =
    getHipAngle(
      landmarks,
      "right"
    );

  const validKneeAngles = [
    leftKneeAngle,
    rightKneeAngle,
  ].filter(
    (value) =>
      safeNumber(value) !== null
  );

  if (!validKneeAngles.length) {
    return {
      ...DEFAULT_ANALYSIS,
      exerciseId: "squat",
      feedback: [
        "Move your legs completely into the camera view.",
      ],
      trace: {
        lastTransition:
          state.lastTransition,
        why:
          "No usable knee landmarks.",
      },
      currentAngle: null,
    };
  }

  const currentAngle =
    averageNumbers(
      validKneeAngles
    );

  const previousAngle =
    safeNumber(
      state.lastAngle
    ) ?? currentAngle;

  let phase =
    state.phase || "READY";

  let repCount =
    Number.isFinite(
      state.repCount
    )
      ? state.repCount
      : 0;

  let lastTransition =
    state.lastTransition ||
    "READY";

  let why =
    state.lastReason ||
    "Waiting for movement.";

  /*
   * START DESCENT
   */
  if (
    phase === "READY" &&
    previousAngle -
      currentAngle >=
      5 &&
    currentAngle <
      165
  ) {
    phase = "DESCENDING";

    lastTransition =
      "READY → DESCENDING";

    why = `Knee ${previousAngle.toFixed(
      1
    )}° → ${currentAngle.toFixed(
      1
    )}°`;
  }

  /*
   * BOTTOM
   */
  else if (
    phase === "DESCENDING" &&
    currentAngle <=
      105
  ) {
    phase = "BOTTOM";

    lastTransition =
      "DESCENDING → BOTTOM";

    why = `Squat depth ${currentAngle.toFixed(
      1
    )}°`;
  }

  /*
   * START ASCENT
   */
  else if (
    phase === "BOTTOM" &&
    currentAngle -
      previousAngle >=
      5
  ) {
    phase = "ASCENDING";

    lastTransition =
      "BOTTOM → ASCENDING";

    why = `Standing up ${previousAngle.toFixed(
      1
    )}° → ${currentAngle.toFixed(
      1
    )}°`;
  }

  /*
   * COMPLETE REP
   */
  else if (
    phase === "ASCENDING" &&
    currentAngle >=
      155
  ) {
    repCount += 1;

    phase = "READY";

    lastTransition =
      "ASCENDING → READY";

    why = `Rep ${repCount} completed`;
  }

  let feedback = [
    "Stand in a clear position.",
  ];

  if (
    phase === "DESCENDING"
  ) {
    feedback = [
      "Control your descent.",
    ];
  } else if (
    phase === "BOTTOM"
  ) {
    feedback = [
      "Good depth. Drive upward.",
    ];
  } else if (
    phase === "ASCENDING"
  ) {
    feedback = [
      "Push through your feet and stand tall.",
    ];
  } else if (
    phase === "READY" &&
    repCount > 0
  ) {
    feedback = [
      `Great! ${repCount} squat${
        repCount === 1
          ? ""
          : "s"
      } completed.`,
    ];
  }

  const formScore =
    Math.max(
      0,
      Math.min(
        100,
        100 -
          Math.abs(
            currentAngle -
              90
          ) *
            0.4
      )
    );

  return {
    exerciseId: "squat",
    poseDetected: true,
    landmarkCount: 33,
    confidence: 100,
    phase,
    metrics: {
      leftKneeAngle:
        safeNumber(
          leftKneeAngle
        ),
      rightKneeAngle:
        safeNumber(
          rightKneeAngle
        ),
      leftHipAngle:
        safeNumber(
          leftHipAngle
        ),
      rightHipAngle:
        safeNumber(
          rightHipAngle
        ),
      movementMetric: {
        leftKneeAngle:
          safeNumber(
            leftKneeAngle
          ),
        rightKneeAngle:
          safeNumber(
            rightKneeAngle
          ),
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
    wrongExercise: false,
  };
}

/* ============================================================
   CAMERA ERROR
============================================================ */

function getCameraErrorMessage(
  error
) {
  const name =
    error?.name ||
    "UnknownError";

  if (
    name ===
      "NotAllowedError" ||
    name ===
      "PermissionDeniedError"
  ) {
    return "Camera permission denied. Allow camera access and try again.";
  }

  if (
    name ===
      "NotReadableError" ||
    name ===
      "TrackStartError"
  ) {
    return "Camera is being used by another application.";
  }

  if (
    name ===
      "NotFoundError" ||
    name ===
      "DevicesNotFoundError"
  ) {
    return "No usable camera was found.";
  }

  if (
    name ===
      "OverconstrainedError" ||
    name ===
      "ConstraintNotSatisfiedError"
  ) {
    return "The requested camera configuration is unavailable.";
  }

  if (
    name ===
    "SecurityError"
  ) {
    return "Camera access requires HTTPS or localhost.";
  }

  if (
    name ===
    "AbortError"
  ) {
    return "Camera startup was interrupted.";
  }

  return (
    error?.message ||
    "Unable to start camera."
  );
}

/* ============================================================
   VIDEO READY
============================================================ */

function waitForVideo(
  video
) {
  return new Promise(
    (resolve, reject) => {
      if (!video) {
        reject(
          new Error(
            "Video element not found."
          )
        );
        return;
      }

      const isReady =
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0;

      if (isReady) {
        resolve();
        return;
      }

      let finished = false;

      const cleanup =
        () => {
          video.removeEventListener(
            "loadedmetadata",
            handleReady
          );

          video.removeEventListener(
            "canplay",
            handleReady
          );

          video.removeEventListener(
            "playing",
            handleReady
          );

          video.removeEventListener(
            "error",
            handleError
          );

          clearTimeout(
            timeout
          );
        };

      const complete =
        () => {
          if (finished) return;

          if (
            video.readyState >= 2 &&
            video.videoWidth > 0 &&
            video.videoHeight > 0
          ) {
            finished = true;
            cleanup();
            resolve();
          }
        };

      const handleReady =
        () => {
          complete();
        };

      const handleError =
        () => {
          if (finished) return;

          finished = true;
          cleanup();

          reject(
            new Error(
              "Video stream failed."
            )
          );
        };

      const timeout =
        setTimeout(() => {
          if (finished) return;

          finished = true;
          cleanup();

          reject(
            new Error(
              "Timed out waiting for camera video."
            )
          );
        }, 10000);

      video.addEventListener(
        "loadedmetadata",
        handleReady
      );

      video.addEventListener(
        "canplay",
        handleReady
      );

      video.addEventListener(
        "playing",
        handleReady
      );

      video.addEventListener(
        "error",
        handleError
      );
    }
  );
}

/* ============================================================
   COMPONENT
============================================================ */

function FormChecker() {
  const navigate =
    useNavigate();

  const {
    exerciseId:
      routeExerciseId,
  } = useParams();

  const [
    searchParams,
  ] = useSearchParams();

  const requestedExerciseId =
    normalizeExerciseId(
      searchParams.get("id") ||
        routeExerciseId ||
        ""
    );

  const exerciseMeta =
    requestedExerciseId
      ? FORM_ANALYZERS[
          requestedExerciseId
        ]
      : null;

  const isSupportedExercise =
    Boolean(exerciseMeta);

  /* ============================================================
     STATE
  ============================================================ */

  const [
    cameraStatus,
    setCameraStatus,
  ] = useState("idle");

  const [
    poseStatus,
    setPoseStatus,
  ] = useState("loading");

  const [
    cameraError,
    setCameraError,
  ] = useState("");

  const [
    poseError,
    setPoseError,
  ] = useState("");

  const [
    landmarks,
    setLandmarks,
  ] = useState([]);

  const [
    analysisResult,
    setAnalysisResult,
  ] = useState({
    ...DEFAULT_ANALYSIS,
    exerciseId:
      requestedExerciseId,
  });

  const [
    videoReady,
    setVideoReady,
  ] = useState(false);

  const [
    videoDimensions,
    setVideoDimensions,
  ] = useState({
    width: 0,
    height: 0,
  });

  const [
    cameraPermissionState,
    setCameraPermissionState,
  ] = useState("UNKNOWN");

  const [
    framesSent,
    setFramesSent,
  ] = useState(0);

  const [
    poseDetectorStatus,
    setPoseDetectorStatus,
  ] = useState(
    "INITIALIZING"
  );

  const [
    poseResultStatus,
    setPoseResultStatus,
  ] = useState(
    "NOT RECEIVED"
  );

  const [
    frameLoopStatus,
    setFrameLoopStatus,
  ] = useState(
    "NOT RUNNING"
  );

  const [
    getUserMediaError,
    setGetUserMediaError,
  ] = useState("");

  /* ============================================================
     REFS
  ============================================================ */

  const videoRef =
    useRef(null);

  const streamRef =
    useRef(null);

  const poseDetectorRef =
    useRef(null);

  const animationFrameRef =
    useRef(null);

  const cameraStartPromiseRef =
    useRef(null);

  const cameraActiveRef =
    useRef(false);

  const inferenceRunningRef =
    useRef(false);

  const frameCounterRef =
    useRef(0);

  const lastAnalysisTimeRef =
    useRef(0);

  const lastUiUpdateRef =
    useRef(0);

  const analyzerStateRef =
    useRef({
      phase: "READY",
      repCount: 0,
      lastAngle: null,
      lastTransition:
        "READY",
      lastReason:
        "Waiting for movement.",
    });

  /*
   * Keep latest callback in a ref.
   *
   * This prevents the pose detector from holding
   * an outdated React callback.
   */
  const handlePoseResultsRef =
    useRef(null);

  /* ============================================================
     RESET EXERCISE
  ============================================================ */

  useEffect(() => {
    analyzerStateRef.current = {
      phase: "READY",
      repCount: 0,
      lastAngle: null,
      lastTransition:
        "READY",
      lastReason:
        "Waiting for movement.",
    };

    setAnalysisResult({
      ...DEFAULT_ANALYSIS,
      exerciseId:
        requestedExerciseId,
    });

    setLandmarks([]);

    setPoseError("");

    setCameraError("");

    setGetUserMediaError("");

    setPoseResultStatus(
      "NOT RECEIVED"
    );

    setPoseDetectorStatus(
      "INITIALIZING"
    );
  }, [
    requestedExerciseId,
  ]);

  /* ============================================================
     STOP CAMERA
  ============================================================ */

  const stopCamera =
    useCallback(() => {
      cameraActiveRef.current =
        false;

      inferenceRunningRef.current =
        false;

      cameraStartPromiseRef.current =
        null;

      if (
        animationFrameRef.current
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current =
          null;
      }

      if (
        streamRef.current
      ) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        streamRef.current =
          null;
      }

      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch {}

        videoRef.current.srcObject =
          null;
      }

      poseDetectorRef.current =
        null;

      setCameraStatus(
        "stopped"
      );

      setPoseStatus(
        "loading"
      );

      setFrameLoopStatus(
        "NOT RUNNING"
      );

      setPoseResultStatus(
        "NOT RECEIVED"
      );

      setLandmarks([]);

      setVideoReady(false);

      setVideoDimensions({
        width: 0,
        height: 0,
      });
    }, []);

  /* ============================================================
     CLEANUP
  ============================================================ */

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  /* ============================================================
     POSE RESULT HANDLER
  ============================================================ */

  const handlePoseResults =
    useCallback(
      (results) => {
        if (
          !exerciseMeta ||
          !cameraActiveRef.current
        ) {
          return;
        }

        const rawLandmarks =
          extractPoseLandmarks(
            results
          );

        const landmarksMap =
          normalizeLandmarksMap(
            rawLandmarks
          );

        const visibleKeys =
          Object.keys(
            landmarksMap
          ).filter((key) =>
            isVisible(
              getPoint(
                landmarksMap,
                key
              )
            )
          );

        const actualLandmarkCount =
          rawLandmarks.length ||
          visibleKeys.length;

        if (
          actualLandmarkCount >
          0
        ) {
          setPoseResultStatus(
            "RECEIVED"
          );

          setPoseStatus(
            "DETECTED"
          );

          setPoseError("");

          setLandmarks(
            visibleKeys.map(
              (key) =>
                landmarksMap[key]
            )
          );
        } else {
          /*
           * IMPORTANT:
           *
           * Do NOT immediately destroy the previous
           * analyzer state when one frame is bad.
           *
           * Camera pose detection occasionally produces
           * empty frames on mobile.
           */
          setPoseResultStatus(
            "NOT RECEIVED"
          );

          setPoseStatus(
            "NOT DETECTED"
          );

          return;
        }

        /*
         * Throttle analyzer calculations.
         *
         * Pose detection can run at 30-60 FPS,
         * while rep analysis only needs ~10 FPS.
         */
        const now =
          performance.now();

        if (
          now -
            lastAnalysisTimeRef.current <
          100
        ) {
          return;
        }

        lastAnalysisTimeRef.current =
          now;

        const state =
          analyzerStateRef.current;

        let next = null;

        /* ========================================================
           PUSH-UP
        ======================================================== */

        if (
          requestedExerciseId ===
          "push-up"
        ) {
          next =
            buildPushUpAnalysis(
              landmarksMap,
              state
            );

          analyzerStateRef.current =
            {
              phase:
                next.phase ||
                state.phase,
              repCount:
                next.repCount ??
                state.repCount,
              lastAngle:
                next.currentAngle ??
                state.lastAngle,
              lastTransition:
                next.trace
                  ?.lastTransition ||
                state.lastTransition,
              lastReason:
                next.repBlockedReason ||
                next.trace?.why ||
                state.lastReason,
            };

          setAnalysisResult({
            ...next,
            exerciseId:
              requestedExerciseId,
            landmarkCount:
              actualLandmarkCount,
            poseDetected: true,
            confidence:
              actualLandmarkCount >=
              10
                ? 95
                : 70,
            wrongExercise: false,
          });

          return;
        }

        /* ========================================================
           SQUAT
        ======================================================== */

        if (
          requestedExerciseId ===
          "squat"
        ) {
          next =
            buildSquatAnalysis(
              landmarksMap,
              state
            );

          analyzerStateRef.current =
            {
              phase:
                next.phase ||
                state.phase,
              repCount:
                next.repCount ??
                state.repCount,
              lastAngle:
                next.currentAngle ??
                state.lastAngle,
              lastTransition:
                next.trace
                  ?.lastTransition ||
                state.lastTransition,
              lastReason:
                next.trace?.why ||
                state.lastReason,
            };

          setAnalysisResult({
            ...next,
            exerciseId:
              requestedExerciseId,
            landmarkCount:
              actualLandmarkCount,
            poseDetected: true,
            confidence:
              actualLandmarkCount >=
              10
                ? 95
                : 70,
          });

          return;
        }

        /* ========================================================
           SIT-UP
        ======================================================== */

        if (
          requestedExerciseId ===
          "sit-up"
        ) {
          const torsoDistance =
            getTorsoDistance(
              landmarksMap
            );

          const hipKneeAngle =
            averageNumbers([
              getHipAngle(
                landmarksMap,
                "left"
              ),
              getHipAngle(
                landmarksMap,
                "right"
              ),
            ]);

          const shoulderY =
            averageNumbers([
              getPoint(
                landmarksMap,
                "left_shoulder"
              )?.y,
              getPoint(
                landmarksMap,
                "right_shoulder"
              )?.y,
            ]);

          const hipY =
            averageNumbers([
              getPoint(
                landmarksMap,
                "left_hip"
              )?.y,
              getPoint(
                landmarksMap,
                "right_hip"
              )?.y,
            ]);

          const torsoMetric =
            shoulderY !== null &&
            hipY !== null
              ? Math.abs(
                  shoulderY -
                    hipY
                )
              : torsoDistance;

          setAnalysisResult({
            ...DEFAULT_ANALYSIS,
            exerciseId:
              "sit-up",
            poseDetected: true,
            landmarkCount:
              actualLandmarkCount,
            confidence: 90,
            phase:
              state.phase,
            metrics: {
              torsoDistance:
                torsoMetric,
              hipKneeAngle,
            },
            repCount:
              state.repCount,
            formScore: 80,
            feedback: [
              "Sit-up pose detected. Continue controlled movement.",
            ],
          });

          return;
        }
      },
      [
        exerciseMeta,
        requestedExerciseId,
      ]
    );

  /*
   * Always keep latest callback.
   */
  useEffect(() => {
    handlePoseResultsRef.current =
      handlePoseResults;
  }, [
    handlePoseResults,
  ]);

  /* ============================================================
     CREATE POSE DETECTOR
  ============================================================ */

  const createDetector =
    useCallback(async () => {
      if (
        poseDetectorRef.current
      ) {
        return poseDetectorRef.current;
      }

      setPoseDetectorStatus(
        "INITIALIZING"
      );

      /*
       * Give detector a stable callback.
       */
      const detector =
        await createPoseDetector(
          (results) => {
            if (
              handlePoseResultsRef.current
            ) {
              handlePoseResultsRef.current(
                results
              );
            }
          }
        );

      poseDetectorRef.current =
        detector;

      setPoseDetectorStatus(
        "READY"
      );

      return detector;
    }, []);

  /* ============================================================
     FRAME PROCESSING
  ============================================================ */

  const startPoseProcessing =
    useCallback(() => {
      if (
        !exerciseMeta ||
        !videoRef.current
      ) {
        return;
      }

      if (
        !poseDetectorRef.current
      ) {
        return;
      }

      if (
        cameraActiveRef.current
      ) {
        /*
         * Already running.
         */
        if (
          animationFrameRef.current
        ) {
          return;
        }
      }

      cameraActiveRef.current =
        true;

      setFrameLoopStatus(
        "RUNNING"
      );

      const processFrame =
        async () => {
          if (
            !cameraActiveRef.current
          ) {
            animationFrameRef.current =
              null;

            return;
          }

          const video =
            videoRef.current;

          const detector =
            poseDetectorRef.current;

          if (
            !video ||
            !detector
          ) {
            animationFrameRef.current =
              requestAnimationFrame(
                processFrame
              );

            return;
          }

          const ready =
            video.readyState >=
              2 &&
            video.videoWidth >
              0 &&
            video.videoHeight >
              0 &&
            video.srcObject;

          if (!ready) {
            animationFrameRef.current =
              requestAnimationFrame(
                processFrame
              );

            return;
          }

          /*
           * CRITICAL:
           *
           * Do not send a second frame to MediaPipe
           * while the previous frame is still processing.
           *
           * This prevents mobile flickering and
           * inference backlog.
           */
          if (
            !inferenceRunningRef.current
          ) {
            inferenceRunningRef.current =
              true;

            frameCounterRef.current +=
              1;

            try {
              await detector.send({
                image: video,
              });

              if (
                frameCounterRef.current %
                  10 ===
                0
              ) {
                setFramesSent(
                  frameCounterRef.current
                );
              }
            } catch (error) {
              console.error(
                "Pose inference error:",
                error
              );

              setPoseDetectorStatus(
                "ERROR"
              );

              setPoseStatus(
                "error"
              );

              setPoseError(
                `${
                  error?.name ||
                  "PoseInferenceError"
                }: ${
                  error?.message ||
                  "Pose inference failed."
                }`
              );
            } finally {
              inferenceRunningRef.current =
                false;
            }
          }

          if (
            cameraActiveRef.current
          ) {
            animationFrameRef.current =
              requestAnimationFrame(
                processFrame
              );
          } else {
            animationFrameRef.current =
              null;
          }
        };

      animationFrameRef.current =
        requestAnimationFrame(
          processFrame
        );
    }, [
      exerciseMeta,
    ]);

  /* ============================================================
     START CAMERA
  ============================================================ */

  const startCamera =
    useCallback(async () => {
      if (!exerciseMeta) {
        return;
      }

      if (
        cameraStartPromiseRef.current
      ) {
        return cameraStartPromiseRef.current;
      }

      if (
        streamRef.current &&
        cameraActiveRef.current
      ) {
        return;
      }

      const promise =
        (async () => {
          try {
            setCameraStatus(
              "starting"
            );

            setCameraError("");

            setPoseError("");

            setGetUserMediaError("");

            setPoseStatus(
              "loading"
            );

            /*
             * Camera API check.
             */
            if (
              !navigator.mediaDevices ||
              typeof navigator
                .mediaDevices
                .getUserMedia !==
                "function"
            ) {
              throw new Error(
                "Camera API unavailable. Use HTTPS or localhost."
              );
            }

            /*
             * Permission diagnostic.
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
              }
            } catch {
              setCameraPermissionState(
                "UNKNOWN"
              );
            }

            const video =
              videoRef.current;

            if (!video) {
              throw new Error(
                "Video element is not mounted."
              );
            }

            /*
             * Mobile video configuration.
             */
            video.autoplay =
              true;

            video.muted =
              true;

            video.playsInline =
              true;

            video.setAttribute(
              "autoplay",
              ""
            );

            video.setAttribute(
              "muted",
              ""
            );

            video.setAttribute(
              "playsinline",
              ""
            );

            /*
             * REAR CAMERA
             *
             * Environment camera is preferred.
             *
             * The important part is `ideal`, not
             * `exact`, because some Android devices
             * reject exact environment constraints.
             */
            let stream;

            try {
              stream =
                await navigator.mediaDevices.getUserMedia(
                  {
                    audio: false,
                    video: {
                      facingMode: {
                        ideal:
                          "environment",
                      },
                      width: {
                        ideal: 1280,
                      },
                      height: {
                        ideal: 720,
                      },
                      frameRate: {
                        ideal: 30,
                        max: 30,
                      },
                    },
                  }
                );
            } catch (firstError) {
              console.warn(
                "Preferred camera failed. Retrying generic camera.",
                firstError
              );

              /*
               * Fallback for devices/browsers
               * that reject facingMode.
               */
              stream =
                await navigator.mediaDevices.getUserMedia(
                  {
                    audio: false,
                    video: true,
                  }
                );
            }

            /*
             * Verify stream.
             */
            if (!stream) {
              throw new Error(
                "No camera stream returned."
              );
            }

            streamRef.current =
              stream;

            /*
             * Verify actual camera track.
             */
            const videoTrack =
              stream.getVideoTracks()[0];

            if (!videoTrack) {
              throw new Error(
                "Camera stream contains no video track."
              );
            }

            console.log(
              "Camera track:",
              videoTrack.getSettings()
            );

            /*
             * Attach stream.
             */
            video.srcObject =
              stream;

            /*
             * IMPORTANT:
             *
             * Rear camera must NOT be mirrored.
             */
            video.style.transform =
              "none";

            video.style.webkitTransform =
              "none";

            /*
             * Wait for dimensions.
             */
            await waitForVideo(
              video
            );

            /*
             * Explicit mobile play.
             */
            await video.play();

            const width =
              video.videoWidth;

            const height =
              video.videoHeight;

            if (
              width <= 0 ||
              height <= 0
            ) {
              throw new Error(
                "Camera started but video dimensions are invalid."
              );
            }

            setVideoDimensions({
              width,
              height,
            });

            setVideoReady(
              true
            );

            setCameraPermissionState(
              "granted"
            );

            /*
             * Camera is now REALLY active.
             */
            cameraActiveRef.current =
              true;

            setCameraStatus(
              "active"
            );

            setPoseStatus(
              "detecting"
            );

            /*
             * Initialize pose detector AFTER
             * video is ready.
             */
            await createDetector();

            /*
             * Start inference.
             */
            startPoseProcessing();
          } catch (error) {
            console.error(
              "Camera startup error:",
              error
            );

            cameraActiveRef.current =
              false;

            inferenceRunningRef.current =
              false;

            if (
              streamRef.current
            ) {
              streamRef.current
                .getTracks()
                .forEach(
                  (track) =>
                    track.stop()
                );

              streamRef.current =
                null;
            }

            if (
              videoRef.current
            ) {
              videoRef.current.srcObject =
                null;
            }

            setCameraStatus(
              "error"
            );

            setPoseStatus(
              "error"
            );

            setCameraError(
              getCameraErrorMessage(
                error
              )
            );

            setGetUserMediaError(
              `${
                error?.name ||
                "CameraError"
              }: ${
                error?.message ||
                "Unknown camera error."
              }`
            );
          }
        })();

      cameraStartPromiseRef.current =
        promise;

      try {
        await promise;
      } finally {
        cameraStartPromiseRef.current =
          null;
      }
    }, [
      exerciseMeta,
      createDetector,
      startPoseProcessing,
    ]);

  /* ============================================================
     FEEDBACK UI
  ============================================================ */

  const feedbackList =
    useMemo(() => {
      const items =
        Array.isArray(
          analysisResult.feedback
        )
          ? analysisResult.feedback
          : [
              "Move into a clear position so I can analyze your form.",
            ];

      return items.map(
        (item, index) => {
          const value =
            typeof item ===
              "string" &&
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
                  "#dcecff",
              }}
            >
              {value}
            </div>
          );
        }
      );
    }, [
      analysisResult.feedback,
    ]);

  /* ============================================================
     DEBUG INFO
  ============================================================ */

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
    Boolean(
      navigator?.mediaDevices
    );

  const getUserMediaAvailable =
    mediaDevicesAvailable &&
    typeof navigator
      .mediaDevices
      .getUserMedia ===
      "function";

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#050b18 0%,#0d172a 100%)",
        color: "#edf6ff",
        padding:
          "32px 20px",
      }}
    >
      <div
        style={{
          maxWidth:
            "1100px",
          margin:
            "0 auto",
          display:
            "grid",
          gap:
            "24px",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap:
              "16px",
          }}
        >
          <div>
            <div
              style={{
                fontWeight:
                  800,
                letterSpacing:
                  "0.14em",
                color:
                  "#8fe7ff",
              }}
            >
              ⚡ AI FORM ANALYZER
            </div>

            <div
              style={{
                marginTop:
                  "6px",
                color:
                  "#96a0b8",
              }}
            >
              {exerciseMeta?.name ||
                "Exercise"}
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
              color:
                "#edf6ff",
              padding:
                "10px 16px",
              borderRadius:
                "12px",
              cursor:
                "pointer",
            }}
          >
            Back
          </button>
        </div>

        {!isSupportedExercise ? (
          <div
            style={{
              padding:
                "24px",
              borderRadius:
                "20px",
              background:
                "rgba(17,24,39,.9)",
            }}
          >
            Unsupported exercise.
          </div>
        ) : (
          <>
            {/* MAIN GRID */}

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "1.5fr .9fr",
                gap:
                  "20px",
                alignItems:
                  "start",
              }}
            >
              {/* CAMERA */}

              <div
                style={{
                  background:
                    "rgba(17,24,39,.9)",
                  border:
                    "1px solid rgba(255,255,255,.1)",
                  borderRadius:
                    "22px",
                  padding:
                    "18px",
                  display:
                    "grid",
                  gap:
                    "18px",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap:
                      "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize:
                          ".72rem",
                        textTransform:
                          "uppercase",
                        color:
                          "#96a0b8",
                        letterSpacing:
                          ".14em",
                      }}
                    >
                      Exercise
                    </div>

                    <h2
                      style={{
                        margin:
                          "6px 0 0",
                      }}
                    >
                      {
                        exerciseMeta.name
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
                          ? "rgba(255,70,70,.2)"
                          : "linear-gradient(135deg,#0fffc1,#3d8dff)",
                      border:
                        "none",
                      color:
                        cameraStatus ===
                        "active"
                          ? "#fff"
                          : "#050a17",
                      padding:
                        "12px 18px",
                      borderRadius:
                        "12px",
                      fontWeight:
                        700,
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

                {/* VIDEO */}

                <div
                  style={{
                    position:
                      "relative",
                    width:
                      "100%",
                    aspectRatio:
                      "16 / 9",
                    background:
                      "#000",
                    borderRadius:
                      "18px",
                    overflow:
                      "hidden",
                    border:
                      "1px solid rgba(255,255,255,.1)",
                  }}
                >
                  <video
                    ref={
                      videoRef
                    }
                    autoPlay
                    muted
                    playsInline
                    style={{
                      width:
                        "100%",
                      height:
                        "100%",
                      objectFit:
                        "cover",

                      /*
                       * IMPORTANT:
                       * Do NOT mirror rear camera.
                       */
                      transform:
                        "none",

                      WebkitTransform:
                        "none",

                      display:
                        "block",
                    }}
                  />

                  {!videoReady && (
                    <div
                      style={{
                        position:
                          "absolute",
                        inset:
                          0,
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        background:
                          "rgba(0,0,0,.45)",
                        color:
                          "#d7ebff",
                      }}
                    >
                      {cameraStatus ===
                      "starting"
                        ? "Starting camera..."
                        : "Camera ready when you are."}
                    </div>
                  )}
                </div>

                {cameraError && (
                  <div
                    style={{
                      padding:
                        "14px 16px",
                      borderRadius:
                        "14px",
                      background:
                        "rgba(255,70,70,.12)",
                      border:
                        "1px solid rgba(255,70,70,.3)",
                      color:
                        "#ffd7d7",
                    }}
                  >
                    {cameraError}
                  </div>
                )}
              </div>

              {/* RIGHT PANEL */}

              <div
                style={{
                  display:
                    "grid",
                  gap:
                    "18px",
                }}
              >
                {/* SCORE */}

                <div
                  style={{
                    background:
                      "rgba(17,24,39,.9)",
                    border:
                      "1px solid rgba(255,255,255,.1)",
                    borderRadius:
                      "20px",
                    padding:
                      "22px",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#96a0b8",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        ".12em",
                      fontSize:
                        ".72rem",
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
                    }}
                  >
                    {Math.round(
                      analysisResult.formScore ||
                        0
                    )}
                    %
                  </div>
                </div>

                {/* REPS */}

                <div
                  style={{
                    background:
                      "rgba(17,24,39,.9)",
                    border:
                      "1px solid rgba(255,255,255,.1)",
                    borderRadius:
                      "20px",
                    padding:
                      "22px",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#96a0b8",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        ".12em",
                      fontSize:
                        ".72rem",
                    }}
                  >
                    Repetitions
                  </div>

                  <div
                    style={{
                      marginTop:
                        "12px",
                      fontSize:
                        "2.8rem",
                      fontWeight:
                        800,
                    }}
                  >
                    {analysisResult.repCount ||
                      0}
                  </div>
                </div>

                {/* STATUS */}

                <div
                  style={{
                    background:
                      "rgba(17,24,39,.9)",
                    border:
                      "1px solid rgba(255,255,255,.1)",
                    borderRadius:
                      "20px",
                    padding:
                      "22px",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#96a0b8",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        ".12em",
                      fontSize:
                        ".72rem",
                    }}
                  >
                    AI Status
                  </div>

                  <div
                    style={{
                      marginTop:
                        "12px",
                      display:
                        "grid",
                      gap:
                        "8px",
                    }}
                  >
                    <div>
                      Camera:{" "}
                      <strong>
                        {
                          cameraStatus
                        }
                      </strong>
                    </div>

                    <div>
                      Pose:{" "}
                      <strong>
                        {
                          poseStatus
                        }
                      </strong>
                    </div>

                    <div>
                      Landmarks:{" "}
                      <strong>
                        {
                          analysisResult.landmarkCount ||
                          0
                        }
                      </strong>
                    </div>

                    <div>
                      Phase:{" "}
                      <strong>
                        {
                          analysisResult.phase ||
                          "READY"
                        }
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FEEDBACK */}

            <div
              style={{
                background:
                  "rgba(17,24,39,.9)",
                border:
                  "1px solid rgba(255,255,255,.1)",
                borderRadius:
                  "20px",
                padding:
                  "22px",
              }}
            >
              <div
                style={{
                  color:
                    "#96a0b8",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    ".12em",
                  fontSize:
                    ".72rem",
                }}
              >
                AI Feedback
              </div>

              <div
                style={{
                  marginTop:
                    "12px",
                    display:
                    "grid",
                  gap:
                    "10px",
                }}
              >
                {feedbackList}
              </div>
            </div>

            {/* DEBUG */}

            {import.meta.env.DEV && (
              <div
                style={{
                  background:
                    "rgba(4,8,16,.95)",
                  border:
                    "1px solid rgba(255,255,255,.08)",
                  borderRadius:
                    "18px",
                  padding:
                    "20px",
                  fontSize:
                    ".86rem",
                  color:
                    "#dcecff",
                }}
              >
                <div
                  style={{
                    color:
                      "#8fe7ff",
                    fontWeight:
                      800,
                    marginBottom:
                      "12px",
                  }}
                >
                  DEV AI DIAGNOSTICS
                </div>

                <div>
                  Mobile:{" "}
                  {isMobile
                    ? "YES"
                    : "NO"}
                </div>

                <div>
                  Camera:{" "}
                  {
                    cameraStatus
                  }
                </div>

                <div>
                  Permission:{" "}
                  {
                    cameraPermissionState
                  }
                </div>

                <div>
                  MediaDevices:{" "}
                  {mediaDevicesAvailable
                    ? "YES"
                    : "NO"}
                </div>

                <div>
                  getUserMedia:{" "}
                  {getUserMediaAvailable
                    ? "YES"
                    : "NO"}
                </div>

                <div>
                  Video Ready:{" "}
                  {videoReady
                    ? "YES"
                    : "NO"}
                </div>

                <div>
                  Video Size:{" "}
                  {
                    videoDimensions.width
                  }
                  ×
                  {
                    videoDimensions.height
                  }
                </div>

                <div>
                  Pose Detector:{" "}
                  {
                    poseDetectorStatus
                  }
                </div>

                <div>
                  Pose Results:{" "}
                  {
                    poseResultStatus
                  }
                </div>

                <div>
                  Frame Loop:{" "}
                  {
                    frameLoopStatus
                  }
                </div>

                <div>
                  Frames:{" "}
                  {framesSent}
                </div>

                <div>
                  Landmarks:{" "}
                  {
                    analysisResult.landmarkCount ||
                    0
                  }
                </div>

                <div>
                  Confidence:{" "}
                  {
                    analysisResult.confidence ||
                    0
                  }
                  %
                </div>

                <div>
                  Phase:{" "}
                  {
                    analysisResult.phase
                  }
                </div>

                <div>
                  Rep Count:{" "}
                  {
                    analysisResult.repCount ||
                    0
                  }
                </div>

                <div>
                  Current Angle:{" "}
                  {analysisResult.currentAngle !=
                  null
                    ? `${analysisResult.currentAngle.toFixed(
                        1
                      )}°`
                    : "N/A"}
                </div>

                <div>
                  Selected Elbow:{" "}
                  {
                    analysisResult.selectedElbow ||
                    "N/A"
                  }
                </div>

                <div>
                  Left Elbow:{" "}
                  {analysisResult
                    .metrics
                    ?.leftElbowAngle !=
                  null
                    ? `${analysisResult.metrics.leftElbowAngle.toFixed(
                        1
                      )}°`
                    : "N/A"}
                </div>

                <div>
                  Right Elbow:{" "}
                  {analysisResult
                    .metrics
                    ?.rightElbowAngle !=
                  null
                    ? `${analysisResult.metrics.rightElbowAngle.toFixed(
                        1
                      )}°`
                    : "N/A"}
                </div>

                <div>
                  Left Knee:{" "}
                  {analysisResult
                    .metrics
                    ?.leftKneeAngle !=
                  null
                    ? `${analysisResult.metrics.leftKneeAngle.toFixed(
                        1
                      )}°`
                    : "N/A"}
                </div>

                <div>
                  Right Knee:{" "}
                  {analysisResult
                    .metrics
                    ?.rightKneeAngle !=
                  null
                    ? `${analysisResult.metrics.rightKneeAngle.toFixed(
                        1
                      )}°`
                    : "N/A"}
                </div>

                <div>
                  Last Transition:{" "}
                  {
                    analysisResult
                      .trace
                      ?.lastTransition
                  }
                </div>

                <div>
                  Why:{" "}
                  {
                    analysisResult
                      .trace?.why
                  }
                </div>

                <div>
                  Rep Blocked:{" "}
                  {
                    analysisResult
                      .repBlockedReason ||
                    "NONE"
                  }
                </div>

                {poseError && (
                  <div
                    style={{
                      color:
                        "#ff8b8b",
                      marginTop:
                        "10px",
                    }}
                  >
                    Pose Error:{" "}
                    {poseError}
                  </div>
                )}

                {getUserMediaError && (
                  <div
                    style={{
                      color:
                        "#ff8b8b",
                      marginTop:
                        "10px",
                    }}
                  >
                    Camera Error:{" "}
                    {
                      getUserMediaError
                    }
                  </div>
                )}

                <div
                  style={{
                    marginTop:
                      "12px",
                    color:
                      "#8fa5c2",
                    wordBreak:
                      "break-word",
                  }}
                >
                  Browser:
                  <br />
                  {browser}
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