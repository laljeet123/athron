import { NavLink } from "react-router-dom";

function BottomNavigation() {
  const tabs = [
    { label: "Home", path: "/" },
    { label: "Workout", path: "/workout" },
    { label: "AI Coach", path: "/ai" },
    { label: "Nutrition", path: "/nutrition" },
    { label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="bottom-navigation">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            isActive ? "bottom-navigation__item bottom-navigation__item--active" : "bottom-navigation__item"
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNavigation;
