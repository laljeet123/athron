import { Outlet } from "react-router-dom";
import Navbar from "../Navigation/Navbar.jsx";
import BottomNavigation from "../Navigation/BottomNavigation.jsx";
import ScrollToTop from "./ScrollToTop.jsx";

function AppLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <ScrollToTop />
      <main className="app-shell__content">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}

export default AppLayout;
