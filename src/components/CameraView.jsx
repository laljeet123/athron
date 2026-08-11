import { useEffect, useRef, useState } from "react";

const CAMERA_STATUS = {
  IDLE: "IDLE",
  STARTING: "STARTING",
  ACTIVE: "ACTIVE",
  FAILED: "FAILED",
  STOPPED: "STOPPED",
};

const VIDEO_STATUS = {
  NOT_READY: "NOT_READY",
  READY: "READY",
  PLAYING: "PLAYING",
};

const STREAM_STATUS = {
  NOT_CREATED: "NOT_CREATED",
  ACTIVE: "ACTIVE",
  ENDED: "ENDED",
};

export const getCameraErrorMessage = (error) => {
  if (!error) return "Unable to access the camera.";
  const name = error.name || "UnknownError";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Camera permission was denied. Allow camera access in your browser.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera was detected.";
    case "NotReadableError":
    case "TrackStartError":
      return "Camera is currently unavailable. Another application or browser process may be using it. Close other camera apps/tabs and then retry.";
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return "Requested camera configuration is unavailable.";
    case "AbortError":
      return "Camera startup was aborted.";
    default:
      return error.message || "Unable to access the camera.";
  }
};

const hasActiveStream = (stream) => {
  return !!stream && stream.getTracks().some((track) => track.readyState === "live");
};

function CameraView({ onVideoReady, onError, onCameraStopped, onStreamStatusChange, autoStart = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const startIdRef = useRef(0);
  const retryCountRef = useRef(0);
  const [cameraStatus, setCameraStatus] = useState(CAMERA_STATUS.IDLE);
  const [videoStatus, setVideoStatus] = useState(VIDEO_STATUS.NOT_READY);
  const [streamStatus, setStreamStatus] = useState(STREAM_STATUS.NOT_CREATED);
  const [message, setMessage] = useState("Tap start to open your camera.");

  const cleanupVideo = () => {
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const stopCamera = (intentional = false) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      onStreamStatusChange?.("ENDED");
    }

    cleanupVideo();
    setStreamStatus(STREAM_STATUS.ENDED);
    setVideoStatus(VIDEO_STATUS.NOT_READY);

    if (intentional) {
      setCameraStatus(CAMERA_STATUS.STOPPED);
      setMessage("Camera stopped. Tap start to resume.");
      onCameraStopped?.();
    } else if (cameraStatus !== CAMERA_STATUS.FAILED) {
      setCameraStatus(CAMERA_STATUS.IDLE);
      setMessage("Tap start to open your camera.");
    }
  };

  const waitForVideoReady = (videoElement) => {
    return new Promise((resolve, reject) => {
      if (!videoElement) {
        reject(new Error("Camera preview is unavailable."));
        return;
      }

      let cleanup = () => {
        videoElement.removeEventListener("loadedmetadata", onReady);
        videoElement.removeEventListener("canplay", onReady);
        videoElement.removeEventListener("error", onErrorEvent);
      };

      const checkReady = () => {
        return videoElement.readyState >= 2 && videoElement.videoWidth > 0 && videoElement.videoHeight > 0;
      };

      const onReady = () => {
        if (checkReady()) {
          cleanup();
          resolve();
        }
      };

      const onErrorEvent = () => {
        cleanup();
        reject(new Error("Camera preview failed to load."));
      };

      if (checkReady()) {
        resolve();
        return;
      }

      videoElement.addEventListener("loadedmetadata", onReady);
      videoElement.addEventListener("canplay", onReady);
      videoElement.addEventListener("error", onErrorEvent);

      const timeout = window.setTimeout(() => {
        cleanup();
        if (checkReady()) {
          resolve();
        } else {
          reject(new Error("Timed out waiting for camera preview to become ready."));
        }
      }, 5000);

      const originalCleanup = cleanup;
      cleanup = () => {
        window.clearTimeout(timeout);
        originalCleanup();
      };
    });
  };

  const startCamera = async () => {
    const startId = ++startIdRef.current;

    if (hasActiveStream(streamRef.current) && videoRef.current?.srcObject === streamRef.current && !videoRef.current.paused) {
      setCameraStatus(CAMERA_STATUS.ACTIVE);
      setVideoStatus(VIDEO_STATUS.PLAYING);
      setStreamStatus(STREAM_STATUS.ACTIVE);
      onStreamStatusChange?.("ACTIVE");
      setMessage("Camera is already active.");
      return;
    }

    stopCamera();
    setCameraStatus(CAMERA_STATUS.STARTING);
    setStreamStatus(STREAM_STATUS.NOT_CREATED);
    setVideoStatus(VIDEO_STATUS.NOT_READY);
    setMessage(retryCountRef.current > 0 ? "Retrying camera access..." : "Requesting camera access...");

    if (!navigator.mediaDevices?.getUserMedia) {
      const errorMessage = "Webcam not supported by this browser.";
      const error = new Error(errorMessage);
      setCameraStatus(CAMERA_STATUS.FAILED);
      setMessage(errorMessage);
      onError?.(error);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

      if (startId !== startIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      retryCountRef.current = 0;
      streamRef.current = stream;
      onStreamStatusChange?.("ACTIVE");
      setStreamStatus(STREAM_STATUS.ACTIVE);

      if (!videoRef.current) {
        throw new Error("Camera preview is unavailable.");
      }

      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
      setVideoStatus(VIDEO_STATUS.NOT_READY);

      await waitForVideoReady(videoRef.current);
      setVideoStatus(VIDEO_STATUS.READY);

      let playbackSucceeded = false;
      try {
        await videoRef.current.play();
        playbackSucceeded = true;
      } catch (playError) {
        if (videoRef.current.srcObject && !videoRef.current.paused) {
          playbackSucceeded = true;
        } else {
          throw playError;
        }
      }

      if (startId !== startIdRef.current) {
        stopCamera();
        return;
      }

      if (!playbackSucceeded || !videoRef.current || videoRef.current.paused || videoRef.current.readyState < 2 || videoRef.current.videoWidth <= 0 || videoRef.current.videoHeight <= 0) {
        throw new Error("Camera playback did not start correctly.");
      }

      setCameraStatus(CAMERA_STATUS.ACTIVE);
      setVideoStatus(VIDEO_STATUS.PLAYING);
      setMessage("Camera live. Keep your body centered and visible.");
      onVideoReady?.(videoRef.current);
    } catch (error) {
      if (startId !== startIdRef.current) {
        return;
      }

      const transientCameraError = error?.name === "NotReadableError" || error?.name === "TrackStartError" || error?.name === "AbortError";
      const shouldRetry = transientCameraError && retryCountRef.current < 2;

      if (shouldRetry) {
        retryCountRef.current += 1;
        setCameraStatus(CAMERA_STATUS.FAILED);
        setMessage("Camera is busy. Closing other apps and retrying...");
        window.setTimeout(() => {
          if (startId === startIdRef.current) {
            void startCamera();
          }
        }, 1000);
        return;
      }

      stopCamera();
      const errorMessage = getCameraErrorMessage(error);
      setCameraStatus(CAMERA_STATUS.FAILED);
      setMessage(errorMessage);
      if (process.env.NODE_ENV !== "production") {
        console.debug("CAMERA ERROR", error);
      }
      onError?.(error);
    }
  };

  useEffect(() => {
    if (autoStart && cameraStatus === CAMERA_STATUS.IDLE) {
      void startCamera();
    }
  }, [autoStart, cameraStatus]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const statusMessage =
    cameraStatus === CAMERA_STATUS.IDLE
      ? message
      : cameraStatus === CAMERA_STATUS.STARTING
      ? message
      : cameraStatus === CAMERA_STATUS.FAILED
      ? message
      : cameraStatus === CAMERA_STATUS.STOPPED
      ? message
      : "Camera live. Keep your body centered and visible.";

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "960px", aspectRatio: "16/9", borderRadius: "28px", overflow: "hidden", background: "#050814" }}>
      <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          background: cameraStatus === CAMERA_STATUS.ACTIVE ? "transparent" : "rgba(5, 8, 20, 0.72)",
          color: "#f8fafc",
          padding: "24px",
          textAlign: "center",
          pointerEvents: cameraStatus === CAMERA_STATUS.ACTIVE ? "none" : "auto",
        }}
      >
        {cameraStatus !== CAMERA_STATUS.ACTIVE ? (
          <div style={{ maxWidth: "420px", display: "grid", gap: "16px" }}>
            <p style={{ margin: 0, color: "#c4c8d4", lineHeight: 1.7 }}>{statusMessage}</p>
            {cameraStatus === CAMERA_STATUS.FAILED ? (
              <button
                type="button"
                onClick={startCamera}
                style={{
                  border: "none",
                  borderRadius: "18px",
                  padding: "12px 20px",
                  background: "rgba(57, 255, 171, 0.18)",
                  color: "#f8fafc",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Retry camera
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "18px",
          right: "18px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          justifyContent: "flex-end",
          width: "calc(100% - 36px)",
          pointerEvents: "none",
        }}
      >
        {cameraStatus === CAMERA_STATUS.ACTIVE ? (
          <button
            type="button"
            onClick={() => stopCamera(true)}
            style={{
              pointerEvents: "auto",
              border: "none",
              borderRadius: "999px",
              padding: "12px 16px",
              background: "rgba(255, 74, 74, 0.92)",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            ⏹ Stop Camera
          </button>
        ) : cameraStatus === CAMERA_STATUS.STOPPED || cameraStatus === CAMERA_STATUS.IDLE ? (
          <button
            type="button"
            onClick={startCamera}
            style={{
              pointerEvents: "auto",
              border: "none",
              borderRadius: "999px",
              padding: "12px 16px",
              background: "rgba(57, 255, 171, 0.92)",
              color: "#050a17",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            ▶️ Start Camera
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default CameraView;
