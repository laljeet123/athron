import React from "react";
import FAQ from "../components/UI/FAQ.jsx";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FAQPage() {
  const navigate = useNavigate();

  return (
    <div className="page-shell" style={{ paddingBottom: "100px" }}>
      <div style={{ display: "grid", gap: "40px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f8fafc",
              cursor: "pointer"
            }}
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <p style={{ margin: 0, color: "#39ffab", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.15em" }}>
              Help Center
            </p>
            <h1 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 900, color: "#f8fafc" }}>
              Frequently Asked Questions
            </h1>
          </div>
        </div>

        {/* FAQ Component */}
        <FAQ />

        {/* Still need help? */}
        <div style={{
          marginTop: "40px",
          padding: "32px",
          background: "linear-gradient(135deg, rgba(57, 255, 171, 0.1) 0%, rgba(61, 141, 255, 0.1) 100%)",
          borderRadius: "24px",
          border: "1px solid rgba(57, 255, 171, 0.2)",
          textAlign: "center"
        }}>
          <h2 style={{ margin: 0, color: "#f8fafc", fontSize: "1.4rem" }}>Still have questions?</h2>
          <p style={{ color: "#94a3b8", margin: "12px 0 24px", lineHeight: 1.6 }}>
            Our AI Coach is available 24/7 to help you with your specific training needs.
          </p>
          <button
            onClick={() => navigate("/ai")}
            style={{
              background: "#39ffab",
              color: "#050a17",
              border: "none",
              padding: "14px 32px",
              borderRadius: "14px",
              fontWeight: 800,
              fontSize: "1rem",
              cursor: "pointer",
              transition: "transform 0.2s ease"
            }}
            onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
          >
            Ask AI Coach
          </button>
        </div>
      </div>
    </div>
  );
}
