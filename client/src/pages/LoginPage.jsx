import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api, { AUTH_TOKEN_KEY } from "../services/api.js";
import { getApiErrorMessage } from "../utils/apiError.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.message;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      if (data.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <h1>Log in</h1>
      {notice ? <p className="auth-notice">{notice}</p> : null}
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="auth-footer">
        No account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}
