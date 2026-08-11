# Athron Feature Inventory

Generated: 2026-08-07

## Major Features

- Dashboard
- Body parts & Exercises (Gym/Home)
- Exercise detail pages
- Workout creation (Builder)
- Active workout / WorkoutContext
- Workout history
- Progress / Analytics
- Nutrition (meals, foods, water, summaries)
- AI: AthronAI core, AIChat, AITrainer
- Voice: SpeechRecognition, TTS, voice commands
- Camera / FormChecker (MediaPipe Pose)
- Profile & Authentication (Supabase)
- Supabase integrations (profiles, foods, meal_logs, workout_sessions, water_logs, ai_conversations)
- LocalStorage fallbacks for offline

## Interactive Elements (summary)

- Nav: Navbar links (Dashboard, Workout, AI, Nutrition, Profile)
- Dashboard: Start workout, Check form, Quick nav cards
- WorkoutBuilder: Add exercise, Remove, Save session
- ActiveWorkout: Previous, Complete set, Next exercise, Pause/Resume, Start rest timer
- WorkoutHistory: Reload
- FormChecker: Start camera, Back navigation
- Nutrition: MealLogger, WaterLogger, Save water
- AITrainer: Voice buttons, Quick actions
- AIChat: text input + send
- Profile: Save
- ExerciseDetail: Check form button

## Files scanned
(see file listing in repository)

## Notes
This inventory is a baseline for deeper audits (routes, buttons, Supabase queries, auth, camera, AI). Next I'll run static checks for missing imports/exports, console errors, and inspect each service for proper Supabase usage.


