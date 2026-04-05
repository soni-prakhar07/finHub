import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";

export default function Layout() {
  return (
    <div className="app-layout app-shell">
      <Navbar />
      <Outlet />
    </div>
  );
}
