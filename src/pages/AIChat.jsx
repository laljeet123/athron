import { useMemo, useState } from "react";
import { askAthron } from "../ai/AthronAI.js";
import { loadStoredProfile } from "../services/localProfile.js";

const QUESTION_CATEGORIES = [
  {
    title: "WORKOUT",
    questions: [
      "How should I warm up before a workout?",
      "How many days a week should I work out?",
      "How long should I rest between sets?",
      "How can I improve my core strength?",
      "What should I do on a rest day?",
      "How can I progressively increase my strength?",
    ],
  },
  {
    title: "STRENGTH",
    questions: [
      "What are the best exercises for building muscle?",
      "What exercises are best for shoulders?",
      "What exercises are best for chest?",
      "What exercises are best for back?",
      "What exercises are best for legs?",
      "What exercises are best for arms?",
      "How can I avoid overtraining?",
    ],
  },
  {
    title: "NUTRITION",
    questions: [
      "How much protein should I eat for muscle growth?",
      "What should I eat before a workout?",
      "What should I eat after a workout?",
      "Should I do cardio while building muscle?",
    ],
  },
  {
    title: "RECOVERY",
    questions: [
      "How can I recover faster after a workout?",
      "How much sleep do I need for muscle recovery?",
    ],
  },
  {
    title: "CONSISTENCY",
    questions: [
      "How can I stay consistent with my workouts?",
    ],
  },
];

const FALLBACK_ANSWERS = {
  "How should I warm up before a workout?":
    "Start with 5–10 minutes of light cardio to increase heart rate, then move into dynamic mobility drills for your shoulders, hips, and spine. Finish with movement-specific warm-up sets at lower intensity before heavy lifts.",
  "What are the best exercises for building muscle?":
    "Focus on compound lifts like squats, deadlifts, bench press, and rows, then add targeted accessory movements to fill gaps. Prioritize progressive overload, consistent volume, and strict form.",
  "How many days a week should I work out?":
    "Aim for 3–5 training days per week depending on your recovery and schedule. For most athletes, 4 workouts with a balanced split gives enough stimulus without excessive fatigue.",
  "How much protein should I eat for muscle growth?":
    "Aim for about 1.6–2.2 grams of protein per kilogram of body weight daily. Spread intake across meals and include high-quality sources like lean meat, dairy, legumes, and eggs.",
  "How long should I rest between sets?":
    "Rest 60–120 seconds between strength sets. Use shorter rest for muscle endurance and longer rest for heavier strength work. Trust how your body feels and keep your tempo controlled.",
  "What exercises are best for shoulders?":
    "For balanced shoulder development, include overhead press, lateral raises, rear-delt flyes, and face pulls. Keep your shoulders stable and move with controlled range of motion.",
  "What exercises are best for chest?":
    "Build chest strength with bench press, incline press, push-ups, and chest fly variations. Focus on full range of motion, shoulder stability, and a strong mind-muscle connection.",
  "What exercises are best for back?":
    "Train your back with pull-ups or pulldowns, bent-over rows, single-arm rows, and deadlift variations. Emphasize scapular retraction and a flat back during pulling movements.",
  "What exercises are best for legs?":
    "Use squats, lunges, Romanian deadlifts, split squats, and step-ups to target the full lower body. Balance quad-dominant and hip-hinge movements for strong, durable legs.",
  "What exercises are best for arms?":
    "Include barbell or dumbbell curls, hammer curls, skull crushers, dips, and close-grip presses. Control each rep and avoid swinging the weight to maximize arm tension.",
  "How can I improve my core strength?":
    "Use planks, dead bugs, hanging leg raises, and loaded carries. Focus on bracing your midsection and maintaining a neutral spine through each movement.",
  "How can I recover faster after a workout?":
    "Recover with quality sleep, proper hydration, balanced nutrition, and light mobility work. Listen to your body and include active rest on easy days.",
  "How much sleep do I need for muscle recovery?":
    "Most athletes benefit from 7–9 hours of sleep nightly. Consistent sleep quality helps hormone balance, repair, and energy for your next training session.",
  "Should I do cardio while building muscle?":
    "Yes, moderate cardio helps conditioning and recovery. Keep it low to moderate intensity, and schedule it after strength work or on separate days to protect muscle performance.",
  "What should I eat before a workout?":
    "Choose a balanced meal with protein, carbs, and a little fat about 1–2 hours before training. Examples include chicken with rice, oats with yogurt, or a fruit and nut snack.",
  "What should I eat after a workout?":
    "Refuel with lean protein, carbs, and vegetables within 60 minutes. Try grilled chicken with sweet potato, a protein smoothie with fruit, or paneer with whole grains.",
  "How can I progressively increase my strength?":
    "Add small weekly increases to your load, volume, or reps. Track progress, keep your form clean, and use deload weeks when your body feels fatigued.",
  "How can I avoid overtraining?":
    "Monitor your energy, sleep, and performance. Use scheduled rest days, avoid constantly chasing heavier loads, and reduce volume if soreness and fatigue accumulate.",
  "What should I do on a rest day?":
    "Do gentle movement like walking, stretching, or mobility drills. Stay hydrated and eat well, while letting your muscles recover for the next training session.",
  "How can I stay consistent with my workouts?":
    "Set a simple weekly routine, track your workouts, and choose training you enjoy. Keep goals realistic and treat consistency as progress in itself.",
};

export default function AIChat() {
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const profile = loadStoredProfile();
  const userId = profile?.id ?? null;

  const profileSummary = useMemo(() => {
    if (!profile) return "Complete your profile for more personalized coaching.";
    const details = [];
    if (profile.goal) details.push(profile.goal);
    if (profile.activity_level) details.push(profile.activity_level);
    if (profile.training_days) details.push(`${profile.training_days} days/week`);
    return details.length ? details.join(" • ") : "Complete your profile for more personalized coaching.";
  }, [profile]);

  const askQuestion = async (question) => {
    setActiveQuestion(question);
    setAnswer("");
    setError(null);
    setLoading(true);
    try {
      const result = await askAthron(question, userId);
      const text = result?.message?.trim();
      setAnswer(text || FALLBACK_ANSWERS[question] || "Here is a coaching tip you can use for this question.");
    } catch (err) {
      setError("Unable to fetch your coach answer right now. Using a fallback response.");
      setAnswer(FALLBACK_ANSWERS[question] || "Stay consistent and keep training.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div style={{ display: "grid", gap: "24px" }}>
        <div className="ai-answer-card" style={{ padding: "30px 28px" }}>
          <div style={{ display: "grid", gap: "18px" }}>
            <div>
              <p style={{ margin: 0, color: "#39ffab", letterSpacing: "0.18em", fontSize: "0.75rem", textTransform: "uppercase" }}>ATHRON AI COACH</p>
              <h1 style={{ margin: "14px 0 0", fontSize: "clamp(2rem, 3vw, 3rem)", lineHeight: 1.05 }}>Your intelligent fitness companion</h1>
              <p style={{ margin: "16px 0 0", maxWidth: "720px", color: "#c4c8d4", fontSize: "1rem", lineHeight: 1.7 }}>
                Tap any coaching prompt to get smart, actionable guidance tailored for your training, recovery, and nutrition.
              </p>
            </div>
            <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <div style={{ padding: "18px 20px", borderRadius: "22px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>Quick coach</p>
                <p style={{ margin: "10px 0 0", color: "#f8fafc", fontWeight: 700 }}>Actionable advice anytime</p>
              </div>
              <div style={{ padding: "18px 20px", borderRadius: "22px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>Pro workout cues</p>
                <p style={{ margin: "10px 0 0", color: "#f8fafc", fontWeight: 700 }}>Form, tempo, recovery</p>
              </div>
            </div>
          </div>
        </div>

        <div className="ai-question-group">
          {QUESTION_CATEGORIES.map((group) => (
            <div key={group.title} style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div>
                  <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>{group.title}</p>
                  <h2 style={{ margin: "10px 0 0", fontSize: "1rem", color: "#f8fafc" }}>Tap a question to answer it</h2>
                </div>
              </div>
              <div className="ai-question-list">
                {group.questions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    className={activeQuestion === question ? "ai-question-card ai-question-card--active" : "ai-question-card"}
                    onClick={() => askQuestion(question)}
                  >
                    <p style={{ margin: 0, fontWeight: 700, color: activeQuestion === question ? "#f8fafc" : "#d2d8e4" }}>{question}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="ai-answer-card">
          <div style={{ display: "grid", gap: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
              <div>
                <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>Coach response</p>
                <h2 style={{ margin: "12px 0 0", color: "#f8fafc", fontSize: "1.6rem" }}>
                  {activeQuestion ? "Ready with your answer" : "Select a question to begin"}
                </h2>
              </div>
              <div className="ai-meta-pill">{profileSummary}</div>
            </div>

            {loading && (
              <div style={{ minHeight: "180px", display: "grid", placeItems: "center", color: "#96a0b8" }}>
                <p>Generating your coaching advice…</p>
              </div>
            )}

            {!loading && answer && (
              <div style={{ display: "grid", gap: "16px" }}>
                {answer.split("\n").map((block, index) => (
                  <p key={index} style={{ margin: 0, lineHeight: 1.8, color: "#d8e0f2" }}>
                    {block}
                  </p>
                ))}
              </div>
            )}

            {error && <p style={{ margin: 0, color: "#ff8a80" }}>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
