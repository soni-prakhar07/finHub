import { Link } from "react-router-dom";
import { AUTH_TOKEN_KEY } from "../services/api.js";
import RecordsPage from "./RecordsPage.jsx";

export default function HomePage() {
  const hasToken = Boolean(localStorage.getItem(AUTH_TOKEN_KEY));

  if (hasToken) {
    return <RecordsPage />;
  }

  return (
    <main className="home-page home-landing">
      <p className="home-eyebrow">Welcome</p>
      <h1>FinHub</h1>
      <p className="home-tagline">
        Track income and expenses, understand trends, and keep your team aligned.
      </p>
      <div className="home-nav">
        <Link to="/login" className="home-cta home-cta-primary">
          Log in
        </Link>
        <Link to="/register" className="home-cta home-cta-secondary">
          Create account
        </Link>
      </div>
    </main>
  );
}
