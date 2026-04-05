import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import api, { AUTH_TOKEN_KEY } from "../services/api.js";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const [role, setRole] = useState(null);

  const recordsNavActive =
    location.pathname === "/" || location.pathname === "/records";

  useEffect(() => {
    if (!token) {
      setRole(null);
      return undefined;
    }
    let cancelled = false;
    api
      .get("/api/me")
      .then((res) => {
        if (!cancelled) setRole(res.data.user?.role ?? null);
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    navigate("/login", { replace: true });
  }

  const showDashboard = role === "ANALYST" || role === "ADMIN";

  return (
    <header className="site-navbar">
      <Link to="/" className="nav-brand">
        <span className="nav-brand-mark">FH</span>
        FinHub
      </Link>
      <nav className="nav-links" aria-label="Main">
        {token ? (
          <>
            {showDashboard ? (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                Dashboard
              </NavLink>
            ) : null}
            <NavLink
              to="/"
              className={() =>
                recordsNavActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              Records
            </NavLink>
            {role === "ADMIN" ? (
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                Users
              </NavLink>
            ) : null}
            <button type="button" className="nav-logout" onClick={logout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              Log in
            </NavLink>
            <NavLink
              to="/register"
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              Register
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
