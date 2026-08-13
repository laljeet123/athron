import React, { useState } from "react";
import { ChevronDown, Sparkles, Dumbbell, Apple, Moon, Target, BrainCircuit } from "lucide-react";
import { Link } from "react-router-dom";

const COACH_DATA = [
  {
    category: "WORKOUT",
    icon: <Dumbbell size={20} />,
    items: [
      {
        question: "How should I warm up before a workout?",
        answer: "Start with 5–10 minutes of light cardio such as jogging, cycling, or jumping jacks. Follow this with dynamic stretches like arm circles, leg swings, and bodyweight squats. Finish with a few light sets of your first exercise to prepare your muscles and joints for training."
      },
      {
        question: "How many days a week should I work out?",
        answer: "Beginners should train 3–4 days per week, while intermediate and advanced individuals can train 4–6 days weekly. The key is balancing training intensity with proper recovery."
      },
      {
        question: "How long should I rest between sets?",
        answer: "For muscle growth, rest 60–90 seconds. For strength training, rest 2–5 minutes. For endurance-focused workouts, rest 30–60 seconds between sets."
      },
      {
        question: "How can I improve my core strength?",
        answer: "Include exercises such as planks, side planks, leg raises, mountain climbers, dead bugs, and Russian twists. Train your core 2–4 times per week and focus on proper form."
      },
      {
        question: "What should I do on a rest day?",
        answer: "Perform active recovery activities such as walking, stretching, yoga, or mobility exercises. Stay hydrated, eat nutritious meals, and prioritize sleep for optimal recovery."
      },
      {
        question: "How can I progressively increase my strength?",
        answer: "Use progressive overload by gradually increasing weight, repetitions, sets, or exercise difficulty over time while maintaining good form and consistency."
      }
    ]
  },
  {
    category: "STRENGTH",
    icon: <Target size={20} />,
    items: [
      {
        question: "What are the best exercises for building muscle?",
        answer: "Compound exercises such as squats, deadlifts, bench press, overhead press, pull-ups, rows, dips, and lunges are highly effective for building muscle mass and strength."
      },
      {
        question: "What exercises are best for shoulders?",
        answer: "Overhead press, dumbbell shoulder press, lateral raises, front raises, rear delt flyes, face pulls, and upright rows are excellent shoulder-building exercises."
      },
      {
        question: "What exercises are best for chest?",
        answer: "Push-ups, bench press, incline bench press, dumbbell press, chest flyes, dips, and cable crossovers effectively target the chest muscles."
      },
      {
        question: "What exercises are best for back?",
        answer: "Pull-ups, chin-ups, lat pulldowns, barbell rows, dumbbell rows, seated rows, and deadlifts help build a strong and well-developed back."
      },
      {
        question: "What exercises are best for legs?",
        answer: "Squats, lunges, leg press, Romanian deadlifts, Bulgarian split squats, step-ups, and calf raises are among the best exercises for leg development."
      },
      {
        question: "What exercises are best for arms?",
        answer: "For biceps, perform curls, hammer curls, and chin-ups. For triceps, perform dips, close-grip push-ups, skull crushers, and tricep pushdowns."
      },
      {
        question: "How can I avoid overtraining?",
        answer: "Ensure adequate sleep, proper nutrition, hydration, and rest days. Monitor fatigue levels and reduce workout intensity if recovery becomes difficult."
      }
    ]
  },
  {
    category: "NUTRITION",
    icon: <Apple size={20} />,
    items: [
      {
        question: "How much protein should I eat for muscle growth?",
        answer: "Aim for 1.6–2.2 grams of protein per kilogram of body weight daily. Spread protein intake evenly across meals for best results."
      },
      {
        question: "What should I eat before a workout?",
        answer: "Consume a meal containing carbohydrates and protein 1–3 hours before exercise. Good options include oats, bananas, yogurt, milk, whole-grain bread, or paneer."
      },
      {
        question: "What should I eat after a workout?",
        answer: "Eat protein and carbohydrates after training to support muscle recovery and replenish energy. Examples include milk and banana, paneer and rice, curd with fruit, or a protein shake."
      },
      {
        question: "Should I do cardio while building muscle?",
        answer: "Yes. Moderate cardio 2–3 times per week can improve cardiovascular health and recovery without significantly affecting muscle growth."
      }
    ]
  },
  {
    category: "RECOVERY",
    icon: <Moon size={20} />,
    items: [
      {
        question: "How can I recover faster after a workout?",
        answer: "Stay hydrated, consume enough protein and calories, get quality sleep, stretch regularly, and perform light recovery activities such as walking or mobility work."
      },
      {
        question: "How much sleep do I need for muscle recovery?",
        answer: "Most adults need 7–9 hours of quality sleep per night. Sleep is essential for muscle repair, hormone production, and overall recovery."
      }
    ]
  },
  {
    category: "CONSISTENCY",
    icon: <Sparkles size={20} />,
    items: [
      {
        question: "How can I stay consistent with my workouts?",
        answer: "Set realistic goals, follow a structured workout plan, track your progress, schedule workouts in advance, and focus on building long-term habits rather than relying on motivation alone."
      }
    ]
  }
];

const CoachAccordionItem = ({ item, isOpen, onToggle }) => {
  return (
    <div
      style={{
        background: isOpen ? "rgba(57, 255, 171, 0.04)" : "rgba(255, 255, 255, 0.03)",
        border: "1px solid",
        borderColor: isOpen ? "rgba(57, 255, 171, 0.2)" : "rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        overflow: "hidden",
        transition: "all 0.3s ease",
        marginBottom: "12px"
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          outline: "none"
        }}
      >
        <span style={{
          fontSize: "1rem",
          fontWeight: 700,
          color: isOpen ? "#39ffab" : "#f8fafc",
          lineHeight: 1.4,
          flex: 1,
          paddingRight: "12px"
        }}>
          {item.question}
        </span>
        <ChevronDown
          size={18}
          style={{
            color: isOpen ? "#39ffab" : "#94a3b8",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            flexShrink: 0
          }}
        />
      </button>
      <div
        style={{
          maxHeight: isOpen ? "400px" : "0",
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        <div style={{
          padding: "0 24px 20px",
          color: "#94a3b8",
          lineHeight: 1.7,
          fontSize: "0.95rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.04)",
          paddingTop: "16px"
        }}>
          {item.answer}
        </div>
      </div>
    </div>
  );
};

export default function AIChat() {
  const [openQuestion, setOpenQuestion] = useState(null);

  const toggleQuestion = (question) => {
    setOpenQuestion(openQuestion === question ? null : question);
  };

  return (
    <div className="page-shell" style={{ paddingBottom: "100px" }}>
      <div style={{ display: "grid", gap: "32px" }}>

        {/* Hero Header */}
        <div style={{
          padding: "40px 24px",
          background: "radial-gradient(circle at top right, rgba(57, 255, 171, 0.12), transparent), rgba(15, 23, 42, 0.6)",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          textAlign: "center"
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(57, 255, 171, 0.1)",
            padding: "8px 16px",
            borderRadius: "100px",
            marginBottom: "20px"
          }}>
            <BrainCircuit size={18} color="#39ffab" />
            <span style={{ color: "#39ffab", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Elite AI Intelligence
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: "2.4rem", fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em" }}>
            Athron AI Coach
          </h1>
          <p style={{ color: "#94a3b8", marginTop: "12px", fontSize: "1.1rem", maxWidth: "500px", margin: "12px auto 0" }}>
            {openQuestion ? "Actionable insight unlocked." : "Tap a question to view the answer"}
          </p>
        </div>

        {/* Categories and Questions */}
        <div style={{ display: "grid", gap: "40px" }}>
          {COACH_DATA.map((group) => (
            <div key={group.category} style={{ display: "grid", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingLeft: "4px" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(57, 255, 171, 0.1)",
                  color: "#39ffab",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {group.icon}
                </div>
                <h2 style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "#f8fafc",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase"
                }}>
                  {group.category}
                </h2>
              </div>

              <div style={{ display: "grid" }}>
                {group.items.map((item) => (
                  <CoachAccordionItem
                    key={item.question}
                    item={item}
                    isOpen={openQuestion === item.question}
                    onToggle={() => toggleQuestion(item.question)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Support Section */}
        <div style={{
          marginTop: "20px",
          padding: "24px",
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "20px",
          border: "1px dashed rgba(255, 255, 255, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div>
            <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "1.1rem" }}>Need more general info?</h3>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>Check our system-wide help center.</p>
          </div>
          <Link
            to="/faq"
            style={{
              color: "#39ffab",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              background: "rgba(57, 255, 171, 0.05)",
              padding: "10px 20px",
              borderRadius: "12px",
              border: "1px solid rgba(57, 255, 171, 0.1)"
            }}
          >
            View FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}
