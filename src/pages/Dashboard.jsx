import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/routes.js";
import HeroCard from "../components/Dashboard/HeroCard.jsx";
import WorkoutCard from "../components/Dashboard/WorkoutCard.jsx";
import AICoachCard from "../components/Dashboard/AICoachCard.jsx";
import StatCard from "../components/Dashboard/StatCard.jsx";
import GlassCard from "../components/UI/GlassCard.jsx";
import SectionTitle from "../components/UI/SectionTitle.jsx";
import { loadNutritionSummary } from "../services/nutrition.js";

function Dashboard() {
  const navigate = useNavigate();
  const [nutritionSummary, setNutritionSummary] = useState(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await loadNutritionSummary();
        setNutritionSummary(data);
      } catch (error) {
        console.warn("Failed to load nutrition summary", error);
      }
    })();
  }, []);

  const workout = {
    title: "Shoulder Training",
    stats: [
      { label: "Exercises", value: "5" },
      { label: "Duration", value: "45 min" },
      { label: "Calories", value: "350 kcal" },
    ],
  };

  return (
    <div className="page-shell">
      <section className="dashboard-page__hero">
        <HeroCard onStartWorkout={() => navigate("/workout")} onCheckForm={() => navigate(ROUTES.FORM_CHECKER())} />
      </section>

      <section className="dashboard-page__section">
        <SectionTitle title="Today's session" subtitle="Premium training" />
        <WorkoutCard workout={workout} onStartTraining={() => navigate("/workout")}/>
      </section>

      <section className="dashboard-page__section">
        <SectionTitle title="AI Coach" subtitle="Live posture and form" />
        <AICoachCard onAnalyze={() => navigate(ROUTES.FORM_CHECKER())} />
      </section>

      <section className="dashboard-page__section dashboard-page__stats-grid">
        <StatCard label="Weight" value="65 kg" note="Latest logged" />
        <StatCard label="Streak" value="12 days" note="Consistent progress" />
        <StatCard label="Calories" value="2400 kcal" note="Daily burn" />
        <StatCard label="Progress" value="78%" note="Strength focus" />
      </section>

      <section className="dashboard-page__section">
        <GlassCard>
          <div style={{ display: "grid", gap: "12px" }}>
            <p style={{ margin: 0, color: "#7b82a1", textTransform: "uppercase", letterSpacing: "0.18em", fontSize: "0.78rem" }}>
              Premium Insights
            </p>
            <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "1.8rem" }}>
              Stay focused on your next peak session.
            </h3>
            <p style={{ margin: 0, color: "#96a0b8", lineHeight: 1.7 }}>
              Your data is ready for workout planning, nutrition guidance, and AI coaching when you need it.
            </p>
          </div>
        </GlassCard>
      </section>

      <section className="dashboard-page__section">
        <SectionTitle title="Nutrition" subtitle="Quick access" />
        <GlassCard style={{ cursor: "pointer" }} onClick={() => navigate(ROUTES.NUTRITION)}>
          <div style={{ display: "grid", gap: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, color: "#7b82a1", textTransform: "uppercase", fontSize: "0.78rem" }}>Nutrition</p>
                <h3 style={{ margin: "10px 0 0", color: "#f8fafc" }}>Open your daily dashboard</h3>
              </div>
              <div style={{ borderRadius: "16px", background: "rgba(63,108,255,0.16)", padding: "10px 16px", color: "#f8fafc", fontWeight: 700 }}>
                View Nutrition →
              </div>
            </div>
            <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "1fr 1fr" }}>
              <div style={{ padding: "16px", borderRadius: "20px", background: "rgba(255,255,255,0.04)" }}>
                <p style={{ margin: 0, color: "#9fa8c9", fontSize: "0.8rem" }}>Calories consumed</p>
                <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>
                  {nutritionSummary?.dailyNutrition ? Math.round(nutritionSummary.dailyNutrition.calories) : "--"} kcal
                </p>
              </div>
              <div style={{ padding: "16px", borderRadius: "20px", background: "rgba(255,255,255,0.04)" }}>
                <p style={{ margin: 0, color: "#9fa8c9", fontSize: "0.8rem" }}>Daily target</p>
                <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>
                  {nutritionSummary?.targets ? Math.round(nutritionSummary.targets.dailyCalories) : "--"} kcal
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>
      <section className="dashboard-page__section" style={{ textAlign: "center", paddingTop: "20px" }}>
        <button
          onClick={() => navigate("/faq")}
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            fontSize: "0.9rem",
            cursor: "pointer",
            textDecoration: "underline",
            opacity: 0.8
          }}
        >
          Need help? View Frequently Asked Questions
        </button>
      </section>
    </div>
  );
}

export default Dashboard;
