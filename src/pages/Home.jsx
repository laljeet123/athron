import { useNavigate } from "react-router-dom";
import BodyPartSelector from "../components/BodyPartSelector.jsx";
import { ROUTES } from "../utils/routes.js";

function Home() {
  const navigate = useNavigate();

  const handleBodyPartSelect = (bodyPart) => {
    if (bodyPart?.id && bodyPart?.name) {
      navigate(ROUTES.WORKOUT_DETAILS(bodyPart.id, bodyPart.name));
    } else {
      navigate(ROUTES.WORKOUT_SELECT);
    }
  };

  return (
    <main style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Athron</h1>
      <p>Select a body part to begin your training flow.</p>
      <BodyPartSelector onSelect={handleBodyPartSelect} />
    </main>
  );
}

export default Home;
