import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../utils/routes.js";
import GlassCard from "../components/UI/GlassCard.jsx";
import GradientButton from "../components/UI/GradientButton.jsx";
import SectionTitle from "../components/UI/SectionTitle.jsx";

function WorkoutSelector() {
  const navigate = useNavigate();
  const { bodyPartId, bodyPartName } = useParams();
  const decodedBodyPartName = bodyPartName ? decodeURIComponent(bodyPartName) : "";

  if (!bodyPartId || !decodedBodyPartName) {
    return (
      <div className="page-shell">
        <SectionTitle title="Select your workout" subtitle="Choose a body part" />
        <GlassCard>
          <p>Workout selection requires a body part.</p>
          <GradientButton onClick={() => navigate(ROUTES.WORKOUT)}>Browse workouts</GradientButton>
        </GlassCard>
      </div>
    );
  }

  const handleSelectWorkout = (workoutType) => {
    navigate(ROUTES.EXERCISES(bodyPartId, decodedBodyPartName, workoutType));
  };

  return (
    <div className="page-shell">
      <SectionTitle title={decodedBodyPartName} subtitle="Where are you training today?" />
      <GlassCard style={{ display: "grid", gap: "18px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <GradientButton onClick={() => handleSelectWorkout("GYM")}>🏋 Gym</GradientButton>
          <GradientButton onClick={() => handleSelectWorkout("HOME")}>🏠 Home</GradientButton>
        </div>
      </GlassCard>
    </div>
  );
}

export default WorkoutSelector;
