import { useEffect, useRef, useState } from "react";

function CameraView({ onReady, onError }) {
  const videoRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const message = "Camera access is not supported in this browser.";
        setCameraError(message);
        onError?.(message);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          onReady?.(videoRef.current);
        }
      } catch (error) {
        const message = error?.message || "Unable to access the camera.";
        setCameraError(message);
        onError?.(message);
      }
    }

    void startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onReady, onError]);

  return (
    <div style={{ display: "grid", gap: "14px", background: "rgba(8,10,18,0.9)", borderRadius: "24px", padding: "18px", border: "1px solid rgba(255,255,255,0.08)" }}>
      <video ref={videoRef} style={{ width: "100%", borderRadius: "20px", background: "#000" }} playsInline muted />
      {cameraError && <p style={{ color: "#f87171" }}>{cameraError}</p>}
    </div>
  );
}

export default CameraView;
