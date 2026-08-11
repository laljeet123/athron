import { NavLink } from "react-router-dom";

function BottomNavigation() {
  const tabs = [
    { label: "Home", path: "/" },
    { label: "Workout", path: "/workout" },
    { label: "AI Coach", path: "/ai" },
    { label: "Nutrition", path: "/nutrition" },
    { label: "Progress", path: "/progress" },
  ];

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "10px",
        padding: "14px 18px",
        background: "rgba(8, 10, 18, 0.92)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        position: "fixed",
        insetInline: 0,
        bottom: 0,
        zIndex: 20,
        backdropFilter: "blur(14px)",
      }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          style={({ isActive }) => ({
            flex: 1,
            padding: "12px 10px",
            borderRadius: "18px",
            textDecoration: "none",
            color: isActive ? "#0fffc1" : "#9ca3af",
            background: isActive ? "rgba(15, 255, 193, 0.12)" : "transparent",
            textAlign: "center",
            fontSize: "0.9rem",
          })}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNavigation;
