import { useState } from "react";
import GlassCard from "../UI/GlassCard.jsx";
import GradientButton from "../UI/GradientButton.jsx";
import { createWaterLog } from "../../services/waterLogs.js";

function WaterLogger({ onWaterLogged }) {
  const [amountMl, setAmountMl] = useState(250);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const addAmount = (value) => {
    setAmountMl((current) => Number(current) + value);
    setMessage(null);
  };

  const handleLogWater = async () => {
    if (!amountMl || amountMl <= 0) {
      setMessage({ type: "error", text: "Enter a valid water amount in ml." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await createWaterLog(Number(amountMl));
      setMessage({ type: "success", text: "Water logged successfully." });
      setAmountMl(250);
      onWaterLogged?.();
    } catch (error) {
      setMessage({ type: "error", text: error?.message || "Failed to log water." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlassCard style={{ padding: "24px", display: "grid", gap: "18px" }}>
      <div>
        <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>Hydration tracker</p>
        <h3 style={{ margin: "12px 0 0", color: "#f8fafc" }}>Log water instantly</h3>
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {[250, 500, 750].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => addAmount(value)}
              style={{
                padding: "12px 0",
                borderRadius: "16px",
                background: "rgba(63, 108, 255, 0.16)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#f8fafc",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              +{value} ml
            </button>
          ))}
        </div>

        <label style={{ display: "grid", gap: "8px" }}>
          Custom amount (ml)
          <input
            type="number"
            min="50"
            value={amountMl}
            onChange={(event) => setAmountMl(Number(event.target.value))}
            style={{ padding: "14px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
          />
        </label>

        <GradientButton type="button" onClick={handleLogWater} disabled={submitting}>
          {submitting ? "Logging water..." : "Save water"}
        </GradientButton>

        {message && (
          <p style={{ margin: 0, color: message.type === "error" ? "#ff8a80" : "#39ffab" }}>{message.text}</p>
        )}
      </div>
    </GlassCard>
  );
}

export default WaterLogger;
