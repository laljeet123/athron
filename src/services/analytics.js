function safeNumber(value) {
  return Number(value ?? 0) || 0;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

export function calculateBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const heightMeters = Number(heightCm) / 100;
  if (!heightMeters) return null;
  return Math.round((Number(weightKg) / (heightMeters * heightMeters)) * 10) / 10;
}

export function calculateWorkoutStreak(sessions = []) {
  const sorted = [...sessions]
    .map((session) => ({
      date: new Date(session.completedAt || session.completed_at || session.createdAt || session.created_at),
    }))
    .filter((item) => item.date && !Number.isNaN(item.date.getTime()))
    .sort((a, b) => b.date - a.date);

  let streak = 0;
  let lastDate = null;

  for (const item of sorted) {
    const currentDate = new Date(item.date);
    currentDate.setHours(0, 0, 0, 0);

    if (lastDate === null) {
      streak = 1;
      lastDate = currentDate;
      continue;
    }

    const diff = (lastDate - currentDate) / (1000 * 60 * 60 * 24);
    if (diff === 0) {
      continue;
    }
    if (diff === 1) {
      streak += 1;
      lastDate = currentDate;
      continue;
    }
    break;
  }

  return streak;
}

export function buildBodyOverview(profile, measurements = [], goals = []) {
  const latestMeasurement = measurements[0] || {};
  const previousMeasurement = measurements[measurements.length - 1] || {};
  const targetWeightGoal = goals.find((goal) => String(goal.goal_type).toLowerCase().includes("weight"));

  const currentWeight = safeNumber(profile?.weight_kg ?? latestMeasurement.weight);
  const startingWeight = safeNumber(previousMeasurement.weight ?? profile?.weight_kg ?? currentWeight);
  const targetWeight = targetWeightGoal ? safeNumber(targetWeightGoal.target_value) : currentWeight;
  const height = safeNumber(profile?.height_cm ?? latestMeasurement.height);
  const bmi = calculateBmi(currentWeight, height);
  const bodyFat = safeNumber(latestMeasurement.body_fat);
  const muscleGain = Math.max(0, safeNumber(latestMeasurement.muscle_mass) - safeNumber(previousMeasurement.muscle_mass));

  return {
    currentWeight,
    startingWeight,
    targetWeight,
    height,
    bmi,
    bodyFat,
    muscleGain,
    weightDelta: currentWeight - startingWeight,
  };
}

export function buildWorkoutSummary(sessions = []) {
  const totalWorkouts = sessions.length;
  const totalDuration = sessions.reduce((sum, session) => sum + safeNumber(session.durationMinutes || session.duration_minutes), 0);
  const totalExercises = sessions.reduce((sum, session) => sum + safeNumber(session.totalExercises || session.total_exercises), 0);
  const totalSets = sessions.reduce((sum, session) => sum + safeNumber(session.setsCompleted || session.sets_completed || 0), 0);
  const totalReps = sessions.reduce((sum, session) => sum + safeNumber(session.repsCompleted || session.reps_completed || 0), 0);
  const caloriesBurned = sessions.reduce((sum, session) => sum + safeNumber(session.caloriesBurned || session.calories_burned), 0);
  const streak = calculateWorkoutStreak(sessions);

  const workoutFrequency = sessions.reduce((acc, session) => {
    const date = formatDate(session.completedAt || session.completed_at || session.createdAt || session.created_at);
    const weekLabel = date ? `${date.slice(0, 7)}` : "unknown";
    acc[weekLabel] = (acc[weekLabel] || 0) + 1;
    return acc;
  }, {});

  return {
    sessions,
    totalWorkouts,
    totalDuration,
    totalExercises,
    totalSets,
    totalReps,
    caloriesBurned,
    streak,
    workoutFrequency,
  };
}

export function buildNutritionSummary(nutrition = {}) {
  const daily = nutrition.dailyNutrition || {};
  const targets = nutrition.targets || {};

  const averageCalories = safeNumber(daily.calories);
  const averageProtein = safeNumber(daily.protein_g);
  const waterMl = safeNumber(daily.water_ml);
  const goalCompletion = targets.dailyCalories ? Math.min(100, Math.round((averageCalories / safeNumber(targets.dailyCalories)) * 100)) : 0;

  return {
    averageCalories,
    averageProtein,
    waterMl,
    goalCompletion,
    calorieTarget: safeNumber(targets.dailyCalories),
    proteinTarget: safeNumber(targets.proteinTarget),
  };
}

export function buildStrengthProgress(progressLogs = []) {
  const metrics = progressLogs.reduce((acc, log) => {
    const metricType = String(log.metric_type || log.metricType || "unknown");
    const value = safeNumber(log.metric_value ?? log.metricValue);
    acc[metricType] = acc[metricType] || [];
    acc[metricType].push({ date: formatDate(log.date || log.created_at || log.createdAt), value });
    return acc;
  }, {});

  const progress = Object.entries(metrics).map(([metricType, entries]) => {
    const sorted = entries.sort((a, b) => a.date.localeCompare(b.date));
    const start = safeNumber(sorted[0]?.value);
    const latest = safeNumber(sorted[sorted.length - 1]?.value);
    const delta = latest - start;
    const percent = start ? Math.round((delta / Math.max(start, 1)) * 100) : delta > 0 ? 100 : 0;
    return {
      metricType,
      start,
      latest,
      delta,
      percent,
      history: sorted,
    };
  });

  return progress;
}

export function buildFitnessScore({ consistency = 0, nutrition = 0, strength = 0, goals = 0 }) {
  const weighted = Math.round(
    Math.min(100,
      consistency * 0.3 +
      nutrition * 0.25 +
      strength * 0.25 +
      goals * 0.2
    )
  );
  return weighted;
}

export function buildProgressCharts({ sessions = [], measurements = [], nutrition = {}, progressLogs = [] }) {
  const weightSeries = measurements
    .slice(0, 10)
    .reverse()
    .map((measurement) => ({
      date: formatDate(measurement.created_at || measurement.date),
      value: safeNumber(measurement.weight),
    }))
    .filter((item) => item.value > 0);

  const frequencySeries = Object.entries(
    sessions.reduce((acc, session) => {
      const date = formatDate(session.completedAt || session.completed_at || session.createdAt || session.created_at);
      if (!date) return acc;
      const weekLabel = date.slice(0, 7);
      acc[weekLabel] = (acc[weekLabel] || 0) + 1;
      return acc;
    }, {})
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, value]) => ({ week, value }));

  const caloriesSeries = sessions
    .slice(-7)
    .map((session) => ({
      date: formatDate(session.completedAt || session.completed_at || session.createdAt || session.created_at),
      value: safeNumber(session.caloriesBurned || session.calories_burned),
    }))
    .filter((item) => item.date);

  const proteinSeries = [
    {
      date: formatDate(new Date()),
      value: safeNumber(nutrition.dailyNutrition?.protein_g),
    },
  ];

  const strengthSeries = buildStrengthProgress(progressLogs)
    .slice(0, 3)
    .map((metric) => ({
      metricType: metric.metricType,
      start: metric.start,
      latest: metric.latest,
      delta: metric.delta,
      percent: metric.percent,
    }));

  return {
    weightSeries,
    frequencySeries,
    caloriesSeries,
    proteinSeries,
    strengthSeries,
  };
}

export function buildAiProgressReport({ workoutSummary, nutritionSummary, strengthProgress, fitnessScore }) {
  const lines = [];

  if (workoutSummary.totalWorkouts) {
    lines.push(`You completed ${workoutSummary.totalWorkouts} workout${workoutSummary.totalWorkouts === 1 ? "" : "s"} with ${workoutSummary.totalDuration} total minutes.`);
  } else {
    lines.push("No workouts logged yet — start a session to activate your progress analytics.");
  }

  if (strengthProgress.length) {
    const best = strengthProgress[0];
    lines.push(`Your ${best.metricType} improved by ${best.percent}% since it was first logged.`);
  }

  if (nutritionSummary.goalCompletion) {
    lines.push(`You are achieving ${nutritionSummary.goalCompletion}% of your calorie goal today.`);
  }

  if (fitnessScore >= 80) {
    lines.push("Excellent progress — keep the momentum going.");
  } else if (fitnessScore >= 60) {
    lines.push("Good work, there is clear progress with a few helpful improvements available.");
  } else {
    lines.push("Focus on consistency and protein intake to raise your fitness score.");
  }

  if (nutritionSummary.averageProtein && nutritionSummary.proteinTarget) {
    const delta = nutritionSummary.proteinTarget - nutritionSummary.averageProtein;
    if (delta > 0) {
      lines.push(`Try adding ${delta}g more protein to hit your target.`);
    }
  }

  return lines;
}
