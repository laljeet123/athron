import GlassCard from "../UI/GlassCard.jsx";

function AchievementCard({ achievement }) {
  return (
    <GlassCard
      style={{
        display: "grid",
        gap: "10px",
        padding: "18px",
        minWidth: 0,
        background: achievement.unlocked_at
          ? "rgba(57, 255, 171, 0.08)"
          : "rgba(255,255,255,0.04)",
      }}
    >
      <p style={{ margin: 0, color: "#39ffab", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.12em" }}>
        {achievement.achievement_name}
      </p>
      <p style={{ margin: "8px 0 0", color: "#f8fafc", fontSize: "1.1rem", fontWeight: 700 }}>
        {achievement.description}
      </p>
      {achievement.unlocked_at && (
        <p style={{ margin: "10px 0 0", color: "#96a0b8", fontSize: "0.85rem" }}>
          Unlocked on {new Date(achievement.unlocked_at).toLocaleDateString()}
        </p>
      )}
    </GlassCard>
  );
}

export default AchievementCard;
