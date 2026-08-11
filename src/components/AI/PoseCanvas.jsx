import { useEffect, useRef } from "react";

function PoseCanvas({ landmarks }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarks?.length) return;

    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "rgba(15, 241, 186, 0.85)";
    landmarks.forEach((landmark) => {
      if (!landmark) return;
      const x = landmark.x * width;
      const y = landmark.y * height;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = "rgba(15, 241, 186, 0.8)";
    ctx.lineWidth = 2;
    const pairs = [
      [11, 13],
      [13, 15],
      [12, 14],
      [14, 16],
      [11, 23],
      [12, 24],
      [23, 24],
    ];

    pairs.forEach(([start, end]) => {
      const a = landmarks[start];
      const b = landmarks[end];
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(b.x * width, b.y * height);
      ctx.stroke();
    });
  }, [landmarks]);

  return <canvas ref={canvasRef} width={960} height={540} style={{ width: "100%", height: "100%", position: "absolute", inset: 0, pointerEvents: "none" }} />;
}

export default PoseCanvas;
