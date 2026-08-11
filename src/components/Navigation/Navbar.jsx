import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

function Navbar() {
  const { user } = useAuth();

  return (
    <header className="navbar">
      <div>
        <Link to="/" className="navbar__brand">
          <span style={{ marginRight: "10px", color: "#39ffab" }}>⚡</span>
          ATHRON AI
        </Link>
        <p className="navbar__subtitle">Premium fitness intelligence</p>
      </div>
      <nav className="navbar__links">
        <NavLink to="/" className={({ isActive }) => (isActive ? "navbar__link navbar__link--active" : "navbar__link")}>
          Dashboard
        </NavLink>
        <NavLink to="/workout" className={({ isActive }) => (isActive ? "navbar__link navbar__link--active" : "navbar__link")}>
          Workout
        </NavLink>
        <NavLink to="/exercises" className={({ isActive }) => (isActive ? "navbar__link navbar__link--active" : "navbar__link")}>
          Exercises
        </NavLink>
        <NavLink to="/ai" className={({ isActive }) => (isActive ? "navbar__link navbar__link--active" : "navbar__link")}>
          AI Coach
        </NavLink>
        <NavLink to="/nutrition" className={({ isActive }) => (isActive ? "navbar__link navbar__link--active" : "navbar__link")}>
          🍎 Nutrition
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? "navbar__link navbar__link--active" : "navbar__link")}>
          👤 {user?.name ? user.name : "Profile"}
        </NavLink>
      </nav>
    </header>
  );
}

export default Navbar;
