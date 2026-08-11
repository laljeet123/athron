import { useEffect, useMemo, useState } from "react";
import GlassCard from "../components/UI/GlassCard.jsx";
import SectionTitle from "../components/UI/SectionTitle.jsx";
import ProgressChart from "../components/Progress/ProgressChart.jsx";
import AchievementCard from "../components/Progress/AchievementCard.jsx";
import TransformationCard from "../components/Progress/TransformationCard.jsx";
import { fetchUserMeasurements, fetchProgressLogs, fetchUserGoals, fetchAchievements, fetchTransformations } from "../services/progress.js";
import { fetchWorkoutHistory } from "../services/workouts.js";
import { loadNutritionSummary } from "../services/nutrition.js";
import { buildBodyOverview, buildWorkoutSummary, buildNutritionSummary, buildStrengthProgress, buildFitnessScore, buildProgressCharts, buildAiProgressReport } from "../services/analytics.js";

function Progress() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [nutrition, setNutrition] = useState({});
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [transformations, setTransformations] = useState([]);
  const [progressLogs, setProgressLogs] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [measurementsData, sessionsData, nutritionData, goalsData, achievementsData, transformationsData, progressLogsData] = await Promise.all([
          fetchUserMeasurements(),
          fetchWorkoutHistory(),
          loadNutritionSummary(),
          fetchUserGoals(),
          fetchAchievements(),
          fetchTransformations(),
          fetchProgressLogs(),
        ]);

        if (!mounted) return;
        setMeasurements(measurementsData);
        setSessions(sessionsData);
        setNutrition(nutritionData);
        setGoals(goalsData);
        setAchievements(achievementsData);
        setTransformations(transformationsData);
        setProgressLogs(progressLogsData);
      } catch (err) {
        setError(err.message || "Failed to load progress analytics.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const bodyOverview = useMemo(() => buildBodyOverview(nutrition.profile, measurements, goals), [nutrition.profile, measurements, goals]);
  const workoutSummary = useMemo(() => buildWorkoutSummary(sessions), [sessions]);
  const nutritionSummary = useMemo(() => buildNutritionSummary(nutrition), [nutrition]);
  const strengthProgress = useMemo(() => buildStrengthProgress(progressLogs), [progressLogs]);
  const fitnessScore = useMemo(
    () => buildFitnessScore({
      consistency: workoutSummary.totalWorkouts ? Math.min(100, workoutSummary.streak * 10) : 0,
      nutrition: nutritionSummary.goalCompletion,
      strength: strengthProgress.length ? Math.min(100, strengthProgress[0].percent) : 0,
      goals: goals.length ? 75 : 40,
    }),
    [workoutSummary, nutritionSummary, strengthProgress, goals]
  );
  const charts = useMemo(() => buildProgressCharts({ sessions, measurements, nutrition, progressLogs }), [sessions, measurements, nutrition, progressLogs]);
  const aiReportLines = useMemo(
    () => buildAiProgressReport({ workoutSummary, nutritionSummary, strengthProgress, fitnessScore }),
    [workoutSummary, nutritionSummary, strengthProgress, fitnessScore]
  );

  if (loading) {
    return (
      <div className="page-shell">
        <SectionTitle title="Progress" subtitle="Performance analytics" />
        <GlassCard>
          <p>Loading your progress dashboard...</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <SectionTitle title="Progress" subtitle="Performance analytics" />

      {error ? (
        <GlassCard>
          <p style={{ color: "#ff7a7a" }}>{error}</p>
          <button
            style={{
              marginTop: "16px",
              background: "#39ffab",
              border: "none",
              borderRadius: "16px",
              color: "#050505",
              padding: "12px 18px",
              fontWeight: 700,
              cursor: "pointer",
            }}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </GlassCard>
      ) : (
        <div style={{ display: "grid", gap: "24px" }}>
          <div
            style={{
              display: "grid",
              gap: "22px",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            }}
          >
            <GlassCard style={{ padding: "28px" }}>
              <p style={{ margin: 0, color: "#7b82a1", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.78rem" }}>
                Body Overview
              </p>
              <div style={{ display: "grid", gap: "14px", marginTop: "20px" }}>
                {[
                  { label: "Current weight", value: `${bodyOverview.currentWeight || "--"} kg` },
                  { label: "Starting weight", value: `${bodyOverview.startingWeight || "--"} kg` },
                  { label: "Target weight", value: `${bodyOverview.targetWeight || "--"} kg` },
                  { label: "Height", value: `${bodyOverview.height || "--"} cm` },
                  { label: "BMI", value: bodyOverview.bmi || "--" },
                  { label: "Body fat", value: bodyOverview.bodyFat ? `${bodyOverview.bodyFat}%` : "--" },
                  { label: "Muscle gain", value: `${bodyOverview.muscleGain || 0} kg` },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                    <span style={{ color: "#96a0b8" }}>{item.label}</span>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard style={{ padding: "28px" }}>
              <p style={{ margin: 0, color: "#7b82a1", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.78rem" }}>
                Fitness Score
              </p>
              <div style={{ marginTop: "20px", display: "grid", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: "#f8fafc", fontSize: "2.8rem", fontWeight: 800 }}>{fitnessScore}/100</span>
                  <span style={{ color: "#39ffab", fontWeight: 700 }}>Excellent</span>
                </div>
                <p style={{ margin: 0, color: "#96a0b8" }}>
                  Based on your consistency, nutrition, strength, and goals.
                </p>
              </div>
            </GlassCard>
          </div>

          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {[
                { label: "Workouts completed", value: workoutSummary.totalWorkouts },
                { label: "Workout time", value: `${workoutSummary.totalDuration} min` },
                { label: "Exercises completed", value: workoutSummary.totalExercises },
                { label: "Sets completed", value: workoutSummary.totalSets },
                { label: "Reps completed", value: workoutSummary.totalReps },
                { label: "Calories burned", value: `${workoutSummary.caloriesBurned} kcal` },
                { label: "Current streak", value: `${workoutSummary.streak} days` },
              ].map((item) => (
                <GlassCard key={item.label} style={{ padding: "20px" }}>
                  <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.78rem", textTransform: "uppercase" }}>{item.label}</p>
                  <p style={{ margin: "12px 0 0", color: "#f8fafc", fontSize: "1.5rem", fontWeight: 700 }}>{item.value}</p>
                </GlassCard>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <ProgressChart title="Weight Progress" data={charts.weightSeries} xKey="date" yKey="value" />
            <ProgressChart title="Workout Frequency" data={charts.frequencySeries} xKey="week" yKey="value" />
          </div>

          <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <ProgressChart title="Calories Burned" data={charts.caloriesSeries} xKey="date" yKey="value" color="#ff9f43" />
            <ProgressChart title="Protein Intake" data={charts.proteinSeries} xKey="date" yKey="value" color="#66bb6a" />
          </div>

          <GlassCard style={{ padding: "28px" }}>
            <p style={{ margin: 0, color: "#7b82a1", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.78rem" }}>
              AI Progress Report
            </p>
            <div style={{ marginTop: "20px", display: "grid", gap: "12px" }}>
              {aiReportLines.map((line, index) => (
                <p key={index} style={{ margin: 0, color: "#f8fafc" }}>
                  {line}
                </p>
              ))}
            </div>
          </GlassCard>

          <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {achievements.slice(0, 4).map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>

          <GlassCard style={{ padding: "28px" }}>
            <p style={{ margin: 0, color: "#7b82a1", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.78rem" }}>
              Transformation Timeline
            </p>
            <div style={{ display: "grid", gap: "18px", marginTop: "22px" }}>
              {transformations.slice(0, 3).map((item) => (
                <TransformationCard key={item.id} transformation={item} />
              ))}
              {!transformations.length && (
                <p style={{ margin: 0, color: "#96a0b8" }}>
                  Upload front, side and back photos to visualize your transformation timeline.
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

export default Progress;
