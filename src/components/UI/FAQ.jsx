import React, { useState, useMemo } from "react";
import { ChevronDown, Search, Plus, Minus, Info, Camera, Activity, Smartphone } from "lucide-react";

const FAQ_DATA = [
  {
    id: 1,
    category: "Exercises",
    icon: <Activity size={18} />,
    question: "Can Athron detect squat form?",
    answer: "Yes. Athron analyzes your squat posture in real time using AI-powered pose detection. It tracks body landmarks, counts repetitions, and provides feedback such as squat depth, knee position, and overall form accuracy."
  },
  {
    id: 2,
    category: "Exercises",
    icon: <Activity size={18} />,
    question: "Can Athron detect pushup form?",
    answer: "Yes. Athron monitors your body alignment, elbow movement, and range of motion during pushups. It counts repetitions and provides feedback to help improve your technique."
  },
  {
    id: 3,
    category: "Technical",
    icon: <Smartphone size={18} />,
    question: "Does Athron work on mobile phones?",
    answer: "Yes. Athron is optimized for Android and modern mobile browsers. It can access your phone's camera and provide real-time exercise analysis directly from the website."
  },
  {
    id: 4,
    category: "General",
    icon: <Info size={18} />,
    question: "Is Athron free to use?",
    answer: "Yes. The core features of Athron, including exercise analysis, workout guidance, and fitness tracking, are available for free."
  },
  {
    id: 5,
    category: "Exercises",
    icon: <Activity size={18} />,
    question: "Does Athron count repetitions automatically?",
    answer: "Yes. Athron automatically counts repetitions for supported exercises such as squats and pushups using AI-based motion tracking."
  },
  {
    id: 6,
    category: "General",
    icon: <Info size={18} />,
    question: "Do I need to create an account?",
    answer: "No. Athron can be used without creating an account. Your profile and preferences can be stored locally on your device."
  },
  {
    id: 7,
    category: "Exercises",
    icon: <Activity size={18} />,
    question: "Which exercises are currently supported?",
    answer: "Athron currently supports squat and pushup analysis with AI-based rep counting and form feedback. Other exercise modes provide camera-based monitoring and workout assistance."
  },
  {
    id: 8,
    category: "Technical",
    icon: <Camera size={18} />,
    question: "Why does Athron need camera access?",
    answer: "Camera access is required so Athron can detect body movements, analyze exercise form, count repetitions, and provide real-time feedback."
  },
  {
    id: 9,
    category: "Technical",
    icon: <Camera size={18} />,
    question: "Is my camera data stored?",
    answer: "No. Athron processes camera data in real time for exercise analysis and does not permanently store video recordings unless explicitly enabled by future features."
  },
  {
    id: 10,
    category: "Technical",
    icon: <Camera size={18} />,
    question: "Why is Athron showing 'Camera Permission Required'?",
    answer: "This means your browser does not currently have permission to access the camera. Allow camera access in your browser settings and refresh the page."
  },
  {
    id: 11,
    category: "Exercises",
    icon: <Activity size={18} />,
    question: "Can Athron estimate calories burned?",
    answer: "Yes. Athron can provide an estimated calorie burn based on exercise type, repetitions performed, and workout duration."
  },
  {
    id: 12,
    category: "General",
    icon: <Info size={18} />,
    question: "Can Athron track workout progress?",
    answer: "Yes. Athron can track workout sessions, repetitions, accuracy scores, and performance trends to help users monitor improvement over time."
  },
  {
    id: 13,
    category: "Exercises",
    icon: <Activity size={18} />,
    question: "Does Athron provide form correction feedback?",
    answer: "Yes. Athron can identify common mistakes and provide guidance such as 'Go Lower,' 'Keep Your Back Straight,' and 'Maintain Proper Body Alignment.'"
  },
  {
    id: 14,
    category: "Technical",
    icon: <Smartphone size={18} />,
    question: "Can Athron be used at home?",
    answer: "Absolutely. Athron is designed for both home workouts and gym workouts. All you need is a device with a camera and enough space to perform the exercise."
  },
  {
    id: 15,
    category: "General",
    icon: <Info size={18} />,
    question: "What makes Athron different from other fitness apps?",
    answer: "Athron combines AI-powered exercise recognition, real-time form analysis, automatic repetition counting, workout guidance, and fitness tracking into a single intelligent fitness platform designed for both beginners and advanced athletes."
  }
];

const FAQItem = ({ question, answer, category, icon, isOpen, onToggle }) => {
  return (
    <div
      className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}
      style={{
        background: isOpen ? "rgba(57, 255, 171, 0.04)" : "rgba(255, 255, 255, 0.03)",
        border: "1px solid",
        borderColor: isOpen ? "rgba(57, 255, 171, 0.2)" : "rgba(255, 255, 255, 0.08)",
        borderRadius: "20px",
        overflow: "hidden",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        marginBottom: "16px",
        boxShadow: isOpen ? "0 10px 30px -10px rgba(0, 0, 0, 0.5)" : "none"
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "24px",
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          outline: "none"
        }}
      >
        <div style={{
          marginTop: "2px",
          color: isOpen ? "#39ffab" : "#94a3b8",
          background: isOpen ? "rgba(57, 255, 171, 0.1)" : "rgba(255, 255, 255, 0.05)",
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.3s ease"
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{
            margin: "0 0 4px",
            fontSize: "0.7rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: isOpen ? "#39ffab" : "#64748b"
          }}>
            {category}
          </p>
          <span style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: isOpen ? "#f8fafc" : "#cbd5e1",
            transition: "color 0.3s ease",
            lineHeight: 1.4
          }}>
            {question}
          </span>
        </div>
        <ChevronDown
          size={24}
          style={{
            marginTop: "12px",
            color: isOpen ? "#39ffab" : "#475569",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        />
      </button>
      <div
        style={{
          maxHeight: isOpen ? "500px" : "0",
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        <div style={{
          padding: "0 24px 32px 76px",
          color: "#94a3b8",
          lineHeight: 1.8,
          fontSize: "1rem"
        }}>
          {answer}
        </div>
      </div>
    </div>
  );
};

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openIds, setOpenIds] = useState(new Set());

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter(faq =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const toggleItem = (id) => {
    const newOpenIds = new Set(openIds);
    if (newOpenIds.has(id)) {
      newOpenIds.delete(id);
    } else {
      // If you want ONLY one open at a time, uncomment the next line and remove the rest of this else block
      // newOpenIds.clear();
      newOpenIds.add(id);
    }
    setOpenIds(newOpenIds);
  };

  const expandAll = () => {
    setOpenIds(new Set(FAQ_DATA.map(f => f.id)));
  };

  const collapseAll = () => {
    setOpenIds(new Set());
  };

  return (
    <div style={{ display: "grid", gap: "32px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Search and Controls */}
      <div style={{
        display: "grid",
        gap: "24px",
        background: "rgba(8, 12, 24, 0.4)",
        padding: "24px",
        borderRadius: "24px",
        border: "1px solid rgba(255, 255, 255, 0.05)"
      }}>
        <div style={{ position: "relative" }}>
          <Search
            size={20}
            style={{
              position: "absolute",
              left: "18px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#64748b"
            }}
          />
          <input
            type="text"
            placeholder="Search help topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "18px 18px 18px 54px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              color: "#f8fafc",
              fontSize: "1.1rem",
              outline: "none",
              transition: "all 0.3s ease",
              boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2)"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
            Showing {filteredFaqs.length} of {FAQ_DATA.length} results
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={expandAll}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(57, 255, 171, 0.08)",
                border: "1px solid rgba(57, 255, 171, 0.15)",
                color: "#39ffab",
                padding: "10px 18px",
                borderRadius: "12px",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.target.style.background = "rgba(57, 255, 171, 0.15)"}
              onMouseLeave={(e) => e.target.style.background = "rgba(57, 255, 171, 0.08)"}
            >
              <Plus size={16} /> Expand All
            </button>
            <button
              onClick={collapseAll}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#94a3b8",
                padding: "10px 18px",
                borderRadius: "12px",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.08)"}
              onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.05)"}
            >
              <Minus size={16} /> Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* FAQ List */}
      <div style={{ display: "grid", paddingBottom: "40px" }}>
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => (
            <FAQItem
              key={faq.id}
              category={faq.category}
              icon={faq.icon}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIds.has(faq.id)}
              onToggle={() => toggleItem(faq.id)}
            />
          ))
        ) : (
          <div style={{
            textAlign: "center",
            padding: "80px 24px",
            color: "#94a3b8",
            background: "rgba(255, 255, 255, 0.01)",
            borderRadius: "32px",
            border: "1px dashed rgba(255, 255, 255, 0.1)"
          }}>
            <Search size={64} style={{ margin: "0 auto 24px", opacity: 0.1 }} />
            <h3 style={{ color: "#f8fafc", margin: "0 0 8px" }}>No results found</h3>
            <p style={{ fontSize: "1rem", maxWidth: "300px", margin: "0 auto 24px" }}>
              We couldn't find any questions matching "{searchTerm}"
            </p>
            <button
              onClick={() => setSearchTerm("")}
              style={{
                background: "#39ffab",
                border: "none",
                color: "#050a17",
                padding: "12px 24px",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: 800
              }}
            >
              Reset Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
