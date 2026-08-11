import "@mediapipe/pose";

// The installed @mediapipe package is a legacy UMD/closure bundle that
// attaches Pose to the global scope. Read the class from global scope
// after importing the package for its side-effect.

const Pose = typeof globalThis !== "undefined" && globalThis.Pose ? globalThis.Pose : (typeof window !== "undefined" ? window.Pose : undefined);

const LANDMARK_KEYS = {
  left_shoulder: 11,
  right_shoulder: 12,
  left_elbow: 13,
  right_elbow: 14,
  left_wrist: 15,
  right_wrist: 16,
  left_hip: 23,
  right_hip: 24,
  left_knee: 25,
  right_knee: 26,
  left_ankle: 27,
  right_ankle: 28,
};

export async function createPoseDetector(onResults) {
  if (!Pose) {
    throw new Error("MediaPipe Pose is not available. Ensure @mediapipe/pose is installed and loading as a side-effect.");
  }

  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`,
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  pose.onResults((results) => {
    const landmarksArray = Array.isArray(results?.poseLandmarks) ? results.poseLandmarks : [];
    const extracted = Object.fromEntries(
      Object.entries(LANDMARK_KEYS).map(([key, index]) => [key, landmarksArray[index] || null])
    );

    const validLandmarks = landmarksArray.filter(
      (point) => point && Number.isFinite(point.x) && Number.isFinite(point.y)
    );
    const confidence = landmarksArray.length
      ? Math.round((validLandmarks.length / landmarksArray.length) * 100)
      : 0;

    onResults?.({
      landmarks: extracted,
      landmarksArray,
      confidence,
      poseLandmarks: landmarksArray,
    });
  });

  return pose;
}

