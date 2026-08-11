import GlassCard from "../UI/GlassCard.jsx";

function NutritionProgress({ label, consumed, target, unit = "kcal", color = "#39ffab" }) {
  const ratio = target ? Math.min(consumed / target, 1) : 0;
  const percentage = Math.round(ratio * 100);

  return (
    <GlassCard style={{ padding: "22px", background: "rgba(10,14,24,0.92)", display: "grid", gap: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>{label}</p>
        <p style={{ margin: 0, color: "#f8fafc", fontWeight: 700 }}>
          {consumed} / {target} {unit}
        </p>
      </div>
      <div style={{ height: "10px", borderRadius: "999px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ width: `${percentage}%`, height: "100%", borderRadius: "999px", background: `linear-gradient(90deg, ${color}, #2e7eff)` }} />
      </div>
      <p style={{ margin: 0, color: "#96a0b8", fontSize: "0.78rem" }}>{percentage}% of target</p>
    </GlassCard>
  );
}

export default NutritionProgress;
