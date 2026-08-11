import { Navigate } from "react-router-dom";

// Onboarding removed — profile is optional. Redirect to /profile.
export default function OnboardingPage() {
  return <Navigate to="/profile" replace />;
}
