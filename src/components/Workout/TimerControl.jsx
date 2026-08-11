import { useEffect } from "react";
import GlassCard from "../UI/GlassCard.jsx";

function TimerControl({ seconds, active, onComplete }) {
  useEffect(() => {
    if (!active || seconds <= 0) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      onComplete?.();
    }, seconds * 1000);

    return () => window.clearInterval(interval);
  }, [active, seconds, onComplete]);

  return (
    <GlassCard style={{ display: "grid", gap: "14px" }}>
      <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.16em" }}>
        Timer
      </p>
      <p style={{ margin: 0, color: "#f8fafc", fontSize: "1.8rem" }}>{active ? `${seconds}s remaining` : "Timer stopped"}</p>
    </GlassCard>
  );
}

export default TimerControl;
