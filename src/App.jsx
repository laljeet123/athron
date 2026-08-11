import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/Layout/AppLayout.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { WorkoutProvider } from "./context/WorkoutContext.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import WorkoutPage from "./pages/Workout.jsx";
import WorkoutSelector from "./pages/WorkoutSelector.jsx";
import WorkoutBuilder from "./pages/WorkoutBuilder.jsx";
import ActiveWorkout from "./pages/ActiveWorkout.jsx";
import WorkoutHistory from "./pages/WorkoutHistory.jsx";
import Exercises from "./pages/Exercises.jsx";
import ExerciseCatalog from "./pages/ExerciseCatalog.jsx";
import ExerciseMuscles from "./pages/ExerciseMuscles.jsx";
import ExerciseMode from "./pages/ExerciseMode.jsx";
import ExerciseList from "./pages/ExerciseList.jsx";
import AIChat from "./pages/AIChat.jsx";
import Nutrition from "./pages/Nutrition.jsx";
import Progress from "./pages/Progress.jsx";
import ProfilePage from "./pages/Profile.jsx";
import ExerciseDetailPage from "./pages/ExerciseDetail.jsx";
import FormChecker from "./pages/FormChecker.jsx";
// Signup and ForgotPassword pages removed; use Profile for account actions
// Onboarding removed; profile is optional
import LoadingScreen from "./components/UI/LoadingScreen.jsx";

// No profile setup guard — profile is optional and not required for app use

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <WorkoutProvider>
        <BrowserRouter>
          <Routes>
            {/* Signup and forgot-password routes removed; account handled in /profile */}

            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="workout" element={<WorkoutPage />} />
              <Route path="workout/select" element={<WorkoutSelector />} />
              <Route path="workout/:bodyPartId/:bodyPartName" element={<WorkoutSelector />} />
              <Route path="workout/builder" element={<WorkoutBuilder />} />
              <Route path="workout/active" element={<ActiveWorkout />} />
              <Route path="workout/history" element={<WorkoutHistory />} />
              <Route path="exercises" element={<ExerciseCatalog />} />
              <Route path="exercises/catalog" element={<ExerciseCatalog />} />
              <Route path="exercises/catalog/:categoryId" element={<ExerciseMuscles />} />
              <Route path="exercises/catalog/:categoryId/:muscleId" element={<ExerciseMode />} />
              <Route path="exercises/catalog/:categoryId/:muscleId/:workoutType" element={<ExerciseList />} />
              <Route path="exercises/:bodyPartId/:bodyPartName/:workoutType" element={<Exercises />} />
              <Route path="exercise/:id" element={<ExerciseDetailPage />} />
              <Route path="form-checker" element={<FormChecker />} />
              <Route path="form-checker/:exerciseId" element={<FormChecker />} />
              <Route path="ai" element={<AIChat />} />
              <Route path="nutrition" element={<Nutrition />} />
              <Route path="progress" element={<Progress />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/profile" replace />} />
          </Routes>
        </BrowserRouter>
      </WorkoutProvider>
    </AuthProvider>
  );
}

export default App;