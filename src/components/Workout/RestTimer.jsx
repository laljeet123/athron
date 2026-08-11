import { useEffect, useState } from "react";
import GlassCard from "../UI/GlassCard.jsx";

function RestTimer({ initialSeconds = 60, onComplete }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) {
      onComplete?.();
      return;
    }

    const interval = window.setInterval(() => {
      setSeconds((current) => current - 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [seconds, onComplete]);

  return (
    <GlassCard style={{ display: "grid", gap: "14px" }}>
      <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.16em" }}>
        Recovery timer
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px" }}>
        <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "2rem" }}>{seconds}s</h3>
        <p style={{ margin: 0, color: "#96a0b8" }}>Focus on form while you recover.</p>
      </div>
    </GlassCard>
  );
}

export default RestTimer;
